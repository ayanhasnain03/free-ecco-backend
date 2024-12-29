import { asyncHandler } from "../middlewares/error.js";
import crypto from "crypto";
import { User } from "../models/user.modal.js";
import { sendEmail, sendToken, uploadFile } from "../utils/features.js";
import { SendError } from "../utils/sendError.js";
import cloudinary from "cloudinary";

export const userRegister = asyncHandler(async (req, res, next) => {
  const file = req.file;
  if (!file) return next(new SendError("Image is required", 400));
  const { name, email, password, gender, phoneNo } = req.body;
  if (!name || !email || !password || !gender || !phoneNo)
    return next(new SendError("All fields are required", 400));
  if (phoneNo.length !== 10)
    return next(new SendError("Phone number must be 10 digits", 400));
  const existUser = await User.findOne({ email });
  if (existUser) return next(new SendError("User already exist", 400));
  const result = await uploadFile([file]);

  const avatar = {
    public_id: result[0].public_id,
    url: result[0].url,
  };

  const user = await User.create({
    name,
    email,
    password,
    gender,
    avatar,
    phoneNo,
  });
  sendToken(res, user, 200, "User Registered Successfully");
});
export const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new SendError("Email or Password is required", 400));
  const user = await User.findOne({ email }).select("+password");
  if (!user) return next(new SendError("Invalid Email or Password", 400));
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched)
    return next(new SendError("Invalid Email or Password", 400));
  sendToken(res, user, 200, `Welcome ${user.name}`);
});
export const logOutUser = asyncHandler(async (req, res, next) => {
  res.cookie("token", "", {
    expires: new Date(Date.now()),
    httpOnly: true,
      secure: true,
      sameSite: "none",
  });
  res.status(200).json({
    success: true,
    message: "User Logged Out Successfully",
  });
});
export const getProfile = asyncHandler(async (req, res, next) => {
  const getUser = await User.findById(req.user)
    .select("-password")
    .populate("wishlist", "name description images _id");
  res.json({
    success: true,
    user: getUser,
  });
});
export const updateProfile = asyncHandler(async (req, res, next) => {
  const { name, email, password, gender } = req.body;
  const user = await User.findById(req.user);
  if (!user) {
    return next(new SendError("User not found", 404));
  }

  if (name) user.name = name;
  if (email) user.email = email;
  if (password) user.password = password;
  if (gender) user.gender = gender;

  if (req.file) {
    if (user.avatar && user.avatar[0].public_id) {
      await cloudinary.uploader.destroy(user.avatar[0].public_id);
    }

    const result = await uploadFile([req.file]);

    const avatar = {
      public_id: result[0].public_id,
      url: result[0].url,
    };

    user.avatar = [avatar];
  }

  await user.save();

  res.json({
    success: true,
    message: "Profile Updated Successfully",
    user: {
      name: user.name,
      email: user.email,
      avatar: user.avatar[0].url,
      gender: user.gender,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});
export const addtoWishList = asyncHandler(async (req, res, next) => {
  const { productId } = req.body;
  const user = await User.findById(req.user);
  if (!user) return next(new SendError("User not found", 404));
  if (user.wishlist.includes(productId))
    return next(new SendError("Product already in wishlist", 400));
  user.wishlist.push(productId);

  await user.save();

  res.json({
    success: true,
    message: "Product added to wishlist successfully",
  });
});
export const removeFromWishList = asyncHandler(async (req, res, next) => {
  const { productId } = req.body;
  const user = await User.findById(req.user);
  if (!user) return next(new SendError("User not found", 404));

  user.wishlist.pull(productId);

  await user.save();

  res.json({
    success: true,
    message: "Product removed from wishlist successfully",
  });
});
export const getWishList = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user).populate("wishlist");
  if (!user) return next(new SendError("User not found", 404));
  res.json({
    success: true,
    wishlist: user.wishlist,
  });
});
export const forgetpassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return next(new SendError("Please enter a valid email", 404));
  const resetToken = await user.getResetToken();
  await user.save();
  const url = `${process.env.CLIENT_URL}/resetpassword/${resetToken}`;
  await sendEmail(user.email, "Reset Password", url);
  res.json({
    success: true,
    message: `Reset password link sent to ${user.email}`,
  });
});
export const resetpassword = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user)
    return next(
      new SendError("Your reset password link has been expired", 404)
    );

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  res.json({
    success: true,
    message: "Password reset successfully",
  });
});
