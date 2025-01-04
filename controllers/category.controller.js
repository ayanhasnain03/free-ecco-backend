import Category from "../models/category.model.js";

import { SendError } from "../utils/sendError.js";
import { asyncHandler } from "../middlewares/error.js";

export const createCategory = asyncHandler(async (req, res, next) => {
  const { name, forWhat } = req.body;

  const existCategory = await Category.findOne({ name });
  if (existCategory) return next(new SendError("Category already exists", 400));

  const category = await Category.create({ name, forWhat });
  res.status(201).json({
    success: true,
    message: "Category Created Successfully",
    category,
  });
});

export const getCategories = asyncHandler(async (req, res, next) => {
  const { forwhat } = req.query;
  const validForValues = ["mens", "womens", "kids"];

  if (forwhat && !validForValues.includes(forwhat.toLowerCase())) {
    return next(
      new SendError(
        "Invalid 'forwhat' value. It must be 'mens', 'womens', or 'kids'.",
        400
      )
    );
  }

  const categories = await Category.aggregate([
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "category",
        as: "products",
      },
    },
    {
      $match: forwhat
        ? { "products.for": { $regex: new RegExp(`^${forwhat}$`, "i") } }
        : {},
    },
    {
      $group: {
        _id: "$_id",
        name: { $first: "$name" },
      },
    },
  ]);
  if (!categories) return next(new SendError("No categories found", 404));

  if (categories.length === 0) {
    return next(new SendError("No categories found", 404));
  }

  res.json({
    success: true,
    categories,
  });
});

export const getCategoriesFOrWhat = asyncHandler(async (req, res, next) => {
  const { forWhat } = req.params;

  const categories = await Category.find({
    forWhat: { $regex: new RegExp(`^${forWhat}$`, "i") },
  });

  if (!categories || categories.length === 0) {
    return next(new SendError("No categories found", 404));
  }

  res.status(200).json({
    success: true,
    categories,
  });
});

export const deleteCategoris = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const category = await Category.findByIdAndDelete(id);
  if (!category) return next(new SendError("Category not found", 404));
  res.status(200).json({
    success: true,
    message: "Category deleted successfully",
  });
});
