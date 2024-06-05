import blogModel from "@src/models/blog";
import { Temporal } from "@js-temporal/polyfill";
import { NextFunction, Request, Response } from "express";
import { body, matchedData, param, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import { extractBearerToken, handleBearerToken } from "./utils";
import { BlogBody } from "./types";
import EnvVars from "@src/constants/EnvVars";
import userModel from "@src/models/user";

export const createBlog = [
  handleBearerToken,
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
          ).toString();
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

export const getAllBlogs = [
  async function (req: Request, res: Response, next: NextFunction) {
    const users = await userModel
      .find({}, { password: 0 })
      .populate({ path: "blogs", match: { published: true } });
    res.status(200).json({ users });
    next();
  },
];

export const getBlogsByAuthor = [
  extractBearerToken,
  param("id").trim().escape().notEmpty(),
  function (req: Request, res: Response, next: NextFunction) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      res.status(400).json({
        errors: result.array(),
      });
    } else next();
  },
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = matchedData(req);
      let user = await userModel.findById(id, { password: 0 });
      let decoded;
      try {
        decoded = jwt.verify(res.locals.token as string, EnvVars.Jwt.Secret);
      } catch {
        decoded = {};
      }

      if (user === null || typeof user !== "object") {
        res.status(400).json({ errors: [{ msg: "User not found" }] });
      } else if (
        typeof decoded === "object" &&
        "id" in decoded &&
        decoded.id === user.id
      ) {
        user = await user.populate({
          path: "blogs",
        });
        res.status(200).json({ user });
      } else {
        user = await user.populate({
          path: "blogs",
          match: { published: true },
        });
        res.status(200).json({ user });
      }
      next();
    } catch (err) {
      if (err instanceof Error && err.name === "CastError")
        res.status(400).json({ errors: [{ msg: "Id is invalid" }] });
      else next(err);
    }
  },
];
