import express from "express";
import { getAllOrders, getLatestTransactions, getMonthDashboard, getTotalCounts, getWeekDashboard, PieChart } from "../controllers/dashbaord.controller.js";
import { isAdmin, isAuthenticated } from "../middlewares/authentication.js";

const router = express.Router();
router.use(isAuthenticated);
 router.get("/weekdash",getWeekDashboard);
 router.get("/counts",getTotalCounts);
 router.get("/latest-transactions",getLatestTransactions);
 router.get("/orders",getAllOrders);
 router.get("/months",getMonthDashboard);
 router.get("/order-status",PieChart);

export default router;