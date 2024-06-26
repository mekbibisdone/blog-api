import { Temporal } from "@js-temporal/polyfill";
import blogModel, { IBlog } from "@src/models/blog";
import commentModel, { IComment } from "@src/models/comment";
import { IUser } from "@src/models/user";
import { NextFunction, Request, Response } from "express";
import { body, matchedData, param } from "express-validator";

import {
  doesTokenMatchCommentUser,
  doesTokenMatchUser,
  handleBearerToken,
  handleBlogLookUp,
  handleCommentLookUp,
  handleUserLookUp,
  handleValidation,
} from "./utils";

export const createComment = [
  handleBearerToken,
  body("comment")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Comment is required")
    .isLength({
      min: 2,
      max: 500,
    }),
  param("userId").trim().escape().notEmpty(),
  param("blogId").trim().escape().notEmpty(),
  handleValidation,
  handleUserLookUp,
  handleBlogLookUp,
  doesTokenMatchUser,
  async function (req: Request, res: Response, next: NextFunction) {
    const { comment: content } = matchedData(req) as {
      comment: string;
    };
    const user = res.locals.user as IUser;
    const blog = res.locals.blog as IBlog;
    if (!blog.published) {
      res
        .status(403)
        .json({ errors: [{ msg: "Can't comment on unpublished blog" }] });
    } else {
      const comment = new commentModel({ content, user: user._id });
      comment.timestamp = Temporal.Instant.from(
        Temporal.Now.instant().toString(),
      ).toString();
      const savedComment = await comment.save();
      await blogModel.findByIdAndUpdate(blog._id.toString(), {
        $push: { comments: savedComment._id },
      });
      res.status(201).json({ comment });
    }
    next();
  },
];

export const getComment = [
  param("userId").trim().escape().notEmpty(),
  param("blogId").trim().escape().notEmpty(),
  param("commentId").trim().escape().notEmpty(),
  handleValidation,
  handleUserLookUp,
  handleBlogLookUp,
  handleCommentLookUp,
  function (req: Request, res: Response, next: NextFunction) {
    const comment = res.locals.comment as IComment;
    res.status(200).json({ comment });
    next();
  },
];

export const deleteComment = [
  param("userId").trim().escape().notEmpty(),
  param("blogId").trim().escape().notEmpty(),
  param("commentId").trim().escape().notEmpty(),
  handleBearerToken,
  handleValidation,
  handleUserLookUp,
  handleBlogLookUp,
  handleCommentLookUp,
  doesTokenMatchCommentUser,
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const comment = res.locals.comment as IComment;
      await commentModel.findByIdAndDelete(comment._id);

      const blog = res.locals.blog as IBlog;
      await blogModel.findByIdAndUpdate(blog._id, {
        $pull: { comments: comment._id },
      });

      res.status(200).json({ msg: "Comment was deleted" });
    } catch (err) {
      next(err);
    }
  },
];

export const updateComment = [
  body("comment")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Comment is required")
    .isLength({
      min: 2,
      max: 500,
    }),
  param("userId").trim().escape().notEmpty(),
  param("blogId").trim().escape().notEmpty(),
  param("commentId").trim().escape().notEmpty(),
  handleBearerToken,
  handleValidation,
  handleUserLookUp,
  handleBlogLookUp,
  handleCommentLookUp,
  doesTokenMatchCommentUser,
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const comment = res.locals.comment as IComment;
      const { comment: newContent } = matchedData(req) as { comment: string };
      const editedOn = Temporal.Instant.from(
        Temporal.Now.instant().toString(),
      ).toString();
      if (comment.content === newContent) res.status(304).end();
      else {
        const updatedComment = await commentModel.findByIdAndUpdate(
          comment._id,
          {
            content: newContent,
            editedOn,
          },
          { new: true },
        );

        res.status(200).json({ comment: updatedComment });
      }
    } catch (err) {
      next(err);
    }
    next();
  },
];
