import EnvVars from "@src/constants/EnvVars";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { validationResult } from "express-validator";
import { matchedData } from "express-validator";
import userModel, { IUser } from "@src/models/user";
import { BlogBody, UserBody } from "./types";
import blogModel from "@src/models/blog";

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
      errors: [{ msg: "Token does not match signed user" }],
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
