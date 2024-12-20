import express from "express";
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  newProducts,
  searchProducts,
} from "../controllers/product.controller.js";
import { productUpload } from "../middlewares/multer.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/search", searchProducts);
router.get("/new-arrivals", newProducts);
router.route("/:id").get(getProductById).delete(deleteProduct);
router.post("/create", productUpload, createProduct);

export default router;
