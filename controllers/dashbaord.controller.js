import { asyncHandler } from "../middlewares/error.js";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import { User } from "../models/user.modal.js";
import {
  calculatePercentageIncrease,
  getChartData,
} from "../utils/features.js";

export const getTotalCounts = asyncHandler(async (req, res, next) => {
  const today = new Date();
  const startOfLastMonth = new Date(
    today.getFullYear(),
    today.getMonth() - 1,
    1
  );
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

  const totalOrders = await Order.countDocuments();
  const totalProducts = await Product.countDocuments();
  const totalUsers = await User.countDocuments();

  const lastMonthOrders = await Order.countDocuments({
    createdAt: {
      $gte: startOfLastMonth,
      $lt: endOfLastMonth,
    },
  });

  const lastMonthProducts = await Product.countDocuments({
    createdAt: {
      $gte: startOfLastMonth,
      $lt: endOfLastMonth,
    },
  });

  const lastMonthUsers = await User.countDocuments({
    createdAt: {
      $gte: startOfLastMonth,
      $lt: endOfLastMonth,
    },
  });

  const orders = await Order.find().select("total createdAt");
  const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0);

  const lastMonthRevenue = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startOfLastMonth,
          $lt: endOfLastMonth,
        },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$total" },
      },
    },
  ]);

  const lastMonthRevenueAmount =
    lastMonthRevenue.length > 0 ? lastMonthRevenue[0].totalRevenue : 0;

  const orderStats = calculatePercentageIncrease(lastMonthOrders, totalOrders);
  const productStats = calculatePercentageIncrease(
    lastMonthProducts,
    totalProducts
  );
  const userStats = calculatePercentageIncrease(lastMonthUsers, totalUsers);
  const revenueStats = calculatePercentageIncrease(
    lastMonthRevenueAmount,
    totalRevenue
  );

  res.status(200).json({
    success: true,
    totalOrders,
    totalProducts,
    totalUsers,
    totalRevenueAmount: totalRevenue,
    orderPercentageIncrease: {
      percentage: orderStats.percentage,
      color: orderStats.color,
    },
    productPercentageIncrease: {
      percentage: productStats.percentage,
      color: productStats.color,
    },
    userPercentageIncrease: {
      percentage: userStats.percentage,
      color: userStats.color,
    },
    revenuePercentageIncrease: {
      percentage: revenueStats.percentage,
      color: revenueStats.color,
    },
  });
});

export const getWeekDashboard = asyncHandler(async (req, res, next) => {
  const today = new Date();
  const lastWeekAgo = new Date();

  lastWeekAgo.setDate(today.getDate() - 7);

  const lastWeekOrders = await Order.find({
    createdAt: {
      $gte: lastWeekAgo,
      $lt: today,
    },
  });

  const orderWeekCounts = new Array(7).fill(0);
  const lastWeekRevenueCounts = new Array(7).fill(0);

  lastWeekOrders.forEach((order) => {
    const orderDate = new Date(order.createdAt);
    const dayIndex = orderDate.getDay();
    orderWeekCounts[dayIndex]++;
    lastWeekRevenueCounts[dayIndex] += order.total;
  });

  const stats = {
    orderWeekCounts,
    lastWeekRevenueCounts,
  };

  res.status(200).json({
    success: true,
    stats,
  });
});

export const getLatestTransactions = asyncHandler(async (req, res, next) => {
  const orders = await Order.find().sort({ createdAt: -1 }).limit(5);
  res.status(200).json({
    success: true,
    orders,
  });
});
export const getAllOrders = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;

  const orders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit);
  const totalOrders = await Order.countDocuments();
  res.status(200).json({
    success: true,
    orders,
    totalOrders,
  });
});
export const getMonthDashboard = asyncHandler(async (req, res, next) => {
  const today = new Date();

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(today.getMonth() - 6);

  const sixMontOrderPromise = Order.find({
    createdAt: {
      $gte: sixMonthsAgo,
      $lt: today,
    },
  }).select("createdAt total");

  const sixMonthUserPromise = User.find({
    createdAt: {
      $gte: sixMonthsAgo,
      $lt: today,
    },
  }).select("createdAt");

  const [orders, users] = await Promise.all([
    sixMontOrderPromise,
    sixMonthUserPromise,
  ]);

  const { orderCounts, revenuePerMonth } = getChartData({
    length: 12,
    today,
    docArr: orders,
    revenueField: "total",
  });

  const { orderCounts: usersByMonth } = getChartData({
    length: 12,
    today,
    docArr: users,
  });

  res.status(200).json({
    success: true,
    stats: {
      revenueByMonth: revenuePerMonth,
      ordersByMonth: orderCounts,
      usersByMonth: usersByMonth,
    },
  });
});

export const PieChart = asyncHandler(async (req, res, next) => {
  const orders = await Order.find();
  const orderStatusCounts = {
    Pending: 0,
    Shipped: 0,
    Delivered: 0,
    Canceled: 0,
    Returned: 0,
  };
  const paymentMethodCounts = {
    COD: 0,
    razorpay: 0,
  };
  orders.forEach((order) => {
    orderStatusCounts[order.status]++;
    paymentMethodCounts[order.paymentMethod]++;
  });
  res.status(200).json({
    success: true,
    orderStatusCounts,
    paymentMethodCounts,
  });
});
