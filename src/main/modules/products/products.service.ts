import { and, eq, ne, SQL, sql } from "drizzle-orm";
import {
  PRODUCT_FILTER,
  type ApiResponse,
  type CreateProductPayload,
  type ProductHistory,
  type UpdateProductPayload
} from "../../../shared/types";
import { formatToPaisa, formatToRupees } from "../../../shared/utils/utils";
import { products } from "../../db/schema";
import { generateProductSnapshot } from "../../utils/product.utils";
import { productRepository } from "./products.repository";
import type { ProductSearchParams } from "./products.types";

const searchProduct = async (params: ProductSearchParams) => {
  try {
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
      status: "success",
      nextPageNo: nextpageNo,
      data: searchResult.length > 0 ? searchResult : []
    };
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      error: { message: (error as Error).message ?? "Could not search Products" }
    };
  }
};

const addProduct = async (payload: CreateProductPayload): Promise<ApiResponse<string>> => {
  try {
    const product = await productRepository.createProduct(payload);

    return {
      status: "success",
      data: `Successfully created product: ${product.name}`
    };
  } catch (error) {
    console.log(error);
    return { status: "error", error: { message: "Could not add a new Product" } };
  }
};

const updateProduct = async (
  productId: string,
  payload: Partial<UpdateProductPayload>
): Promise<ApiResponse<string>> => {
  try {
    const currencyFields = ["price", "purchasePrice", "mrp"] as const;

    const existingProduct = await productRepository.findById(productId);
    if (!existingProduct) {
      return {
        status: "error",
        error: {
          message: "Product not found"
        }
      };
    }
    const updatedFields = {};

    for (const field in payload) {
      const value = payload[field];
      if (value === undefined) {
        continue;
      }

      if (currencyFields.includes(field as any)) {
        if (value === null) {
          updatedFields[field] = null;
        } else {
          updatedFields[field] = formatToPaisa(value);
        }
      } else {
        updatedFields[field] = value;
      }
    }

    // disabled state
    const isDisabledProvided = Object.keys(payload).includes("isDisabled");

    if (isDisabledProvided && existingProduct.isDisabled !== payload.isDisabled) {
      const disabledAt = payload.isDisabled ? sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))` : null;
      updatedFields["disabledAt"] = disabledAt;
    }

    let updatedProduct = await productRepository.updateById(productId, updatedFields);
    if (!updatedProduct) throw new Error("Failed to update product");

    const snapshotName = generateProductSnapshot({
      name: updatedProduct.name,
      weight: updatedProduct.weight,
      unit: updatedProduct.unit,
      mrp: updatedProduct.mrp ? formatToRupees(updatedProduct.mrp) : null
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

      currencyFields.forEach((field) => {
        if (existingProduct[field] !== updatedProduct[field]) {
          historyObj[`old${cap(field)}`] = existingProduct[field];
          historyObj[`new${cap(field)}`] = updatedProduct[field];
        }
      });

      await productRepository.insertHistory(historyObj);
    }

    return {
      status: "success",
      data: `Successfully updated product: ${updatedProduct.name}`
    };
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      error: { message: (error as Error).message ?? "Could not update Product" }
    };
  }
};

const deleteProduct = async (productId: string): Promise<ApiResponse<string>> => {
  try {
    const changes = await productRepository.deleteProductById(productId);

    if (changes === 0) {
      return {
        status: "error",
        error: { message: "No product was deleted. Database changes were 0." }
      };
    }
    return { status: "success", data: "Successfully deleted product" };
  } catch (error) {
    if ((error as Error).message === "IN_USE") {
      return {
        status: "error",
        error: {
          message: "Cannot delete product. It is already used in existing sales or estimates."
        }
      };
    }
    return { status: "error", error: { message: "Could not delete Product" } };
  }
};

export const productService = {
  searchProduct,
  addProduct,
  updateProduct,
  deleteProduct
};
