import blogModel from "@src/models/blog";
import { Temporal } from "@js-temporal/polyfill";
import { NextFunction, Request, Response } from "express";
import { body, matchedData, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import { getBearerToken } from "./utils";
import { BlogBody } from "./types";
import EnvVars from "@src/constants/EnvVars";
import userModel from "@src/models/user";

export const createBlog = [
  getBearerToken,
  body("title")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({
      min: 2,
      max: 60,
    })
    .withMessage("Title must be between 2 and 60 characters"),
  body("content")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Content is required")
    .isLength({
      min: 2000,
      max: 70000,
    })
    .withMessage("Content must be between 2000 and 70000 characters"),
  body("published")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Published is required")
    .isBoolean()
    .withMessage("Published must be a boolean value"),
  body("userId").trim().escape().notEmpty().withMessage("User is required"),
  function (req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, ...blogData } = matchedData(req) as BlogBody;
      const decoded = jwt.verify(
        res.locals.token as string,
        EnvVars.Jwt.Secret,
      );
      if (
        typeof decoded === "object" &&
        "id" in decoded &&
        decoded.id === userId
      ) {
        const user = await userModel.findById(userId);
        if (user === null) {
          res.status(404).json({
            errors: [{ msg: "User not found" }],
          });
        } else {
          const blog = new blogModel({ ...blogData });
          blog.timestamp = Temporal.Instant.from(
            Temporal.Now.instant().toString(),
          );
          const savedBlog = await blog.save();
          await userModel.findByIdAndUpdate(userId, {
            blogs: [...user.blogs, savedBlog._id],
          });
          res.status(201).json({
            ...savedBlog.toJSON(),
          });
        }
      } else {
        res.status(401).json({
          errors: [{ msg: "Token does not match signed user" }],
        });
      }
    } catch (err) {
      next(err);
    }
  },
];
