import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto"; 

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "subAdmin", "admin"],
      default: "user",
    },
    avatar: [
      {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    ],
    gender: {
      type: String,
      enum: ["male", "female"],
      required: [true, "Please enter Gender"],
    },

    shippingInfo: {
      address: {
        type: String,
      },
      city: {
        type: String,
      },
      state: {
        type: String,
      },
      pinCode: {
        type: Number,
      },
      country: {
        type: String,
      },
      phoneNo: {
        type: String,
      },
      secondPhoneNo: {
        type: String,
      },
      addressType: {
        type: String,
        enum: {
          values: ["home", "work", "other"],
          message: "Please select correct address type",
        },
      },
    },

    wishlist: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
      },
    ],

    
    resetPasswordToken: String,
    resetPasswordExpire: String,
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.getJWTToken = function () {
  return jwt.sign(
    { _id: this._id },
    process.env.JWT_SECRET || "secretwrwerwer",
    {
      expiresIn: "15d",
    }
  );
};


userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};


userSchema.methods.getResetToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex"); 
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken) // Hash the token
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; 
  return resetToken;
};

export const User = mongoose.model("User", userSchema);
