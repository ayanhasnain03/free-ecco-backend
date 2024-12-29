import { Router } from "express";
import { createOrder, getMyOrders, getOrderById, updateOrderStatus } from "../controllers/order.controller.js";
import { isAdmin, isAuthenticated } from "../middlewares/authentication.js";

const router = Router();

router.post("/create",isAuthenticated, createOrder);
router.get("/myorders",isAuthenticated, getMyOrders);
router.get("/:id",isAuthenticated, getOrderById);
router.put("/:id",isAuthenticated,isAdmin,updateOrderStatus);
export default router;
