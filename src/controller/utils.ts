import EnvVars from "@src/constants/EnvVars";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { body, validationResult } from "express-validator";
import { matchedData } from "express-validator";
import userModel, { IUser } from "@src/models/user";
import { BlogBody, UserBody } from "./types";
import blogModel, { IBlog } from "@src/models/blog";
import commentModel, { IComment } from "@src/models/comment";

export function handleBearerToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Get auth header value
  const bearerHeader = req.headers["authorization"];
  // Check if bearer is undefined
  if (typeof bearerHeader !== "undefined") {
    // Split at the space
    const bearer = bearerHeader.split(" ");
    // Get token from array
    const bearerToken = bearer[1];
    // Set the token
    res.locals.token = bearerToken;
    // Next middleware
    next();
  } else {
    // Forbidden
    res.status(403).json({ errors: [{ msg: "Token is missing" }] });
  }
}

export function extractBearerToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const bearerHeader = req.headers["authorization"];
  // Check if bearer is undefined
  if (typeof bearerHeader !== "undefined") {
    // Split at the space
    const bearer = bearerHeader.split(" ");
    // Get token from array
    const bearerToken = bearer[1];
    // Set the token
    res.locals.token = bearerToken;
    // Next middleware
  }
  next();
}

export function getMatchCondition(
  token: string,
  userId: string,
  blogId: string,
) {
  let matchCondition;
  try {
    const decoded = jwt.verify(token, EnvVars.Jwt.Secret);
    if (typeof decoded === "object" && "id" in decoded && decoded.id === userId)
      matchCondition = {
        _id: mongoose.Types.ObjectId.createFromHexString(blogId),
      };
    else
      matchCondition = {
        _id: mongoose.Types.ObjectId.createFromHexString(blogId),
        published: true,
      };
  } catch {
    matchCondition = {
      _id: mongoose.Types.ObjectId.createFromHexString(blogId),
      published: true,
    };
  }
  return matchCondition;
}

export function handleValidation(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    res.status(400).json({
      errors: result.array(),
      data: req.body as UserBody | BlogBody,
    });
  } else next();
}

export async function handleUserLookUp(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  let condition = {};
  if (res.locals.password) condition = { password: 1 };
  res.locals.password = false;
  const { userId } = matchedData(req);
  try {
    const user = await userModel.findById(userId, condition);
    if (user === null) {
      res.status(404).json({
        errors: [{ msg: "User not found" }],
      });
    } else {
      res.locals.user = user;
    }
  } catch (err) {
    if (err instanceof Error && err.name === "CastError")
      res.status(400).json({ errors: [{ msg: "User Id is invalid" }] });
    else next(err);
  }

  next();
}

export function doesTokenMatchUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const decoded = jwt.verify(res.locals.token as string, EnvVars.Jwt.Secret);
  const user = res.locals.user as IUser;
  if (
    typeof decoded === "object" &&
    "id" in decoded &&
    decoded.id === user._id.toString()
  ) {
    next();
  } else {
    res.status(401).json({
      errors: [{ msg: "Signed user does not match sent user" }],
    });
  }
}

export function doesTokenMatchCommentUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const decoded = jwt.verify(res.locals.token as string, EnvVars.Jwt.Secret);
  const comment = res.locals.comment as IComment;
  if (
    typeof decoded === "object" &&
    "id" in decoded &&
    decoded.id === comment.user.toString()
  ) {
    next();
  } else {
    res.status(401).json({
      errors: [{ msg: "Comment doesn't belong to signed user" }],
    });
  }
}

export async function handleBlogLookUp(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { blogId } = matchedData(req);
  try {
    const blog = await blogModel.findById(blogId);
    const user = res.locals.user as IUser;
    if (blog === null) {
      res.status(404).json({
        errors: [{ msg: "Blog not found" }],
      });
    } else if (user.blogs.includes(blog._id)) {
      res.locals.blog = blog;
    } else {
      res.status(403).json({
        errors: [{ msg: "Blog was found but didn't belong to specified user" }],
      });
    }
  } catch (err) {
    if (err instanceof Error && err.name === "CastError")
      res.status(400).json({ errors: [{ msg: "Blog Id is invalid" }] });
    else next(err);
  }

  next();
}

export async function handleCommentLookUp(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { commentId } = matchedData(req) as {
    commentId: string;
  };
  try {
    const blog = res.locals.blog as IBlog;
    const comment = await commentModel.findById(commentId);
    if (comment !== null) {
      if (blog.comments.includes(comment._id)) {
        res.locals.comment = comment;
      } else
        res.status(403).json({
          errors: [
            { msg: "Comment was found but didn't belong to specified blog" },
          ],
        });
    } else res.status(404).json({ errors: [{ msg: "Comment not found" }] });
  } catch (err) {
    if (err instanceof Error && err.name === "CastError")
      res.status(400).json({ errors: [{ msg: "Comment Id is invalid" }] });
    else next(err);
  }
  next();
}

export const commentValidationChain = () => [
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
];
