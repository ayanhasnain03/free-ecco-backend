import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import dbConnect from "./lib/db.con.js";
import morgan from "morgan";
import { v2 as cloudinary } from "cloudinary";

const app = express();
dotenv.config();
dbConnect();

app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"))

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed methods
}));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const envMode = process.env.NODE_ENV || "DEVELOPMENT";
import { errorMiddleware } from "./middlewares/error.js";
import userRouter from "./routes/user.route.js";
import productRouter from "./routes/product.route.js";
import reviewRouter from "./routes/review.route.js";
import categoryRouter from "./routes/category.route.js";

import payMentRoute from "./routes/payment.route.js";
import orderRouter from "./routes/order.route.js";
import dashBoardRouter from "./routes/dashbaord.route.js";
app.use("/api/v1/user", userRouter);
app.use("/api/v1/category", categoryRouter);
app.use("/api/v1/product", productRouter);
app.use("/api/v1/review", reviewRouter);
app.use("/api/v1/payment", payMentRoute);
app.use("/api/v1/order", orderRouter);
app.use("/api/v1/dashboard", dashBoardRouter);

app.listen(process.env.PORT || 3000, () => {
  console.log(
    `Server is running in ${envMode} mode on port ${process.env.PORT}`
  );
});

app.use(errorMiddleware);
