/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import app from "@src/server";
import supertest from "supertest";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import userModel, { IUser } from "@src/models/user";
import EnvVars from "@src/constants/EnvVars";
import blogModel from "@src/models/blog";
import { BlogBody, QueriedUser } from "@src/controller/types";
import { Document, Types } from "mongoose";
import { saveBlogs } from "./utils";

const api = supertest(app);

describe("Blog creation", () => {
  const userData = {
    fullname: "daniel",
    email: "d@d.com",
    password: "g6Ol0a55&4<r",
  };
  let id: string;
  let token: string;
  const blog = {
    title: "Greetings",
    content: "H".repeat(2001),
    published: true,
  };
  beforeEach(async () => {
    const passwordHash = await bcrypt.hash(userData.password, 10);
    const newUser = new userModel({
      ...userData,
      password: passwordHash,
    });
    const savedUser = (await newUser.save()).toJSON();
    id = savedUser._id.toString();
    token = jwt.sign(
      { fullname: userData.fullname, email: userData.email, id },
      EnvVars.Jwt.Secret,
    );
  }, 10000);
  afterEach(async () => {
    await userModel.deleteMany({});
  });
  it("returns the saved blogs if all requirements are met", async () => {
    const response = await api
      .post(`/api/blog/user/${id}`)
      .set({ authorization: `Bearer ${token}` })
      .send({ ...blog });

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(201);
    expect(response.body.title).toBe(blog.title);
    expect(response.body.content).toBe(blog.content);
    expect(response.body.published).toBe(blog.published);
    expect(response.body.timestamp).toBeDefined();
  });

  it("returns an error if the blog data isn't sent", async () => {
    const response = await api
      .post(`/api/blog/user/${id}`)
      .set({ authorization: `Bearer ${token}` });

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });

  it("retrun an error if the userId doesn't match token", async () => {
    const userDataTwo = {
      fullname: "waterson",
      email: "p@p.com",
      password: "q5=Q£9V7a-86",
    };
    const passwordHashTwo = await bcrypt.hash(userDataTwo.password, 10);
    const savedUserTwo = await new userModel({
      ...userDataTwo,
      password: passwordHashTwo,
    }).save();

    const response = await api
      .post(`/api/blog/user/${savedUserTwo._id.toString()}`)
      .set({ authorization: `Bearer ${token}` })
      .send({ ...blog });

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(401);
    expect(response.body.errors[0].msg).toBe(
      "Token does not match signed user",
    );
  });

  it("returns an error if content length is\
   higher than the limit", async () => {
    const response = await api
      .post(`/api/blog/user/${id}`)
      .set({ authorization: `Bearer ${token}` })
      .send({ ...blog, content: "a".repeat(70000 + 1) });

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(400);
    expect(response.body.errors[0].msg).toBe(
      "Content must be between 2000 and 70000 characters",
    );
  });
  it("returns an error if the content length is\
   lower than the limit", async () => {
    const response = await api
      .post(`/api/blog/user/${id}`)
      .set({ authorization: `Bearer ${token}` })
      .send({ ...blog, content: "a".repeat(2000 - 1) });

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(400);
    expect(response.body.errors[0].msg).toBe(
      "Content must be between 2000 and 70000 characters",
    );
  });
  it("returns an error if title length is higher than the limit", async () => {
    const response = await api
      .post(`/api/blog/user/${id}`)
      .set({ authorization: `Bearer ${token}` })
      .send({ ...blog, title: "a".repeat(60 + 1) });

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(400);
    expect(response.body.errors[0].msg).toBe(
      "Title must be between 2 and 60 characters",
    );
  });
  it("returns an error if the title length is \
  lower than the limit", async () => {
    const response = await api
      .post(`/api/blog/user/${id}`)
      .set({ authorization: `Bearer ${token}` })
      .send({ ...blog, title: "a".repeat(2 - 1) });

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(400);
    expect(response.body.errors[0].msg).toBe(
      "Title must be between 2 and 60 characters",
    );
  });
  it("returns an error if published is not a boolean", async () => {
    const response = await api
      .post(`/api/blog/user/${id}`)
      .set({ authorization: `Bearer ${token}` })
      .send({ ...blog, published: "loop" });

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(400);
    expect(response.body.errors[0].msg).toBe(
      "Published must be a boolean value",
    );
  });
});

