import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Shipped", "Delivered", "Canceled", "Returned"],
      default: "Pending",
    },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Unpaid", "Pending"],
      default: "Unpaid",
    },
    paymentMethod: {
      type: String,
      enum: ["razorpay", "COD"],
      required: true,
    },
    transactionId: {
      type: String,
      required: false,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerPhoneNumber: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/, 
    },
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    estimatedDelivery: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        image: { type: String, required: true },
        size: { type: String, required: true },
      },
    ],
    discounts: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingCharge:{
      type:Number,
      required:true
    }
  },
  { timestamps: true }
);

orderSchema.index({ orderId: 1 });
orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;
