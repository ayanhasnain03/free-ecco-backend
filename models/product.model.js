import mongoose from "mongoose";
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    images: [
      {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    ],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      default: 0,
    },
    numReviews: {
      type: Number,
      required: true,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      required: true,
      default: 0,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    sold: {
      type: Number,
      required: true,
      default: 0,
    },
    sizes: [
      {
        type: String,
        required: true,
        enum: ["S", "M", "L", "XL", "XXL"],
      },
    ],
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
  },
  { timestamps: true }
);

productSchema.methods.updateProductRating = async function () {
  const reviews = await mongoose.model("Review").find({ product: this._id });
  const totalReviews = reviews.length;

  if (totalReviews > 0) {
    const avgRating =
      reviews.reduce((acc, review) => acc + review.rating, 0) / totalReviews;

    this.rating = avgRating;
    this.numReviews = totalReviews;
  } else {
    this.rating = 0;
    this.numReviews = 0;
  }

  await this.save();
};

const Product = mongoose.model("Product", productSchema);

export default Product;
