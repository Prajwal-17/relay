import { addNewProduct } from "./addNewProduct";
import { deleteProduct } from "./deletedProduct";
import { getAllProducts } from "./getAllProducts";
import { searchProduct } from "./searchProduct";
import { updateProduct } from "./updateProduct";

export function productHandlers() {
  getAllProducts();
  addNewProduct();
  updateProduct();
  deleteProduct();
  searchProduct();
}
