import { asyncHandler } from "../middlewares/error.js";
import Category from "../models/category.model.js";
import Product from "../models/product.model.js";

import { uploadFile } from "../utils/features.js";
import { SendError } from "../utils/sendError.js";
import cloudinary from "cloudinary";
export const getProducts = asyncHandler(async (req, res, next) => {
  const { category, price, brand, sort, discount, sizes, forwhat,rating } = req.query;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 8;
  const skip = (page - 1) * limit;

  const baseQuery = {};

  if (forwhat) {
  
    baseQuery.for = forwhat;
  }
if(rating){
  baseQuery.rating = rating;
}
  if (category) {
    const categoryId = await Category.findOne({ name: category }).select("_id");
    if (categoryId) {
      baseQuery.category = categoryId;
    }
  }

  if (brand) {
    const brandArray = brand.split(",");
    baseQuery.brand = { $in: brandArray };
  }

  if (sizes) {
    const sizeArray = sizes.split(",");
    baseQuery.sizes = { $all: sizeArray };
  }

  if (price) {
    const [minPrice, maxPrice] = price.split("-").map((p) => parseFloat(p));
    if (!isNaN(minPrice) && !isNaN(maxPrice)) {
      baseQuery.price = { $gte: minPrice, $lte: maxPrice };
    }
  }

  if (discount) {
    baseQuery.discount = discount;
  }

  let sortQuery = { createdAt: -1 };

  if (sort) {
    switch (sort) {
      case "price-asc":
        sortQuery = { price: 1 };
        break;
      case "price-desc":
        sortQuery = { price: -1 };
        break;
      case "rating-asc":
        sortQuery = { rating: 1 };
        break;
      case "rating-desc":
        sortQuery = { rating: -1 };
        break;
      case "createdAt_asc":
        sortQuery = { createdAt: 1 };
        break;
      case "createdAt_desc":
        sortQuery = { createdAt: -1 };
        break;
      default:
        sortQuery = { createdAt: -1 };
    }
  }

  try {
    const products = await Product.find(baseQuery)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .populate("category", "name");
  
    const totalProducts = await Product.countDocuments(baseQuery);
    const totalPage = Math.ceil(totalProducts / limit);

    res.status(200).json({
      totalPage,
      totalProducts,
      products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


export const searchProducts = asyncHandler(async (req, res, next) => {
  const { keyword } = req.query;

  if (!keyword || keyword.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Keyword is required for searching.",
    });
  }

  
  const products = await Product.find({
    $or: [
      { name: { $regex: keyword, $options: "i" } },
      { description: { $regex: keyword, $options: "i" } },
    ],
  }) .select("name description images") 
  .populate("category", "name");

  res.status(200).json({
    success: true,
    products,
  });
});


export const getProductById = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const product = await Product.findById(id).populate("category", "name").populate({
    path: "reviews",
    populate: {
      path: "user",
      select: "name avatar",
    },
  });
  if (!product) return next(new SendError("Product not found", 404));
  res.status(200).json({
    success: true,
    product,
  });
});

export const deleteProduct = asyncHandler(async (req, res, next) => {
  const id = req.params.id;

  const product = await Product.findById(id);
  if (!product) {
    return next(new SendError("Product not found", 404));
  }

  try {
    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        await cloudinary.v2.uploader.destroy(image.public_id);
      }
      await Product.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: "Product deleted successfully",
      });
    } else {
      return next(new SendError("No images found for this product", 404));
    }
  } catch (error) {
    return next(new SendError("Failed to delete product images", 500));
  }
});

export const createProduct = asyncHandler(async (req, res, next) => {
  const files = req.files || [];
  const { name, description, price, brand, stock, category, sizes,for:forwhat } =
    req.body;

  const categoryID = await Category.findOne({ name: category }).select("_id");
  if (!categoryID) {
    return next(new SendError("Category not found", 404));
  }
  if (
    !name ||
    !description ||
    !price ||
    !brand ||
    !stock ||
    !categoryID ||
    !sizes ||
    files.length === 0
  ) {
    return next(
      new SendError("All fields and at least one image are required", 400)
    );
  }
  try {

    const uploadResults = await uploadFile(files);
    const images = uploadResults.map((file) => ({
      public_id: file.public_id,
      url: file.url,
    }));
    
    const product = await Product.create({
      name,
      description,
      price,
      brand,
      stock,
      images,
      sizes,
      category: categoryID,
      for:forwhat
    });
    res.status(201).json({
      success: true,
      message: "Product Created Successfully",
      product,
    });
  } catch (error) {
    return next(new SendError(error.message || "Failed to upload files", 500));
  }
});

export const newProducts = asyncHandler(async (req, res, next) => {
  const products = await Product.find().sort({ createdAt: -1 }).limit(4);
  res.status(200).json({
    success: true,
    products,
  });
});

export const topSellingProducts = asyncHandler(async (req, res, next) => {
  const products = await Product.find().sort({ sold: -1 }).limit(4);
  res.status(200).json({
    success: true,
    products,
  });
});


export const getRelatedProducts = asyncHandler(async (req, res, next) => {
  const { categoryID } = req.params; 

  const products = await Product.find({ category: categoryID })
    .limit(4)
    .populate("category", "name _id");  

  if (!products || products.length === 0) {
    return res.status(404).json({
      success: false,
      message: "No products found for this category",
    });
  }
  res.status(200).json({
    success: true,
    products,
  });
});



