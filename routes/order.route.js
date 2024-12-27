import { Router } from "express";
import { createOrder, getMyOrders, getOrderById } from "../controllers/order.controller.js";
import { isAuthenticated } from "../middlewares/authentication.js";

const router = Router();

router.post("/create",isAuthenticated, createOrder);
router.get("/myorders",isAuthenticated, getMyOrders);
router.get("/:id",isAuthenticated, getOrderById);
export default router;
