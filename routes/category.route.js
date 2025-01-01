import express from "express";
import {
  createCategory,

  deleteCategoris,

  getCategories,
  getCategoriesFOrWhat,

} from "../controllers/category.controller.js";

const router = express.Router();
router.post("/create", createCategory);
router.get("/", getCategories);
router.get("/what/:forWhat", getCategoriesFOrWhat);
router.route("/:id").delete(deleteCategoris);

export default router;
