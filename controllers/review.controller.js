import { asyncHandler } from "../middlewares/error.js";
import Review from "../models/review.modal.js";
import { uploadFile, deleteFile } from "../utils/features.js";
import Product from "../models/product.model.js";
import { SendError } from "../utils/sendError.js";


export const createReview = asyncHandler(async (req, res, next) => {
  const userId = req.user; 

  if (!userId) {
    return next(new SendError("User not found", 404));
  }

  const { productId, rating, comment } = req.body;

 
  if (!productId) {
    return next(new SendError("Product ID is required", 400));
  }

  const validRating = parseFloat(rating);
  if (isNaN(validRating) || validRating < 1 || validRating > 5) {
    return next(new SendError("Rating must be a number between 1 and 5", 400));
  }

  if (!comment || comment.trim() === '') {
    return next(new SendError("Comment is required", 400));
  }


  const alreadyReviewed = await Review.findOne({ user: userId, product: productId });
  if (alreadyReviewed) {
    return next(new SendError("You have already reviewed this product", 400));
  }

 
  let image = [];
  if (req.file) {
    try {
      const uploadedImages = await uploadFile([req.file]);
      image = uploadedImages.map(file => ({
        public_id: file.public_id,
        url: file.url,
      }));
    } catch (error) {
      console.error("Error uploading images:", error);
      return next(new SendError("Failed to upload image", 500));
    }
  }


  const review = new Review({
    user: userId,
    product: productId,
    rating: validRating,
    comment,
    image,
  });

  try {
    await review.save();
  } catch (error) {
    console.error("Error saving review:", error);
    return next(new SendError("Failed to create review", 500));
  }


  try {
    const product = await Product.findById(productId).populate("reviews");
    if (!product) {
      return next(new SendError("Product not found", 404));
    }

    product.reviews.push(review);
    product.numReviews = product.reviews.length;


    console.log("Product Reviews:", product.reviews);

  
    const totalRating = product.reviews.reduce((acc, item) => acc + (item.rating || 0), 0);
    console.log("Total Rating:", totalRating);
    console.log("Number of Reviews:", product.reviews.length);

    const newRating = totalRating / product.reviews.length;
    console.log("New Calculated Rating:", newRating);

 
    if (isNaN(newRating) || newRating === Infinity || newRating === -Infinity) {
      console.error("Invalid rating calculation. Total rating:", totalRating, "Reviews count:", product.reviews.length);
      return next(new SendError("Failed to calculate valid product rating", 500));
    }

    product.rating = newRating;

 
    await product.save();

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      review,
      updatedProduct: {
        rating: product.rating,
        numReviews: product.numReviews,
      },
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return next(new SendError("Failed to update product", 500));
  }
});


export const deleteReview = asyncHandler(async (req, res, next) => {
  const id = req.params.id;


  const review = await Review.findById(id);
  if (!review) {
    return next(new SendError("Review not found", 404));
  }

 
  const product = await Product.findById(review.product);
  if (!product) {
    return next(new SendError("Product not found", 404));
  }

 
  if (review.image && Array.isArray(review.image)) {
    await deleteFile(review.image.map((image) => image.public_id));
  } else if (review.image) {
    await deleteFile([review.image.public_id]);
  }


  await Review.findByIdAndDelete(id);

  product.reviews = product.reviews.filter(
    (item) => item._id.toString() !== id
  );


  let newRating = 0;
  if (product.reviews.length > 0) {
    const totalRating = product.reviews.reduce((acc, item) => item.rating + acc, 0);
    newRating = totalRating / product.reviews.length;
  }

  
  product.rating = newRating;
  product.numReviews = product.reviews.length;


  await product.save();

 
  res.status(200).json({
    success: true,
    message: "Review Deleted Successfully",
  });
});


export const getReviews = asyncHandler(async (req, res, next) => {
  const id = req.params.id;

  const product = await Product.findById(id);
  if (!product) {
    return next(new SendError("Product not found", 404));
  }

  const reviews = await Review.find({ product: id }).populate("user", "name avatar");

 
  res.status(200).json({
    success: true,
    reviews,
  });
});
