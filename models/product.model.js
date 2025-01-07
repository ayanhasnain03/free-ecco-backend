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
    for:[
      {
        type: String,
        required: true,
        enum: ["mens", "womens", "kids"],
    }],
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    sale: {
      type: Boolean,
      required: true,
      default: false,
    },
    isFav: {
      type: Boolean,
      required: true,
      default: false,
    },
    isLocked: { type: Boolean, default: false },
    version: { type: Number, default: 0 },
  },
  { timestamps: true }
);


productSchema.index({ name: 1 });
const Product = mongoose.model("Product", productSchema);

export default Product;
