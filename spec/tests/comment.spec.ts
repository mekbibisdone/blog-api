/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import app from "@src/server";
import supertest from "supertest";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import EnvVars from "@src/constants/EnvVars";
import userModel from "@src/models/user";
import { saveBlogs, saveComment } from "./utils";
import { BlogBody, QueriedBlog } from "@src/controller/types";
import { IBlog } from "@src/models/blog";

const api = supertest(app);

describe("Comment creation", () => {
  const userData = {
    fullname: "daniel",
    email: "d@d.com",
    password: "g6Ol0a55&4<r",
  };
  let userId: string;
  let blogId: string;
  let unpublishedBlogId: string;

  let token: string;
  const blog = {
    title: "Greetings",
    content: "H".repeat(2001),
    published: true,
  };

  const unpublishedBlog = {
    title: "Greetings",
    content: "H".repeat(2001),
    published: false,
  };

  const passwordHash = bcrypt.hashSync(userData.password, 10);
  beforeEach(async () => {
    const newUser = new userModel({
      ...userData,
      password: passwordHash,
    });
    const savedUser = await newUser.save();
    userId = savedUser._id.toString();
    token = jwt.sign(
      { fullname: userData.fullname, email: userData.email, id: userId },
      EnvVars.Jwt.Secret,
    );
    const savedBlogs = await saveBlogs(
      [blog, unpublishedBlog] as BlogBody[],
      savedUser,
    );
    blogId = savedBlogs
      .filter((blog) => blog.published === true)[0]
      ._id.toString();
    unpublishedBlogId = savedBlogs
      .filter((blog) => blog.published === false)[0]
      ._id.toString();
  }, 10000);

  afterEach(async () => {
    await userModel.deleteMany({});
    await userModel.deleteMany({});
  });

  it("returns the saved comment if all conditions are met", async () => {
    const comment = "w".repeat(2);
    const response = await api
      .post(`/api/users/${userId}/blogs/${blogId}/comments`)
      .set({ authorization: `Bearer ${token}` })
      .send({ comment });

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(201);
    expect(response.body.comment.content).toBe(comment);
  });

  it("returns a 403 if blog to be commented on is\
     unpublished", async () => {
    const comment = "w".repeat(500);
    const response = await api
      .post(`/api/users/${userId}/blogs/${unpublishedBlogId}/comments`)
      .set({ authorization: `Bearer ${token}` })
      .send({ comment });
    expect(response.status).toBe(403);
    expect(response.body.errors[0].msg).toBe(
      "Can't comment on unpublished blog",
    );
  });
});

describe("Comment fetching", () => {
  const userData = {
    fullname: "daniel",
    email: "d@d.com",
    password: "g6Ol0a55&4<r",
  };
  let userId: string;
  let blogId: string;

  const blog = {
    title: "Greetings",
    content: "H".repeat(2001),
    published: true,
  };
  const passwordHash = bcrypt.hashSync(userData.password, 10);

  beforeEach(async () => {
    const newUser = new userModel({
      ...userData,
      password: passwordHash,
    });
    const savedUser = await newUser.save();
    userId = savedUser._id.toString();

    const savedBlogs = await saveBlogs([blog] as BlogBody[], savedUser);
    blogId = savedBlogs[0]._id.toString();
  }, 10000);

  afterEach(async () => {
    await userModel.deleteMany({});
    await userModel.deleteMany({});
  });

  it("returns a blog with no comments \
    if there are no saved comments", async () => {
    const response = await api.get(`/api/users/${userId}/blogs/${blogId}/`);

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(200);
    const fetchedBlog = response.body.user.blogs[0] as IBlog;
    expect(fetchedBlog.comments).toHaveSize(0);
  });

  it("returns a blog with the saved comments \
    if a comment is saved", async () => {
    const comment = "w".repeat(2);
    await saveComment(blogId, userId, comment);
    const response = await api.get(`/api/users/${userId}/blogs/${blogId}/`);

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(200);
    const fetchedBlog = response.body.user.blogs[0] as QueriedBlog;
    expect(fetchedBlog.comments[0].content).toBe(comment);
  });

  it("returns a single comment if the comment exists", async () => {
    const comment = "w".repeat(2);
    const commentId = (await saveComment(blogId, userId, comment))._id;
    const response = await api.get(
      `/api/users/${userId}/blogs/${blogId}/comments/\
      ${commentId._id.toString()}`,
    );

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(200);
    expect(response.body.comment.content).toBe(comment);
  });
});
