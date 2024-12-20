import { Router } from "express";
import { createOrder, getMyOrders } from "../controllers/order.controller.js";
import { isAuthenticated } from "../middlewares/authentication.js";

const router = Router();

router.post("/create",isAuthenticated, createOrder);
router.get("/myorders",isAuthenticated, getMyOrders);

export default router;
