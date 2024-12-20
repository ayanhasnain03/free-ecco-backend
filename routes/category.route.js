import express from "express";
import {
  createCategory,
  getCategories,
} from "../controllers/category.controller.js";
import { categoryUpload } from "../middlewares/multer.js";
const router = express.Router();
router.post("/create", createCategory);
router.get("/", getCategories);
export default router;
