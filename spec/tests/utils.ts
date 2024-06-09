import { Temporal } from "@js-temporal/polyfill";
import { BlogBody } from "@src/controller/types";
import blogModel, { IBlog } from "@src/models/blog";
import { IUser } from "@src/models/user";
import { Document, Types } from "mongoose";

export async function saveBlogs(
  blogs: BlogBody[],
  user: Document<unknown, object, IUser> &
    IUser &
    Required<{ _id: Types.ObjectId }>,
) {
  const savedBlogs: IBlog[] = [];
  for await (const blog of blogs) {
    const savedBlog = await new blogModel({
      ...blog,
      timestamp: Temporal.Instant.from(Temporal.Now.instant().toString()),
    }).save();
    user.blogs.push(savedBlog._id);
    savedBlogs.push(savedBlog);
  }
  await user.save();
  return savedBlogs;
}
