/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import supertest from "supertest";
import express from "express";
import {
  handleUserLookUp,
  handleBearerToken,
  doesTokenMatchUser,
  handleBlogLookUp,
} from "@src/controller/utils";
import TestAgent from "supertest/lib/agent";
import bcrypt from "bcrypt";
import userModel from "@src/models/user";
import { Types } from "mongoose";
import { param } from "express-validator";
import jwt from "jsonwebtoken";
import EnvVars from "@src/constants/EnvVars";
import { Temporal } from "@js-temporal/polyfill";
import blogModel from "@src/models/blog";

describe("handleBearerToken middleware", () => {
  let app;
  let request: TestAgent;

  beforeEach(() => {
    app = express();
    app.use(handleBearerToken);
    app.get("/test", (req, res) => res.status(200).json({ success: true }));
    request = supertest(app);
  });
  it("should set token in res.locals and call next if token is present", async () => {
    const response = await request
      .get("/test")
      .set("Authorization", "Bearer testToken123");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("should respond with 403 if token is missing", async () => {
    const response = await request.get("/test");

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(403);
    expect(response.body.errors[0].msg).toBe("Token is missing");
  });
});

describe("handleUserLookUp middleware", () => {
  let app;
  let request: TestAgent;
  const userData = {
    fullname: "daniel",
    email: "d@d.com",
    password: "g6Ol0a55&4<r",
  };

  let userId: string;
  const passwordHash = bcrypt.hashSync(userData.password, 10);
  beforeEach(async () => {
    const newUser = new userModel({
      ...userData,
      password: passwordHash,
    });
    const savedUser = await newUser.save();
    userId = savedUser._id.toString();

    app = express();
    app.get(
      "/test/:userId",
      param("userId").trim().escape().notEmpty(),
      handleUserLookUp,
      (req, res) => res.status(200).json({ success: true }),
    );

    request = supertest(app);
  });

  it("succeeds if the user exists", async () => {
    const response = await request.get(`/test/${userId}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("returns a 404 if the user doesn't exits", async () => {
    const wrongId = Types.ObjectId.createFromBase64("watermelonpowerw");
    const response = await request.get(`/test/${wrongId.toString()}`);

    expect(response.status).toBe(404);
    expect(response.body.errors[0].msg).toBe("User not found");
  });

  it("returns a 400 if the user id is invalid", async () => {
    const response = await request.get("/test/dsf");

    expect(response.status).toBe(400);
    expect(response.body.errors[0].msg).toBe("User Id is invalid");
  });
});

describe("doesTokenMatchUser middleware", () => {
  let app;
  let request: TestAgent;
  let token: string;
  let tokenTwo: string;
  const userData = {
    fullname: "daniel",
    email: "d@d.com",
    password: "g6Ol0a55&4<r",
  };

  let userId: string;
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
    const wrongId = Types.ObjectId.createFromBase64("watermelonpowerw");

    tokenTwo = jwt.sign(
      { fullname: userData.fullname, email: userData.email, id: wrongId },
      EnvVars.Jwt.Secret,
    );
    app = express();
    app.get(
      "/test/:userId",
      param("userId").trim().escape().notEmpty(),
      handleUserLookUp,
      handleBearerToken,
      doesTokenMatchUser,
      (req, res) => res.status(200).json({ success: true }),
    );

    request = supertest(app);
  });

  it("succeeds if the signed user matches token", async () => {
    const response = await request
      .get(`/test/${userId}`)
      .set({ authorization: `Bearer ${token}` });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  it("responds with 401 if token does not match signed user", async () => {
    const response = await request
      .get(`/test/${userId}`)
      .set({ authorization: `Bearer ${tokenTwo}` });

    expect(response.status).toBe(401);
    expect(response.body.errors[0].msg).toBe(
      "Token does not match signed user",
    );
  });
});

describe("handleBlogLookUp middleware", () => {
  let app;
  let request: TestAgent;
  const blogData = {
    title: "Greetings",
    content: "H".repeat(2001),
    published: true,
  };
  let blogId: string;
  beforeEach(async () => {
    const blog = await new blogModel({
      ...blogData,
      timestamp: Temporal.Instant.from(Temporal.Now.instant().toString()),
    }).save();
    blogId = blog._id.toString();
    app = express();
    app.get(
      "/test/:blogId",
      param("blogId").trim().escape().notEmpty(),
      handleBlogLookUp,
      (req, res) => res.status(200).json({ success: true }),
    );

    request = supertest(app);
  });
  it("succeeds if the blog is found", async () => {
    const response = await request.get(`/test/${blogId}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
  it("returns with a 404 if the blog is not found", async () => {
    const wrongId = Types.ObjectId.createFromBase64("watermelonpowerw");
    const response = await request.get(`/test/${wrongId.toString()}`);

    expect(response.status).toBe(404);
    expect(response.body.errors[0].msg).toBe("Blog not found");
  });

  it("returns a 400 if the blog id is invalid", async () => {
    const response = await request.get("/test/asdf");

    expect(response.status).toBe(400);
    expect(response.body.errors[0].msg).toBe("Blog Id is invalid");
  });
});
