import mongoose from "mongoose";
import { asyncHandler } from "../middlewares/error.js";
import { User } from "../models/user.modal.js";
import Order from "../models/order.model.js";
import { SendError } from "../utils/sendError.js";
import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";
import Product from "../models/product.model.js";

const generateInvoiceBuffer = async (order, user) => {
  const doc = new PDFDocument({ size: "A4" });
  const buffers = [];

  return new Promise((resolve, reject) => {
    try {
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      doc
        .image("public/logo.jpg", 50, 20, { width: 100 })
        .fontSize(22)
        .text("INVOICE", { align: "center" })
        .moveDown(1);

      doc.fontSize(10).text("Fash Alt", { align: "center" });
      doc.text("123 Business St, City, Country", { align: "center" });
      doc.text("Phone: +1234567890 | Email: example@example.com", {
        align: "center",
      });
      doc.moveDown(2);

      doc.fontSize(12).text(`Order ID: ${order.orderId}`);
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
      doc.text(
        `Estimated Delivery: ${new Date(order.estimatedDelivery).toLocaleDateString()}`
      );
      doc.moveDown(1);

      doc.text(`Customer: ${user.name}`);
      doc.text(`Phone: ${order.customerPhoneNumber}`);
      doc.text(`Email: ${user.email}`);
      doc.moveDown(1);

      doc.text("Shipping Address:", { underline: true });
      doc.text(`${order.shippingAddress.street}`);
      doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state}`);
      doc.text(
        `${order.shippingAddress.zipCode}, ${order.shippingAddress.country}`
      );
      doc.moveDown(1);

      doc.text("Items:", { underline: true });
      doc.text("---------------------------------------------------------");

      order.items.forEach((item) => {
        doc.text(
          `${item.name} x ${item.quantity} - $${item.price} each`
        );
      });

      doc.moveDown(1);
      doc.text("---------------------------------------------------------");

      doc.text(`Subtotal: $${order.subtotal}`);
      doc.text(`Discounts: -$${order.discounts}`);
      doc.text(`Tax: $${order.tax}`);
      doc.text(`Total: $${order.total}`);
      doc.moveDown(1);

      doc.fontSize(10).text("Thank you for your purchase!", { align: "center" });

      doc.end();
    } catch (err) {
      console.error("Error during PDF generation:", err.message);
      reject(new SendError(`PDF generation failed: ${err.message}`, 500));
    }
  });
};


const sendInvoiceEmail = async (userEmail, pdfBuffer) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: "Your Order Invoice",
    text: "Thank you for your order! Please find your invoice attached.",
    attachments: [
      {
        filename: "invoice.pdf",
        content: pdfBuffer,
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    return info.response;
  } catch (error) {
    console.error("Failed to send email:", error.message);
    throw new SendError(`Failed to send email: ${error.message}`, 500);
  }
};


export const createOrder = asyncHandler(async (req, res, next) => {
  const {
    userId,
    items,
    paymentMethod,
    shippingAddress,
    discounts = 0,
    tax = 0,
    subtotal,
    total,
    customerPhoneNumber,
    customerName,
    razorpayOrderId,
  } = req.body;

 
  if (
    !userId ||
    !items ||
    items.length === 0 ||
    !paymentMethod ||
    !shippingAddress ||
    !subtotal ||
    !total
  ) {
    return next(new SendError("Missing required fields", 400));
  }

  const orderId = razorpayOrderId ? razorpayOrderId : `ORD-${Date.now()}`;
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);


  const user = await User.findById(userId);
  if (!user) {
    return next(new SendError("User not found", 404));
  }


  const order = new Order({
    orderId,
    userId,
    items,
    paymentMethod,
    shippingAddress,
    discounts,
    tax,
    subtotal,
    total,
    estimatedDelivery,
    customerPhoneNumber,
    customerName,
  });

  if (paymentMethod === "razorpay") {
    order.paymentStatus = "Paid";
  }

  order.status = "Shipped";
  await order.save();


  const productIds = order.items.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds } });

  for (const item of order.items) {
    const product = products.find(
      (p) => p._id.toString() === item.productId.toString()
    );

    if (!product) {
      return next(new SendError(`Product with ID ${item.productId} not found`, 404));
    }


 if (isNaN(product.stock) || isNaN(product.sold)) {
  return next(new SendError(`Invalid stock or sold data for ${product.name}`, 400));
}

if (product.stock < item.quantity) {
  return next(new SendError(`Insufficient stock for ${product.name}`, 400));
}

product.stock -= item.quantity;
product.sold += item.quantity;


product.stock = Number(product.stock);
product.sold = Number(product.sold);

await product.save();
}



  const pdfBuffer = await generateInvoiceBuffer(order, user);
  

  await sendInvoiceEmail(user.email, pdfBuffer);

  res.status(201).json({
    success: true,
    message: "Order created successfully",
    invoiceMessage: "Invoice sent to your email",
  });
});

export const getMyOrders = asyncHandler(async (req, res, next) => {
  const id = req.user;  
  const { page = 1, limit = 10} = req.query;


  const pageNumber = parseInt(page, 10);
  const pageSize = parseInt(limit, 10);


  if (isNaN(pageNumber) || pageNumber < 1) {
    return res.status(400).json({ success: false, message: "Invalid page number" });
  }

  if (isNaN(pageSize) || pageSize < 1) {
    return res.status(400).json({ success: false, message: "Invalid limit" });
  }

  const orders = await Order.find({ userId: id })
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .skip((pageNumber - 1) * pageSize)
    .exec();

  const orderCount = await Order.countDocuments({ userId: id });
  const totalPage = Math.ceil(orderCount / pageSize);

  return res.status(200).json({
    success: true,
    orderCount,
    totalPage,
    orders,
  });
});