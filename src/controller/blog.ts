import blogModel, { IBlog } from "@src/models/blog";
import { Temporal } from "@js-temporal/polyfill";
import { NextFunction, Request, Response } from "express";
import { matchedData, param } from "express-validator";
import jwt from "jsonwebtoken";
import {
  handleUserLookUp,
  extractBearerToken,
  getMatchCondition,
  handleBearerToken,
  handleValidation,
  doesTokenMatchUser,
  handleBlogLookUp,
} from "./utils";
import { BlogBody } from "./types";
import EnvVars from "@src/constants/EnvVars";
import userModel, { IUser } from "@src/models/user";
import mongoose from "mongoose";
import commentModel from "@src/models/comment";

export const createBlog = [
  handleBearerToken,
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
  handleBlogLookUp,
  async function (req: Request, res: Response, next: NextFunction) {
    let user = res.locals.user as mongoose.Document<unknown, object, IUser> &
      IUser &
      Required<{
        _id: mongoose.Types.ObjectId;
      }>;
    const blog = res.locals.blog as IBlog;
    user = await user.populate({
      path: "blogs",
      match: getMatchCondition(
        res.locals.token as string,
        user._id.toString(),
        blog._id.toString(),
      ),
      populate: {
        path: "comments",
      },
    });
    if (!user.blogs.length)
      res.status(403).json({
        errors: [{ msg: "Only the author can view their unpublished blog" }],
      });
    else res.status(200).json({ user });
    next();
  },
];

export const deleteBlog = [
  handleBearerToken,
  param("userId").trim().escape().notEmpty(),
  param("blogId").trim().escape().notEmpty(),
  handleValidation,
  handleUserLookUp,
  doesTokenMatchUser,
  handleBlogLookUp,
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const blog = res.locals.blog as IBlog;
      const user = res.locals.user as IUser;
      await blogModel.findByIdAndDelete(blog._id);
      await userModel.findByIdAndUpdate(user._id, {
        $pull: { blogs: blog._id },
      });
      if (blog.comments.length)
        await commentModel.deleteMany({ _id: { $in: blog.comments } });
      res.status(200).json({ msg: `${blog.title} was deleted` });
    } catch (err) {
      next(err);
    }
    next();
  },
];

export const updateBlog = [
  handleBearerToken,
  param("userId").trim().escape().notEmpty(),
  param("blogId").trim().escape().notEmpty(),
  handleValidation,
  handleUserLookUp,
  doesTokenMatchUser,
  handleBlogLookUp,
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const { title, content, published } = matchedData(req) as {
        title: string;
        content: string;
        published: boolean;
      };
      const toBeChanged: Partial<{
        title: string;
        content: string;
        published: boolean;
      }> = { title, content, published: published };
      const blog = res.locals.blog as IBlog;
      let keys = Object.keys(toBeChanged) as Array<keyof typeof toBeChanged>;
      for (const key of keys) {
        if (toBeChanged[key] === blog[key]) delete toBeChanged[key];
      }
      keys = Object.keys(toBeChanged) as Array<keyof typeof toBeChanged>;
      if (!keys.length) {
        res.status(304).end();
      } else {
        const editedOn = Temporal.Instant.from(
          Temporal.Now.instant().toString(),
        ).toString();

        const updatedBlog = await blogModel.findByIdAndUpdate(
          blog._id,
          {
            ...toBeChanged,
            editedOn,
          },
          { new: true },
        );
        res.status(200).json({ blog: updatedBlog });
      }
    } catch (err) {
      next(err);
    }
    next();
  },
];
