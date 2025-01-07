import mongoose from "mongoose";
import { asyncHandler } from "../middlewares/error.js";
import { User } from "../models/user.modal.js";
import Order from "../models/order.model.js";
import { SendError } from "../utils/sendError.js";
import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";
import Product from "../models/product.model.js";
import Razorpay from "razorpay";
const razorpay = new Razorpay({
  key_id: "rzp_test_H3dRMlyt954d2B",
  key_secret: "pVb1TwmyhM0fphTKFY6YSeoC",
});
const generateInvoiceBuffer = async (order, user) => {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const buffers = [];

  return new Promise((resolve, reject) => {
    try {
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      doc.font("public/NotoSans-Regular.ttf");

      doc
        .image("public/logo.jpg", 50, 20, { width: 100 })
        .fontSize(22)
        .text("INVOICE", { align: "center" })
        .moveDown(1);

      doc
        .fontSize(10)
        .text("Fash Alt", { align: "center" })
        .text("123 Business St, City, Country", { align: "center" })
        .text("Phone: +1234567890 | Email: example@example.com", {
          align: "center",
        })
        .moveDown(2);

      doc
        .fontSize(12)
        .text(`Order ID: ${order.orderId}`)
        .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`)
        .text(
          `Estimated Delivery: ${new Date(
            order.estimatedDelivery
          ).toLocaleDateString()}`
        )
        .moveDown(1);

      doc
        .text(`Customer: ${user.name}`)
        .text(`Phone: ${order.customerPhoneNumber}`)
        .text(`Email: ${user.email}`)
        .moveDown(1);

      doc
        .text("Shipping Address:", { underline: true })
        .text(`${order.shippingAddress.street}`)
        .text(`${order.shippingAddress.city}, ${order.shippingAddress.state}`)
        .text(
          `${order.shippingAddress.zipCode}, ${order.shippingAddress.country}`
        )
        .moveDown(1);

      doc
        .text("Items:", { underline: true })
        .text("---------------------------------------------------------");
      order.items.forEach((item) => {
        doc.text(
          `${item.name} x ${item.quantity} - ₹${item.price.toFixed(2)} each`
        );
      });
      doc
        .text("---------------------------------------------------------")
        .moveDown(1);

      doc
        .text(`Subtotal: ₹${order.subtotal.toFixed(2)}`)
        .text(`Shipping: ₹${order.shippingCharge.toFixed(2)}`)
        .text(`Discounts: -₹${order.discounts.toFixed(2)}`)
        .text(`Tax: ₹${order.tax.toFixed(2)}`)
        .text(`Total: ₹${order.total.toFixed(2)}`)
        .moveDown(1);

      doc
        .fontSize(10)
        .text("Thank you for your purchase!", { align: "center" });

      doc.end();
    } catch (err) {
      console.error("Error during PDF generation:", err.message);
      reject(new Error(`PDF generation failed: ${err.message}`));
    }
  });
};

const sendInvoiceEmail = async (userEmail, pdfBuffer) => {
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #4CAF50;">Thank You for Your Order!</h2>
      <p>Hi,</p>
      <p>We appreciate your purchase. Please find your invoice attached below.</p>
      <p>If you have any questions, feel free to contact us at <a href="mailto:example@example.com">example@example.com</a>.</p>
      <p>Best regards,</p>
      <p><strong>Fash Alt Team</strong></p>
    </div>
  `;

  const mailOptions = {
    from: `"Fash Alt" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: "Your Order Invoice",
    html: htmlTemplate,
    attachments: [
      {
        filename: "invoice.pdf",
        content: pdfBuffer,
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.response);
    return info.response;
  } catch (error) {
    console.error("Failed to send email:", error.message);
    throw new Error(`Failed to send email: ${error.message}`);
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
    shippingCharge,
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
    console.log("Error: Missing required fields");
    return next(new SendError("Missing required fields", 400));
  }

  const orderId = razorpayOrderId ? razorpayOrderId : `ORD-${Date.now()}`;
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

  console.log(`Order ID: ${orderId}, Estimated Delivery: ${estimatedDelivery}`);

  const user = await User.findById(userId);
  if (!user) {
    console.log(`Error: User with ID ${userId} not found`);
    return next(new SendError("User not found", 404));
  }

  user.shippingAddress = {
    address: shippingAddress.street,
    city: shippingAddress.city,
    state: shippingAddress.state,
    pincode: shippingAddress.zipCode,
    country: shippingAddress.country,
  };

  await user.save();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
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
      shippingCharge,
      estimatedDelivery,
      customerPhoneNumber,
      customerName,
      status: "Pending",
      paymentStatus: paymentMethod === "razorpay" ? "Paid" : "Pending",
    });

    await order.save({ session });

    for (const item of order.items) {
      console.log(
        `Processing item: ${item.productId}, Quantity: ${item.quantity}`
      );

      const product = await Product.findOne({ _id: item.productId }).session(
        session
      );
      if (!product) {
        console.log(`Error: Product with ID ${item.productId} not found`);
        await session.abortTransaction();
        return next(
          new SendError(`Product with ID ${item.productId} not found`, 404)
        );
      }

      if (product.isLocked) {
        console.log(
          `Error: Product ${product.name} is currently being processed`
        );
        await session.abortTransaction();
        return next(
          new SendError(
            `Product ${product.name} is currently being processed`,
            400
          )
        );
      }

      if (product.stock < item.quantity) {
        console.log(`Error: Insufficient stock for ${product.name}`);
        await session.abortTransaction();
        return next(
          new SendError(`Insufficient stock for ${product.name}`, 400)
        );
      }

      product.isLocked = true;

      product.stock -= item.quantity;
      product.sold += item.quantity;

      console.log(
        `Locking product ${product.name}. Updated stock: ${product.stock}, sold: ${product.sold}`
      );

      await product.save({ session });
    }

    console.log("Committing transaction");
    await session.commitTransaction();

    for (const item of order.items) {
      const product = await Product.findById(item.productId).session(session);
      if (product) {
        console.log(`Unlocking product ${product.name}`);
        product.isLocked = false;
        await product.save({ session });
      }
    }

    const pdfBuffer = await generateInvoiceBuffer(order, user);
    await sendInvoiceEmail(user.email, pdfBuffer);

    console.log("Order created successfully, invoice sent");
    res.status(201).json({
      success: true,
      message: "Order created successfully",
      invoiceMessage: "Invoice sent to your email",
    });
  } catch (error) {
    console.error("Error during order creation:", error);
    await session.abortTransaction();
    return next(new SendError("Error processing order", 500));
  } finally {
    console.log("Ending session");
    session.endSession();
  }
});
export const isProductLocked = asyncHandler(async (req, res, next) => {
  const { productId } = req.body;

  if (!productId) {
    return next(new SendError("Product ID is required", 400));
  }

  const product = await Product.findById(productId);

  if (!product) {
    return next(new SendError("Product not found", 404));
  }

  if (product.isLocked) {
    return next(new SendError(`Product ${product.name} is currently being processed`, 400));
  }

  return res.status(200).json({
    success: true,
    message: "Product is not locked",
  });
});

export const unlockTheProduct = asyncHandler(async (req, res, next) => {
  const { productId } = req.body;

  if (!productId) {
    return next(new SendError("Product ID is required", 400));
  }

  const product = await Product.findById(productId);

  if (!product) {
    return next(new SendError("Product not found", 404));
  }

  product.isLocked = false;

  await product.save();

  return res.status(200).json({
    success: true,
    message: "Product unlocked successfully",
  })
})

export const getMyOrders = asyncHandler(async (req, res, next) => {
  const id = req.user;
  const { page = 1, limit = 10 } = req.query;

  const pageNumber = parseInt(page, 10);
  const pageSize = parseInt(limit, 10);

  if (isNaN(pageNumber) || pageNumber < 1) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid page number" });
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

export const getOrderById = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const order = await Order.findById(id);
  if (!order) {
    return next(new SendError("Order not found", 404));
  }
  res.status(200).json({
    success: true,
    order,
  });
});

export const updateOrderStatus = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const { status } = req.body;
  console.log(status);
  switch (status) {
    case "Shipped":
      break;
    case "Delivered":
      break;
    case "Canceled":
      break;
    case "Returned":
      break;
    default:
      return next(new SendError("Invalid status", 400));
  }
  const order = await Order.findById(id);
  if (!order) {
    return next(new SendError("Order not found", 404));
  }
  order.status = status;
  await order.save();
  res.status(200).json({
    success: true,
    message: "Order status updated successfully",
  });
});
export const deleteOrder = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const order = await Order.findByIdAndDelete(id);
  if (!order) {
    return next(new SendError("Order not found", 404));
  }
  res.status(200).json({
    success: true,
    message: "Order deleted successfully",
  });
});
