import { and, eq, ne, SQL, sql } from "drizzle-orm";
import {
  PRODUCT_FILTER,
  type CreateProductPayload,
  type PaginatedApiResponse,
  type ProductHistory,
  type ProductSearchItemDTO,
  type UpdateProductPayload
} from "../../../shared/types";
import { convertToRupees } from "../../../shared/utils/utils";
import { products } from "../../db/schema";
import { AppError } from "../../utils/appError";
import { generateProductSnapshot } from "../../utils/product.utils";
import { productRepository } from "./products.repository";
import type { ProductSearchParams } from "./products.types";

const searchProduct = async (
  params: ProductSearchParams
): Promise<PaginatedApiResponse<{ data: ProductSearchItemDTO[] | [] }>> => {
  let whereClause: SQL;

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

  const offset = (params.pageNo - 1) * params.pageSize;

  const searchResult = await productRepository.searchProducts({
    searchTerm: params.query,
    whereClause,
    limit: params.pageSize,
    offset
  });

  const nextpageNo = searchResult.length === 20 ? params.pageNo + 1 : null;

  return {
    nextPageNo: nextpageNo,
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
    const value = payload[field];
    if (value === undefined) {
      continue;
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
    mrp: updatedProduct.mrp ? convertToRupees(updatedProduct.mrp) : null
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

const deleteProduct = async (productId: string) => {
  const changes = await productRepository.deleteProductById(productId);
  if (changes === 0) {
    throw new AppError("No product was deleted.", 400);
  }
};

export const productService = {
  searchProduct,
  addProduct,
  updateProduct,
  deleteProduct
};
