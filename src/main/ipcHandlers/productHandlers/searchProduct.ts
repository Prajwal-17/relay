import { and, desc, eq, like, ne, SQL } from "drizzle-orm";
import { ipcMain } from "electron/main";
import {
  PRODUCT_FILTER,
  type PageNo,
  type PaginatedApiResponse,
  type ProductFilterType,
  type ProductsType
} from "../../../shared/types";
import { formatToRupees } from "../../../shared/utils/utils";
import { db } from "../../db/db";
import { products } from "../../db/schema";

export function searchProduct() {
  ipcMain.handle(
    "productsApi:search",
    async (
      _event,
      query: string,
      pageNo: PageNo,
      limit: number,
      filterType?: ProductFilterType
    ): Promise<PaginatedApiResponse<ProductsType[] | []>> => {
      try {
        if (pageNo === null || pageNo === undefined) {
          return {
            status: "success",
            nextPageNo: null,
            data: []
          };
        }

        let whereClause: SQL;

        switch (filterType) {
          case PRODUCT_FILTER.ALL:
            whereClause = ne(products.isDeleted, true);
            break;
          case PRODUCT_FILTER.INACTIVE:
            whereClause = and(ne(products.isDeleted, true), eq(products.isDisabled, true))!;
            break;
          case PRODUCT_FILTER.ACTIVE:
          default:
            whereClause = and(ne(products.isDeleted, true), ne(products.isDisabled, true))!;
        }

        const searchTerms = query.trim();

        const offset = (pageNo - 1) * limit;

        let searchResult: ProductsType[] | [];

        if (searchTerms.length === 0) {
          searchResult = await db
            .select({
              id: products.id,
              name: products.name,
              productSnapshot: products.productSnapshot,
              weight: products.weight,
              unit: products.unit,
              mrp: products.mrp,
              price: products.price,
              purchasePrice: products.purchasePrice,
              totalQuantitySold: products.totalQuantitySold,
              isDisabled: products.isDisabled
            })
            .from(products)
            .where(whereClause)
            .orderBy(products.productSnapshot)
            .limit(limit)
            .offset(offset);
        } else {
          searchResult = await db
            .select({
              id: products.id,
              name: products.name,
              productSnapshot: products.productSnapshot,
              weight: products.weight,
              unit: products.unit,
              mrp: products.mrp,
              price: products.price,
              purchasePrice: products.purchasePrice,
              totalQuantitySold: products.totalQuantitySold,
              isDisabled: products.isDisabled
            })
            .from(products)
            .where(and(whereClause, like(products.productSnapshot, `${searchTerms}%`)))
            .orderBy(desc(products.totalQuantitySold))
            .limit(limit)
            .offset(offset);
        }

        const nextpageNo = searchResult.length === 20 ? pageNo + 1 : null;

        return {
          status: "success",
          nextPageNo: nextpageNo,
          data:
            searchResult.length > 0
              ? searchResult.map((product) => ({
                  ...product,
                  mrp: product.mrp && formatToRupees(product.mrp),
                  price: formatToRupees(product.price),
                  purchasePrice: product.purchasePrice && formatToRupees(product.purchasePrice)
                }))
              : []
        };
      } catch (error) {
        console.log(error);
        return { status: "error", error: { message: "Could not search Products" } };
      }
    }
  );
}
