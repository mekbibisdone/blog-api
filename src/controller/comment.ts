import commentModel from "@src/models/comment";
import { Temporal } from "@js-temporal/polyfill";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import {
  getMatchCondition,
  handleBearerToken,
  handleValidation,
} from "./utils";
import EnvVars from "@src/constants/EnvVars";
import userModel from "@src/models/user";
import { body, matchedData, param } from "express-validator";
import blogModel from "@src/models/blog";

export const createComment = [
  handleBearerToken,
  body("comment").trim().escape().notEmpty().withMessage("Comment is required"),
  param("userId").trim().escape().notEmpty(),
  param("blogId").trim().escape().notEmpty(),
  handleValidation,
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const {
        userId,
        blogId,
        comment: content,
      } = matchedData(req) as {
        userId: string;
        blogId: string;
        comment: string;
      };
      const user = await userModel.findById(userId, { password: 0 }).populate({
        path: "blogs",
        match: getMatchCondition(res.locals.token as string, userId, blogId),
      });
      if (user === null || typeof user !== "object") {
        res.status(400).json({ errors: [{ msg: "User not found" }] });
      } else if (!user.blogs.length) res.status(204).end();
      else {
        const decoded = jwt.verify(
          res.locals.token as string,
          EnvVars.Jwt.Secret,
        );
        if (typeof decoded === "object" && "id" in decoded) {
          const comment = new commentModel({ content, user: userId });
          comment.timestamp = Temporal.Instant.from(
            Temporal.Now.instant().toString(),
          ).toString();
          const savedComment = await comment.save();
          await blogModel.findByIdAndUpdate(blogId, {
            $push: { comments: savedComment._id },
          });
          res.status(201).json({ comment });
        } else {
          res.status(401).json({
            errors: [{ msg: "Token does not match signed user" }],
          });
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "CastError")
        res.status(400).json({ errors: [{ msg: "User Id is invalid" }] });
      else next(err);
    }
  },
];
