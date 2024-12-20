import { body, validationResult } from "express-validator";
import { SendError } from "../utils/sendError.js";

export const validateHandler = (req, res, next) => {
  const errors = validationResult(req);

  const errorMessages = errors
    .array()
    .map((error) => error.msg)
    .join(", ");

  if (errors.isEmpty()) return next();
  else next(new SendError(errorMessages, 400));
};

export const registerValidation = [
  body("name").notEmpty().withMessage("Name is required"),

  body("email").isEmail().withMessage("Please provide a valid email address"),

  body("gender").notEmpty().withMessage("Gender is required"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[a-zA-Z]/)
    .withMessage("Password must contain at least one letter")
    .matches(/[^a-zA-Z0-9]/)
    .withMessage("Password must contain at least one special character"),
];
export const loginValidation = [
  body("email").isEmail().withMessage("Please provide a valid email address"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
      
]