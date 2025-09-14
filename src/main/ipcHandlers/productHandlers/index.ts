import { addNewProduct } from "./addNewProduct";
import { getAllProducts } from "./getAllProducts";
import { searchProduct } from "./searchProduct";
import { updateProduct } from "./updateProduct";

export function productHandlers() {
  getAllProducts();
  addNewProduct();
  updateProduct();
  searchProduct();
}
