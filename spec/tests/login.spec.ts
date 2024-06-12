/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import userModel from "@src/models/user";
import app from "@src/server";
import supertest from "supertest";
import bcrypt from "bcrypt";

const api = supertest(app);
describe("Login", () => {
  const data = {
    fullname: "daniel",
    email: "d@d.com",
    password: "g6Ol0a55&4<r",
  };

  beforeEach(async () => {
    await userModel.deleteMany({});
    const passwordHash = await bcrypt.hash(data.password, 10);
    const newUser = new userModel({
      ...data,
      password: passwordHash,
    });
    await newUser.save();
  }, 10000);

  it("returns the user's info and a token if credentials are correct", async () => {
    const response = await api.post("/api/login").send({ ...data });
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.fullname).toBe(data.fullname);
    expect(response.body.email).toBe(data.email);
  });

  it("returns an error if the password is incorrect", async () => {
    const response = await api
      .post("/api/login")
      .send({ email: data.email, password: "dfs" });
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(401);
    expect(response.body.errors).toBeDefined();
  });

  it("returns an error if the email is not found", async () => {
    const response = await api
      .post("/api/login")
      .send({ email: "poop@gmail.com", password: data.password });
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(401);
    expect(response.body.errors).toBeDefined();
  });

  it("returns a list of errors if validation fails", async () => {
    const response = await api.post("/api/login").send({});
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });
});
