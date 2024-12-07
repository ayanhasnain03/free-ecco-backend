import multer from "multer";
const upload = multer({
  fileSize: 1024 * 1024 * 5,
});

export const avtarUpload = upload.single("avatar");
export const productUpload = upload.array("images", 5);
export const categoryUpload = upload.single("categoryImage");
