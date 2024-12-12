import { asyncHandler } from "../middlewares/error.js";
import { User } from "../models/user.modal.js";
import Order from "../models/order.model.js";
import { SendError } from "../utils/sendError.js";

export const createOrder = asyncHandler(async (req, res, next) => {
  const {
    shippingInfo,
    paymentInfo,
    paidAt,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    orderItems,
  } = req.body;

  const loggedUser = await User.findById(req.user);
  if (!loggedUser) {
    return next(new SendError("User not found", 404));
  }

  const order = new Order({
    shippingInfo,
    paymentInfo,
    paidAt: new Date(),
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    orderItems,
    user: loggedUser._id,
  });

  const createdOrder = await order.save();

  res.status(201).json({
    success: true,
    createdOrder,
  });
});
