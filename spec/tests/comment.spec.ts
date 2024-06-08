/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import app from "@src/server";
import supertest from "supertest";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import EnvVars from "@src/constants/EnvVars";
import userModel from "@src/models/user";
import { saveBlogs } from "./util";
import { BlogBody } from "@src/controller/types";

const api = supertest(app);

describe("Comment creation", () => {
  const userData = {
    fullname: "daniel",
    email: "d@d.com",
    password: "g6Ol0a55&4<r",
  };
  let userId: string;
  let blogId: string;

  let token: string;
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
    token = jwt.sign(
      { fullname: userData.fullname, email: userData.email, id: userId },
      EnvVars.Jwt.Secret,
    );
    const savedBlogs = await saveBlogs([blog] as BlogBody[], savedUser);
    blogId = savedBlogs[0]._id.toString();
  }, 10000);

  afterEach(async () => {
    await userModel.deleteMany({});
    await userModel.deleteMany({});
  });

  it("returns the saved comment if all conditions are met", async () => {
    const comment = "w".repeat(5000);
    const response = await api
      .post(`/api/blog/${blogId}/user/${userId}/comments`)
      .set({ authorization: `Bearer ${token}` })
      .send({ comment });

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(201);
    expect(response.body.comment.content).toBe(comment);
  });

  it("returns an error if the comment is missing", async () => {
    const response = await api
      .post(`/api/blog/${blogId}/user/${userId}/comments`)
      .set({ authorization: `Bearer ${token}` });

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(400);
    expect(response.body.errors[0].msg).toBe("Comment is required");
  });
});
