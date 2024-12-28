import express from "express";
import { getAllOrders, getLatestTransactions, getTotalCounts, getWeekDashboard } from "../controllers/dashbaord.controller.js";
import { isAdmin, isAuthenticated } from "../middlewares/authentication.js";

const router = express.Router();
router.use(isAuthenticated,isAdmin);
 router.get("/weekdash",getWeekDashboard);
 router.get("/counts",getTotalCounts);
 router.get("/latest-transactions",getLatestTransactions);
 router.get("/orders",getAllOrders);

export default router;