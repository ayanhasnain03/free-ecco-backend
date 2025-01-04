import { v2 as cloudinary } from "cloudinary";
import { v4 as uuid } from "uuid";
import { SendError } from "./sendError.js";
import {createTransport} from "nodemailer"
const transformFileOnBase64 = (file) =>
  `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

export const uploadFile = async (files = [], folder = "") => {
  const upload = files.map((file) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        transformFileOnBase64(file),
        {
          folder: folder ? `fashAt/${folder}` : "fashAt", 
          resource_type: "image", 
          public_id: uuid(), 
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
    });
  });

  try {
    const res = await Promise.all(upload);
    const formattedImages = res.map((file) => ({
      public_id: file.public_id,
      url: file.secure_url,
    }));
    return formattedImages;
  } catch (error) {
    throw new SendError(error.message || "Something went wrong during file upload", 400);
  }
};

export const deleteFile = async (publicIds = []) => {
  if (!publicIds || publicIds.length === 0) {
    throw new SendError("No images provided for deletion", 400);
  }

  try {

    const deletePromises = publicIds.map((id) => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(id, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        });
      });
    });

    const results = await Promise.all(deletePromises);

    const failedDeletions = results.filter(
      (result) => result.result !== "ok" && result.result !== "not found"
    );

    if (failedDeletions.length > 0) {
      console.error("Failed deletions:", failedDeletions);
      throw new SendError("Some images could not be deleted", 500);
    }

    return results;
  } catch (error) {
    console.error("Error deleting images:", error);
    throw new SendError("Failed to delete images", 500);
  }
};

export const sendToken = (res, user, statusCode, message) => {
  const token = user.getJWTToken();

  res
    .status(statusCode)
    .cookie("token", token, {
      expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: true,
      sameSite: "none",
    })
    .json({
      success: true,
      message,
      user,
    });
};

export const calculatePercentageIncrease = (previousCount, currentCount) => {
  if (previousCount === 0 && currentCount === 0) {
    return { percentage: 0, color: 'black' }; 
  }
  if (previousCount === 0 && currentCount > 0) {
    return { percentage: 100, color: 'green' }; 
  }
  
  const percentageChange = ((currentCount - previousCount) / previousCount) * 100;
  let color = percentageChange > 0 ? 'green' : percentageChange < 0 ? 'red' : 'black';

  return { percentage: percentageChange.toFixed(2), color };
};

export const sendEmail = async (to, subject, text) => {
const transpoter = createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

await transpoter.sendMail({
  from: process.env.SMTP_FROM_EMAIL,
  to,
  subject,
  text
})
}


export const getChartData = ({
  length,       
  docArr,     
  today,       
  revenueField, 
}) => {
  const orderCounts = new Array(length).fill(0);
  const revenuePerMonth = new Array(length).fill(0); 

  docArr.forEach((i) => {
    const creationDate = i.createdAt;
    const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;

    if (monthDiff < length) {
      orderCounts[length - monthDiff - 1] += 1; 
      if (revenueField) {
        revenuePerMonth[length - monthDiff - 1] += i[revenueField]; 
      }
    }
  });

  return { orderCounts, revenuePerMonth }; 
};
