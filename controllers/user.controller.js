import { asyncHandler } from "../middlewares/error.js";
import crypto from "crypto";
import { User } from "../models/user.modal.js";
import { sendEmail, sendToken, uploadFile } from "../utils/features.js";
import { SendError } from "../utils/sendError.js";
import cloudinary from "cloudinary";
import Contact from "../models/contact.model.js";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
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
  const result = await uploadFile([file], "avatar");

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
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new SendError("Invalid product ID format", 400));
  }

  const user = await User.findById(req.user);
  if (!user) {
    return next(new SendError("User not found", 404));
  }

  const isInWishlist = user.wishlist.some((itemId) => itemId.toString() === id);
  if (!isInWishlist) {
    return next(new SendError("Product not found in wishlist", 404));
  }

  user.wishlist = user.wishlist.filter((itemId) => itemId.toString() !== id);
  await user.save();

  res.status(200).json({
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

export const getAllUsers = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, keyword = "" } = req.query;

  const users = await User.find({
    $or: [
      { name: { $regex: keyword, $options: "i" } },
      { email: { $regex: keyword, $options: "i" } },
      { phoneNo: { $regex: keyword, $options: "i" } },
    ],
  })
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });

  if (!users) return next(new SendError("Users not found", 404));

  const usersCount = await User.find({
    $or: [
      { name: { $regex: keyword, $options: "i" } },
      { email: { $regex: keyword, $options: "i" } },
      { phoneNo: { $regex: keyword, $options: "i" } },
    ],
  });
  const totalUsers = await User.countDocuments();
  const totalUsersForPage = usersCount.length;
  const totalPage = Math.ceil(totalUsersForPage / limit);

  res.json({
    success: true,
    users,
    totalPage,
    totalUsers,
  });
});

export const deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id);

  if (!user) return next(new SendError("User not found", 404));

  if (user.avatar && user.avatar[0]?.public_id) {
    const publicId = user.avatar[0].public_id;
    await cloudinary.v2.uploader.destroy(publicId);
  }

  await user.deleteOne();

  res.json({
    success: true,
    message: "User deleted successfully",
  });
});

export const updateUserRole = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.body;

  const user = await User.findById(id);
  if (!user) return next(new SendError("User not found", 404));

  if (user.role === "user") {
    user.role = "admin";
  } else {
    user.role = "user";
  }

  await user.save();

  res.json({
    success: true,
    message: "User role updated successfully",
  });
});

export const contactCreate = asyncHandler(async (req, res, next) => {
  const { name, email, phoneNo, message } = req.body;
  console.log(req.body);

  if (!name || !email || !phoneNo || !message) {
    return next(new SendError("Please fill all the fields"));
  }

  const user = await Contact.create({ name, email, phoneNo, message });


  const emailTemplate = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #fc0000;">New Contact Message</h2>
      <p><strong>Name:</strong> ${user.name}</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Phone Number:</strong> ${user.phoneNo}</p>
      <p><strong>Message:</strong></p>
      <blockquote style="margin: 10px 0; padding: 10px; background: #fce4e4; border-left: 5px solid #fc0000; color: #333;">
        ${user.message}
      </blockquote>
    </div>
  `;

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `Message from ${user.name}`,
      html: emailTemplate,
    });

    res.status(201).json({
      message: "Message sent successfully!",
    });
  } catch (error) {
    return next(
      new SendError("Failed to send the message. Please try again later.")
    );
  }
});

export const getContacts = asyncHandler(async (req, res, next) => {
  const { page = "1", limit = "10" } = req.query;
  const contacts = await Contact.find()
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });
  const totalMessages = await Contact.countDocuments();
  const totalPage = Math.ceil(totalMessages / limit);

  if (!contacts) return next(new SendError("Contacts not found", 404));
  res.json({
    success: true,
    contacts,
    totalPage,
    totalMessages,
  });
});

export const replyContact = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { reply } = req.body;

  const contact = await Contact.findById(id);
  if (!contact) return next(new SendError("Contact not found", 404));

  contact.reply = reply;
  await contact.save();

  const emailTemplate = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #fc0000;">Reply from Admin</h2>
      <p>Dear <strong>${contact.name}</strong>,</p>
      <p>Thank you for reaching out to us. Below is our response to your query:</p>
      <blockquote style="margin: 10px 0; padding: 15px; background: #fce4e4; border-left: 5px solid #fc0000; font-style: italic; color: #555;">
        ${reply}
      </blockquote>
      <p>If you have further questions or need additional assistance, feel free to contact us at any time.</p>
      <p>Best regards,</p>
      <p style="color: #fc0000; font-weight: bold;">The Admin Team</p>
      <hr style="border-top: 1px solid #ddd; margin: 20px 0;" />
      <footer style="font-size: 0.9rem; color: #666;">
        <p>If this email has reached you in error, please disregard it.</p>
        <p>&copy; ${new Date().getFullYear()} Fash Alt</p>
      </footer>
    </div>
  `;

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: contact.email,
      subject: `Message from Fash Alt`,
      html: emailTemplate,
    });

    return res.status(201).json({
      message: "Reply sent and email sent successfully!",
    });
  } catch (error) {
    return next(
      new SendError("Failed to send the message. Please try again later.")
    );
  }
});
