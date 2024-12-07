import express from "express";
import {
  createProduct,
  getProducts,
} from "../controllers/product.controller.js";
import { productUpload } from "../middlewares/multer.js";

const router = express.Router();

router.get("/", getProducts);
router.post("/create", productUpload, createProduct);

export default router;
