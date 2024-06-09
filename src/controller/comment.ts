import { Temporal } from "@js-temporal/polyfill";
import blogModel from "@src/models/blog";
import commentModel from "@src/models/comment";
import { IUser } from "@src/models/user";
import { NextFunction, Request, Response } from "express";
import { body, matchedData, param } from "express-validator";

import mongoose from "mongoose";
import {
  doesTokenMatchUser,
  getMatchCondition,
  handleBearerToken,
  handleUserLookUp,
  handleValidation,
} from "./utils";

export const createComment = [
  handleBearerToken,
  body("comment").trim().escape().notEmpty().withMessage("Comment is required"),
  param("userId").trim().escape().notEmpty(),
  param("blogId").trim().escape().notEmpty(),
  handleValidation,
  handleUserLookUp,
  doesTokenMatchUser,
  async function (req: Request, res: Response, next: NextFunction) {
    const { blogId, comment: content } = matchedData(req) as {
      blogId: string;
      comment: string;
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
    else {
      const comment = new commentModel({ content, user: user._id });
      comment.timestamp = Temporal.Instant.from(
        Temporal.Now.instant().toString(),
      ).toString();
      const savedComment = await comment.save();
      await blogModel.findByIdAndUpdate(blogId, {
        $push: { comments: savedComment._id },
      });
      res.status(201).json({ comment });
    }
    next();
  },
];