describe("Blog fetching", () => {
  const userData = {
    fullname: "daniel",
    email: "d@d.com",
    password: "g6Ol0a55&4<r",
  };
  const userDataTwo = {
    fullname: "waterson",
    email: "p@p.com",
    password: "q5=Q£9V7a-86",
  };
  let savedUser: Document<unknown, object, IUser> &
    IUser &
    Required<{ _id: Types.ObjectId }>;
  let savedUserTwo: Document<unknown, object, IUser> &
    IUser &
    Required<{ _id: Types.ObjectId }>;

  let id: string;
  let token: string;
  const blogs = [
    {
      title: "Greetings",
      content: "H".repeat(2001),
      published: true,
    },
    {
      title: "Welcome to the World",
      content: "W".repeat(2001),
      published: true,
    },
    {
      title: "JavaScript Adventures",
      content: "J".repeat(2001),
      published: true,
    },
    {
      title: "Coding Chronicles",
      content: "C".repeat(2001),
      published: true,
    },
    {
      title: "Tech Talks",
      content: "T".repeat(2001),
      published: true,
    },
  ];
  const passwordHash = bcrypt.hashSync(userData.password, 10);
  const passwordHashTwo = bcrypt.hashSync(userDataTwo.password, 10);

  beforeEach(async () => {
    const newUser = new userModel({
      ...userData,
      password: passwordHash,
    });
    const newUserTwo = new userModel({
      ...userDataTwo,
      password: passwordHashTwo,
    });
    savedUser = await newUser.save();
    savedUserTwo = await newUserTwo.save();

    id = savedUser._id.toString();
    token = jwt.sign(
      { fullname: userData.fullname, email: userData.email, id },
      EnvVars.Jwt.Secret,
    );
  }, 10000);

  afterEach(async () => {
    await userModel.deleteMany({});
    await blogModel.deleteMany({});
  });

  it("returns an empty list if there\
   are no blogs currently saved", async () => {
    const response = await api.get("/api/blog");
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(200);
    expect(response.body.users[0].blogs).toEqual([]);
  });

  it("returns a list of blogs if there are blogs currently saved", async () => {
    await saveBlogs(blogs as BlogBody[], savedUser);
    const response = await api.get("/api/blog");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const userOne = response.body.users.filter(
      (user: { _id: string }) => user._id.toString() === id,
    )[0] as QueriedUser;

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(200);
    expect(userOne.blogs).toHaveSize(blogs.length);
    expect(userOne.blogs[0].title).toBe(blogs[0].title);
  });

  it("returns only the list of blogs that are published", async () => {
    const blogsCopy = blogs.map((blog) => Object.assign({}, blog));
    blogsCopy[0].published = false;
    blogsCopy[1].published = false;
    await saveBlogs(blogsCopy as BlogBody[], savedUser);
    const response = await api.get("/api/blog");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const userOne = response.body.users.filter(
      (user: { _id: string }) => user._id.toString() === id,
    )[0] as QueriedUser;

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(200);
    expect(userOne.blogs).toHaveSize(blogsCopy.length - 2);
  });

  it("returns only the blogs that belongs\
   to the the specified author", async () => {
    const userOneBlog = blogs[0];
    const userTwoBlog = blogs[1];
    const savedUserOneBlogs = await saveBlogs(
      [userOneBlog] as BlogBody[],
      savedUser,
    );
    await saveBlogs([userTwoBlog] as BlogBody[], savedUserTwo);
    const response = await api.get(`/api/blog/user/${id}`);
    const userOne = response.body.user as QueriedUser;

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(200);
    expect(userOne.blogs).toHaveSize(1);
    expect(userOne.blogs[0].title).toBe(savedUserOneBlogs[0].title);
  });

  it("returns only the blogs that belongs to the\
  specified author and are published", async () => {
    const userOneBlog = blogs[0];
    const userOneBlogTwo = Object.assign({}, blogs[1]);
    userOneBlogTwo.published = false;
    const userTwoBlog = blogs[2];
    await saveBlogs([userOneBlog, userOneBlogTwo] as BlogBody[], savedUser);
    await saveBlogs([userTwoBlog] as BlogBody[], savedUserTwo);

    const response = await api.get(`/api/blog/user/${id}`);
    const userOne = response.body.user as QueriedUser;

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(200);
    expect(userOne.blogs).toHaveSize(1);
  });

  it("returns both the published and unpublished blogs \
  if the user is authenticated and is the author", async () => {
    const userOneBlog = blogs[0];
    const userOneBlogTwo = Object.assign({}, blogs[1]);
    userOneBlogTwo.published = false;
    await saveBlogs([userOneBlog, userOneBlogTwo] as BlogBody[], savedUser);

    const response = await api
      .get(`/api/blog/user/${id}`)
      .set({ authorization: `Bearer ${token}` });
    const userOne = response.body.user as QueriedUser;

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(200);
    expect(userOne.blogs).toHaveSize(2);
  });

  it("returns a single blog that matches the query", async () => {
    const userOneBlog = blogs[0];
    const savedBlogs = await saveBlogs([userOneBlog as BlogBody], savedUser);

    const response = await api.get(
      `/api/blog/${savedBlogs[0]._id.toString()}/user/${id}/`,
    );
    const userOne = response.body.user as QueriedUser;

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(200);
    expect(userOne.blogs[0].title).toBe(savedBlogs[0].title);
  });

  it("returns a 204 status code if the blog matches\
   the query but isn't published", async () => {
    const userOneBlog = Object.assign({}, blogs[0]);
    userOneBlog.published = false;
    const savedBlogs = await saveBlogs([userOneBlog as BlogBody], savedUser);

    const response = await api.get(
      `/api/blog/${savedBlogs[0]._id.toString()}/user/${id}/`,
    );
    expect(response.status).toBe(204);
  });

  it("returns an unpublished blog if the query matches \
  and the signed user is the author", async () => {
    const userOneBlog = Object.assign({}, blogs[0]);
    userOneBlog.published = false;
    const savedBlogs = await saveBlogs([userOneBlog as BlogBody], savedUser);

    const response = await api
      .get(`/api/blog/${savedBlogs[0]._id.toString()}/user/${id}/`)
      .set({ authorization: `Bearer ${token}` });
    const userOne = response.body.user as QueriedUser;

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(200);
    expect(userOne.blogs[0].title).toBe(savedBlogs[0].title);
  });
});
