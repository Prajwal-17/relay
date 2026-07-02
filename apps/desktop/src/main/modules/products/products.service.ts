import { and, asc, desc, eq, gte, isNotNull, lte, ne, SQL, sql } from "drizzle-orm";
import {
  PRODUCT_FILTER,
  PRODUCT_SORT_BY,
  type BillingProductDTO,
  type CreateProductPayload,
  type PaginatedApiResponse,
  type ProductHistory,
  type ProductSearchItemDTO,
  type ProductTransaction,
  type UpdateProductPayload
} from "../../../shared/types";
import { generateProductSnapshot } from "../../../shared/utils/productSnapshot";
import { paisaToRupees } from "../../../shared/utils/utils";
import { products } from "../../db/schema";
import { AppError } from "../../utils/appError";
import { productRepository } from "./products.repository";
import type { ProductSearchParams } from "./products.types";

function buildOrderClause(sortBy: string | null): SQL | undefined {
  if (!sortBy) return undefined;

  switch (sortBy) {
    case PRODUCT_SORT_BY.NAME_ASC:
      return asc(products.name);
    case PRODUCT_SORT_BY.NAME_DESC:
      return desc(products.name);
    case PRODUCT_SORT_BY.PRICE_LOW_HIGH:
      return asc(products.price);
    case PRODUCT_SORT_BY.PRICE_HIGH_LOW:
      return desc(products.price);
    case PRODUCT_SORT_BY.MRP_LOW_HIGH:
      return asc(products.mrp);
    case PRODUCT_SORT_BY.MRP_HIGH_LOW:
      return desc(products.mrp);
    default:
      return undefined;
  }
}

const getProductById = async (productId: string) => {
  const product = await productRepository.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  return product;
};

const searchProduct = async (
  params: ProductSearchParams
): Promise<PaginatedApiResponse<{ data: (ProductSearchItemDTO | BillingProductDTO)[] | [] }>> => {
  let whereClause: SQL | undefined;

  switch (params.filterType) {
    case PRODUCT_FILTER.ALL:
      whereClause = ne(products.isDeleted, true);
      break;
    case PRODUCT_FILTER.INACTIVE:
      whereClause = and(ne(products.isDeleted, true), eq(products.isDisabled, true))!;
      break;
    case PRODUCT_FILTER.DELETED:
      whereClause = eq(products.isDeleted, true);
      break;
    case PRODUCT_FILTER.ACTIVE:
    default:
      whereClause = and(ne(products.isDeleted, true), ne(products.isDisabled, true))!;
  }

  if (params.priceMin !== null) {
    whereClause = and(whereClause, gte(products.price, params.priceMin));
  }
  if (params.priceMax !== null) {
    whereClause = and(whereClause, lte(products.price, params.priceMax));
  }

  if (params.hasMrp) {
    whereClause = and(whereClause, isNotNull(products.mrp));
  }
  if (params.hasPurchasePrice) {
    whereClause = and(whereClause, isNotNull(products.purchasePrice));
  }

  const offset = (params.pageNo - 1) * params.pageSize;

  const orderClause = buildOrderClause(params.sortBy);

  const [searchResult, totalCount] = await Promise.all([
    productRepository.searchProducts({
      searchTerm: params.query,
      whereClause,
      orderClause,
      limit: params.pageSize,
      offset,
      billingMode: params.billingMode
    }),
    productRepository.countSearchProducts({
      searchTerm: params.query,
      whereClause
    })
  ]);

  const nextpageNo = searchResult.length === 20 ? params.pageNo + 1 : null;

  return {
    nextPageNo: nextpageNo,
    totalCount,
    data: searchResult.length > 0 ? searchResult : []
  };
};

const addProduct = async (payload: CreateProductPayload): Promise<{ id: string; name: string }> => {
  const product = await productRepository.createProduct(payload);
  return {
    id: product.id,
    name: product.name
  };
};

