import express from "express";
import { reviewUpload } from "../middlewares/multer.js";
import { createReview, deleteReview, getReviews } from "../controllers/review.controller.js";
import { isAuthenticated } from "../middlewares/authentication.js";


const router = express.Router();
router.use(isAuthenticated);

router.post("/create", reviewUpload, createReview);
router.get("/:id", getReviews);
router.delete("/:id", deleteReview);


export default router;
