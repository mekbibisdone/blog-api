import { IBlog } from "@src/models/blog";
import { IUser } from "@src/models/user";
import "express";

// **** Declaration Merging **** //

declare module "express" {
  export interface Request {
    signedCookies: Record<string, string>;
  }
}

export interface UserBody {
  fullname: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

export interface BlogBody {
  title: string;
  content: string;
  userId: string;
  published: boolean;
}

export interface QueriedUser extends IUser {
  blogs: IBlog[];
}

export interface QueriedBlog extends IBlog {}
export type LoginBody = Pick<UserBody, "email" | "password">;
