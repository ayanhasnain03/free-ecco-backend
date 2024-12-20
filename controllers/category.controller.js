import Category from "../models/category.model.js";

import { SendError } from "../utils/sendError.js";
import { asyncHandler } from "../middlewares/error.js";

export const createCategory = asyncHandler(async (req, res, next) => {

  const { name } = req.body;

  const existCategory = await Category.findOne({ name });
  if (existCategory) return next(new SendError("Category already exists", 400));

  const category = await Category.create({ name });
  res.status(201).json({
    success: true,
    message: "Category Created Successfully",
    category,
  });
});



export const getCategories = asyncHandler(async (req, res, next) => {
  const { forWhat } = req.query; 


  const validForValues = ["mens", "womens", "kids"];
  if (forWhat && !validForValues.includes(forWhat)) {
    return next(new SendError("Invalid 'forWhat' value. It must be 'men', 'women', or 'kids'.", 400));
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
      $match: forWhat ? { "products.for": forWhat } : {}, 
    },
    {
      $group: {
        _id: "$_id", 
        name: { $first: "$name" }, 
      },
    },
  ]);

 
  if (categories.length === 0) {
    return next(new SendError("No categories found", 404));
  }

  res.json({
    success: true,
    categories, screenX
  });
});
