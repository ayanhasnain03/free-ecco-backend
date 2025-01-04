import express from "express";
import {
  addtoWishList,
  contactCreate,
  deleteUser,
  forgetpassword,
  getAllUsers,
  getContacts,
  getProfile,
  getWishList,
  loginUser,
  logOutUser,
  removeFromWishList,
  replyContact,
  resetpassword,
  updateProfile,
  updateUserRole,
  userRegister,
} from "../controllers/user.controller.js";
import { avtarUpload } from "../middlewares/multer.js";
import { isAdmin, isAuthenticated } from "../middlewares/authentication.js";

const router = express.Router();


router.post("/register", avtarUpload, userRegister);
router.post("/login", loginUser);
router.post("/contact", contactCreate);
router.post("/forgetpassword", forgetpassword);
router.post("/resetpassword/:token", resetpassword);


router.use(isAuthenticated);

router.post("/logout", logOutUser);
router.get("/profile", getProfile);
router.put("/profile/update", avtarUpload, updateProfile);



router.get("/all", isAdmin, getAllUsers);
router.get("/contacts", isAdmin, getContacts);
router.delete("/:id", isAdmin, deleteUser);
router.put("/:id", isAdmin, updateUserRole);
router.put("/contact/:id", isAdmin, replyContact);
router.delete("/wishlist/:id", isAuthenticated, removeFromWishList);
router
  .route("/wishlist", isAuthenticated)
  .post(addtoWishList)
  .get(getWishList);

export default router;
