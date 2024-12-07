import Category from "../models/category.model.js";
import { uploadFile } from "../utils/features.js";
import { SendError } from "../utils/sendError.js";
import { asyncHandler } from "../middlewares/error.js";

export const createCategory = asyncHandler(async (req, res, next) => {
  const file = req.file || [];
  const { name } = req.body;

  const existCategory = await Category.findOne({ name });
  if (existCategory) return next(new SendError("Category already exists", 400));

  const result = await uploadFile([file]);
  const image = {
    public_id: result[0].public_id,
    url: result[0].url,
  };
  const category = await Category.create({ name, image });
  res.status(201).json({
    success: true,
    message: "Category Created Successfully",
    category,
  });
});
export const getCategories = asyncHandler(async (req, res, next) => {
  const categories = await Category.find();
  res.json({
    success: true,
    categories,
  });
});