const updateProduct = async (
  productId: string,
  payload: Partial<UpdateProductPayload>
): Promise<{ id: string; name: string }> => {
  const existingProduct = await productRepository.findById(productId);

  if (!existingProduct) {
    throw new AppError("Product not found", 400);
  }
  const updatedFields = {};

  for (const field in payload) {
    let value = payload[field as keyof Partial<UpdateProductPayload>];
    if (value === undefined) {
      continue;
    }
    if (field === "unit" && value === "none") {
      value = null;
    }

    updatedFields[field] = value;
  }

  // disabled state
  const isDisabledProvided = Object.keys(payload).includes("isDisabled");

  if (isDisabledProvided && existingProduct.isDisabled !== payload.isDisabled) {
    const disabledAt = payload.isDisabled ? sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))` : null;
    updatedFields["disabledAt"] = disabledAt;
  }

  let updatedProduct = await productRepository.updateById(productId, updatedFields);
  if (!updatedProduct) throw new AppError("Failed to update product", 400);

  const snapshotName = generateProductSnapshot({
    name: updatedProduct.name,
    weight: updatedProduct.weight,
    unit: updatedProduct.unit,
    mrp: updatedProduct.mrp ? paisaToRupees(updatedProduct.mrp) : null
  });

  // update productSnapshot
  if (updatedProduct.productSnapshot !== snapshotName) {
    updatedProduct = await productRepository.updateById(productId, {
      productSnapshot: snapshotName
    });
  }

  // history insert
  // only insert when price,mrp,purchase price changes
  if (
    existingProduct.price !== updatedProduct.price ||
    existingProduct.mrp !== updatedProduct.mrp ||
    existingProduct.purchasePrice !== updatedProduct.purchasePrice
  ) {
    function cap(s: string) {
      return s.charAt(0).toUpperCase() + s.slice(1);
    }

    const historyObj: Partial<ProductHistory> = {
      name: updatedProduct.name,
      weight: updatedProduct.weight,
      unit: updatedProduct.unit,
      productId: updatedProduct.id
    };

    const currencyFields = ["price", "purchasePrice", "mrp"] as const;
    currencyFields.forEach((field) => {
      if (existingProduct[field] !== updatedProduct[field]) {
        historyObj[`old${cap(field)}`] = existingProduct[field];
        historyObj[`new${cap(field)}`] = updatedProduct[field];
      }
    });

    await productRepository.insertHistory(historyObj);
  }

  return {
    id: updatedProduct.id,
    name: updatedProduct.name
  };
};

const getHistoryEntriesById = async (productId: string) => {
  const entries = await productRepository.getHistoryEntriesById(productId);
  return {
    productId,
    entries
  };
};

const softDeleteProduct = async (productId: string) => {
  const changes = await productRepository.softDeleteProductById(productId);
  if (changes === 0) {
    throw new AppError("No product was deleted.", 400);
  }
};

const hardDeleteProduct = async (productId: string) => {
  const changes = await productRepository.hardDeleteProductById(productId);
  if (changes === 0) {
    throw new AppError("No product was deleted.", 400);
  }
};

const restoreProduct = async (productId: string) => {
  const changes = await productRepository.restoreSoftDeletedProductById(productId);
  if (changes === 0) {
    throw new AppError("No product was restored.", 400);
  }
};

const getTransactionsByProductId = async (
  productId: string,
  params: { pageNo: number; pageSize: number }
): Promise<PaginatedApiResponse<{ data: ProductTransaction[] }>> => {
  const offset = (params.pageNo - 1) * params.pageSize;

  const [transactions, totalCount] = await Promise.all([
    productRepository.getTransactionsByProductId({
      productId,
      pageSize: params.pageSize,
      offset
    }),
    productRepository.countTransactionsByProductId(productId)
  ]);

  const nextPageNo = transactions.length === params.pageSize ? params.pageNo + 1 : null;

  return {
    nextPageNo,
    totalCount,
    data: transactions.length > 0 ? (transactions as ProductTransaction[]) : []
  };
};

export const productService = {
  getProductById,
  searchProduct,
  addProduct,
  updateProduct,
  getHistoryEntriesById,
  softDeleteProduct,
  hardDeleteProduct,
  restoreProduct,
  getTransactionsByProductId
};
