import express from "express";
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  getRelatedProducts,
  newProducts,
  searchProducts,
  topSellingProducts,
} from "../controllers/product.controller.js";
import { productUpload } from "../middlewares/multer.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/top-selling",topSellingProducts)
router.get("/search", searchProducts);
router.get("/related/:categoryID", getRelatedProducts);
router.get("/new-arrivals", newProducts);
router.route("/:id").get(getProductById).delete(deleteProduct);
router.post("/create", productUpload, createProduct);


export default router;
