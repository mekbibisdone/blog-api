import blogModel from "@src/models/blog";
import { Temporal } from "@js-temporal/polyfill";
import { NextFunction, Request, Response } from "express";
import { body, matchedData, param } from "express-validator";
import jwt from "jsonwebtoken";
import {
  handleUserLookUp,
  extractBearerToken,
  getMatchCondition,
  handleBearerToken,
  handleValidation,
  doesTokenMatchUser,
} from "./utils";
import { BlogBody } from "./types";
import EnvVars from "@src/constants/EnvVars";
import userModel, { IUser } from "@src/models/user";
import mongoose from "mongoose";

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
  param("userId").trim().escape().notEmpty().withMessage("User is required"),
  handleValidation,
  handleUserLookUp,
  doesTokenMatchUser,
  async function (req: Request, res: Response, next: NextFunction) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { userId, ...blogData } = matchedData(req) as BlogBody;
    const user = res.locals.user as IUser;
    const blog = new blogModel({ ...blogData });
    blog.timestamp = Temporal.Instant.from(
      Temporal.Now.instant().toString(),
    ).toString();
    const savedBlog = await blog.save();
    await userModel.findByIdAndUpdate(user._id, {
      blogs: [...user.blogs, savedBlog._id],
    });
    res.status(201).json({
      ...savedBlog.toJSON(),
    });

    next();
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
  param("userId").trim().escape().notEmpty(),
  handleValidation,
  handleUserLookUp,
  async function (req: Request, res: Response, next: NextFunction) {
    let user = res.locals.user as mongoose.Document<unknown, object, IUser> &
      IUser &
      Required<{
        _id: mongoose.Types.ObjectId;
      }>;
    let decoded;
    try {
      decoded = jwt.verify(res.locals.token as string, EnvVars.Jwt.Secret);
    } catch {
      decoded = {};
    }
    if (
      typeof decoded === "object" &&
      "id" in decoded &&
      decoded.id === user?._id.toString()
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
  },
];

export const getSingleBlogByAuthor = [
  extractBearerToken,
  param("userId").trim().escape().notEmpty(),
  param("blogId").trim().escape().notEmpty(),
  handleValidation,
  handleUserLookUp,
  async function (req: Request, res: Response, next: NextFunction) {
    const { blogId } = matchedData(req) as {
      blogId: string;
    };
    let user = res.locals.user as mongoose.Document<unknown, object, IUser> &
      IUser &
      Required<{
        _id: mongoose.Types.ObjectId;
      }>;
    user = await user.populate({
      path: "blogs",
      match: getMatchCondition(
        res.locals.token as string,
        user._id.toString(),
        blogId,
      ),
    });
    if (!user.blogs.length) res.status(204).end();
    else res.status(200).json({ user });
    next();
  },
];
