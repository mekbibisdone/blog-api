/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import app from "@src/server";
import supertest from "supertest";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import userModel from "@src/models/user";
import EnvVars from "@src/constants/EnvVars";

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
    await userModel.deleteMany({});
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

  it("returns the saved blog all requirements are met", async () => {
    const response = await api
      .post("/api/blog")
      .set({ authorization: `Bearer ${token}` })
      .send({ ...blog, userId: id });
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(201);
    expect(response.body.title).toBe(blog.title);
    expect(response.body.content).toBe(blog.content);
    expect(response.body.published).toBe(blog.published);
    expect(response.body.timestamp).toBeDefined();
  });

  it("returns an error if token is missing", async () => {
    const response = await api.post("/api/blog").send({ ...blog, userId: id });
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(403);
    expect(response.body.errors).toBeDefined();
  });

  it("returns an error if any of the blog fields are missing", async () => {
    const response = await api
      .post("/api/blog")
      .set({ authorization: `Bearer ${token}` })
      .send({ userId: id });
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });

  it("returns an error if userId is missing", async () => {
    const response = await api
      .post("/api/blog")
      .set({ authorization: `Bearer ${token}` })
      .send({ ...blog });
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });

  it("returns an error if content length is higher than the limit", async () => {
    const response = await api
      .post("/api/blog")
      .set({ authorization: `Bearer ${token}` })
      .send({ ...blog, content: "a".repeat(70000 + 1) });
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });
  it("returns an error if the content length is lower than the limit", async () => {
    const response = await api
      .post("/api/blog")
      .set({ authorization: `Bearer ${token}` })
      .send({ ...blog, content: "a".repeat(2000 - 1) });
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });
  it("returns an error if title length is higher than the limit", async () => {
    const response = await api
      .post("/api/blog")
      .set({ authorization: `Bearer ${token}` })
      .send({ ...blog, title: "a".repeat(60 + 1) });
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });
  it("returns an error if the title length is lower than the limit", async () => {
    const response = await api
      .post("/api/blog")
      .set({ authorization: `Bearer ${token}` })
      .send({ ...blog, title: "a".repeat(2 - 1) });
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });
  it("returns an error if published is not a boolean", async () => {
    const response = await api
      .post("/api/blog")
      .set({ authorization: `Bearer ${token}` })
      .send({ ...blog, published: "true" });
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });
});
