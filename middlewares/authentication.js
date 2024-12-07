import { User } from "../models/user.modal.js";
import { SendError } from "../utils/sendError.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "./error.js";

export const isAuthenticated = (req, res, next) => {
  const { token } = req.cookies;
  if (!token) return next(new SendError("Unauthorized", 401));
  const user = jwt.verify(token, process.env.JWT_SECRET);
  req.user = user._id;
  next();
};

export const isAdmin = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user);
  if (user.role !== "admin") return next(new SendError("Unauthorized", 401));
  next();
});
