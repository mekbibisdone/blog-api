import { Temporal } from "@js-temporal/polyfill";
import { BlogBody } from "@src/controller/types";
import blogModel, { IBlog } from "@src/models/blog";
import commentModel from "@src/models/comment";
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

export async function saveComment(
  blogId: string,
  userId: string,
  comment: string,
) {
  const savedComment = await new commentModel({
    content: comment,
    user: userId,
    timestamp: Temporal.Instant.from(Temporal.Now.instant().toString()),
  }).save();
  await blogModel.findByIdAndUpdate(blogId, {
    $push: { comments: savedComment._id },
  });

  return saveComment;
}
