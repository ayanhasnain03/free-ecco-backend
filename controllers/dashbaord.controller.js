import { asyncHandler } from "../middlewares/error.js";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import { User } from "../models/user.modal.js";

export const getDashboardStats = asyncHandler(async (req, res, next) => {
  const [usersCount, productsCount, ordersCount] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Order.countDocuments(),
  ]);

  const today = new Date();
  const lastWeekAgo = new Date();
  lastWeekAgo.setDate(today.getDate() - 7);

  const lastWeekOrders = await Order.find({
    createdAt: {
      $gte: lastWeekAgo,
      $lte: today,
    },
  });

  const orderStats = new Array(7).fill(0);

  lastWeekOrders.forEach((order) => {
    const dayOfWeek = order.createdAt.getDay();
    orderStats[dayOfWeek]++;
  });

  const counts = {
    users: usersCount,
    products: productsCount,
    orders: ordersCount,
  };

  const stats = {
    orders: orderStats,
  };
  res.status(200).json({
    success: true,
    stats,
    counts,
  });
});
