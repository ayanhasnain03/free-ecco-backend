import { v2 as cloudinary } from "cloudinary";
import { v4 as uuid } from "uuid";
import { SendError } from "./sendError.js";

const transformFileOnBase64 = (file) =>
  `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

export const uploadFile = async (files = []) => {
  const upload = files.map((file) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        transformFileOnBase64(file),
        {
          folder: "fashAt",
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
    const formAtImage = res.map((file) => ({
      public_id: file.public_id,
      url: file.secure_url,
    }));
    return formAtImage;
  } catch (error) {
    throw new SendError(error.message || "Something went wrong", 400);
  }
};
export const deleteFile = async (publicIds = []) => {
  if (!publicIds || publicIds.length === 0) {
    throw new SendError("No images provided for deletion", 400);
  }

  try {
    // Create a promise for each image deletion
    const deletePromises = publicIds.map((id) => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(id, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        });
      });
    });

    // Wait for all deletion operations to complete
    const results = await Promise.all(deletePromises);

    // Filter out "not found" results
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
