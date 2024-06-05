import EnvVars from "@src/constants/EnvVars";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { validationResult } from "express-validator";

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
    res.status(403).json({ errors: [{ msg: "Token missing" }] });
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
    });
  } else next();
}
