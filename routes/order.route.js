import { Router } from "express";
import { createOrder, deleteOrder, getMyOrders, getOrderById, updateOrderStatus } from "../controllers/order.controller.js";
import { isAdmin, isAuthenticated } from "../middlewares/authentication.js";

const router = Router();

router.post("/create",isAuthenticated, createOrder);
router.get("/myorders",isAuthenticated, getMyOrders);
router.get("/:id",isAuthenticated, getOrderById);
router.put("/:id",isAuthenticated,isAdmin,updateOrderStatus);
router.delete("/:id",isAuthenticated,isAdmin,deleteOrder);
export default router;
