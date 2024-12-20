import { asyncHandler } from "../middlewares/error.js";
import { User } from "../models/user.modal.js";
import { sendToken, uploadFile } from "../utils/features.js";
import { SendError } from "../utils/sendError.js";
import cloudinary from "cloudinary";
export const userRegister = asyncHandler(async (req, res, next) => {
  const file = req.file || [];
  if (!file) return next(new SendError("Avatar is required", 400));
  const { name, email, password, gender, phoneNo } = req.body;
  console.log(name, email, password, gender, file);
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
  });
  sendToken(res, user, 200, "User Registered Successfully");
});
export const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user) return next(new SendError("Invalid Email or Password", 400));
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched)
    return next(new SendError("Invalid Email or Password", 400));
  sendToken(res, user, 200,`Welcome ${user.name}`);
});
export const logOutUser = asyncHandler(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    message: "User Logged Out Successfully",
  });
});
export const getProfile = asyncHandler(async (req, res, next) => {
  const getUser = await User.findById(req.user).select("-password");
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
