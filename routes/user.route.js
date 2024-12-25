// routes/userRoutes.js
import express from "express";
import {
  addtoWishList,
  getProfile,
  getWishList,
  loginUser,
  logOutUser,
  removeFromWishList,
  updateProfile,
  userRegister,
} from "../controllers/user.controller.js";
import { avtarUpload } from "../middlewares/multer.js";
import { registerValidation, validateHandler,loginValidation } from "../lib/validator.js";
import { isAdmin, isAuthenticated } from "../middlewares/authentication.js";

const router = express.Router();

router.post(
  "/register",
  avtarUpload,
  userRegister
);
router.post("/login", loginUser);
router.use(isAuthenticated);

router.get("/logout", logOutUser);
router.get("/profile", getProfile);
router.put("/profile/update", avtarUpload, updateProfile);
router.route("/wishlist").post(addtoWishList).put(removeFromWishList).get(getWishList);

export default router;
