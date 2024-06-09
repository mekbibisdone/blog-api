/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import app from "@src/server";
import supertest from "supertest";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import userModel from "@src/models/user";
import EnvVars from "@src/constants/EnvVars";

const api = supertest(app);

describe("User creation", () => {
  it("saves a user and return user data & token,\
 if all given fields are valid", async () => {
    const response = await api.post("/api/user").send({
      fullname: "daniel",
      email: "daniel@d.com",
      password: "g6Ol0a55&4<r",
      passwordConfirmation: "g6Ol0a55&4<r",
    });
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(201);
    expect(response.body.fullname).toBe("daniel");
    expect(response.body.email).toBe("daniel@d.com");
    expect(response.body.token).toBeDefined();
  });

  it("returns a list of errors and sent data, \
if any of the sent fields are invalid", async () => {
    const incorrectData = {
      fullname: "d",
      email: "daniel",
      password: "a",
      passwordConfirmation: "c",
    };
    const response = await api.post("/api/user").send(incorrectData);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
    expect(response.body.data).toEqual(incorrectData);
  });
});

describe("User deletion", () => {
  const data = {
    fullname: "daniel",
    email: "d@d.com",
    password: "g6Ol0a55&4<r",
  };
  let id: string;
  let token: string;
  beforeEach(async () => {
    await userModel.deleteMany({});
    const passwordHash = await bcrypt.hash(data.password, 10);
    const newUser = new userModel({
      ...data,
      password: passwordHash,
    });
    const savedUser = (await newUser.save()).toJSON();
    id = savedUser._id.toString();
    token = jwt.sign(
      { fullname: data.fullname, email: data.email, id },
      EnvVars.Jwt.Secret,
    );
  }, 10000);

  it("returns a successful message when a correct token is sent", async () => {
    const response = await api.delete(`/api/user/${id}`).set({
      authorization: `Bearer ${token}`,
    });
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(200);
    expect(response.body.msg).toBeDefined();
  });

  it("returns an error if token does not match signed user", async () => {
    const wrongToken = jwt.sign({ hello: "hello" }, EnvVars.Jwt.Secret);
    const response = await api.delete(`/api/user/${id}`).set({
      authorization: `Bearer ${wrongToken}`,
    });
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(401);
    expect(response.body.errors).toBeDefined();
  });
});

describe("User update", () => {
  const data = {
    fullname: "daniel",
    email: "d@d.com",
    password: "g6Ol0a55&4<r",
  };
  let id: string;
  let token: string;
  beforeEach(async () => {
    await userModel.deleteMany({});
    const passwordHash = await bcrypt.hash(data.password, 10);
    const newUser = new userModel({
      ...data,
      password: passwordHash,
    });
    const savedUser = (await newUser.save()).toJSON();
    id = savedUser._id.toString();
    token = jwt.sign(
      { fullname: data.fullname, email: data.email, id },
      EnvVars.Jwt.Secret,
    );
  }, 10000);

  it("updates the fullname and returns the updated data", async () => {
    const newFullName = { fullname: "Paulo Santos" };
    const response = await api
      .put(`/api/user/${id}/fullname`)
      .set({
        authorization: `Bearer ${token}`,
      })
      .send(newFullName);
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(201);
    expect(response.body.fullname).toBe(newFullName.fullname);
  });

  it("returns an error if data validation fails", async () => {
    const response = await api.put(`/api/user/${id}/fullname`).set({
      authorization: `Bearer ${token}`,
    });
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });

  it("updates password successfully\
   , if old password and token is sent", async () => {
    const oldPassword = data.password;
    const newPassword = "6<9C6_]8Z3l}";

    const response = await api
      .put(`/api/user/${id}/password`)
      .set({
        authorization: `Bearer ${token}`,
      })
      .send({
        oldPassword,
        newPassword,
      });
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(201);
    expect(response.body.msg).toBeDefined();
  });

  it("returns an error if old password does not match", async () => {
    const oldPassword = "fjpadjfpo";
    const newPassword = "6<9C6_]8Z3l}";

    const response = await api
      .put(`/api/user/${id}/password`)
      .set({
        authorization: `Bearer ${token}`,
      })
      .send({
        oldPassword,
        newPassword,
      });

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(401);
    expect(response.body.errors).toBeDefined();
  });

  it("returns an error if the new password is not strong enough", async () => {
    const oldPassword = data.password;
    const newPassword = "abc";

    const response = await api
      .put(`/api/user/${id}/password`)
      .set({
        authorization: `Bearer ${token}`,
      })
      .send({
        oldPassword,
        newPassword,
      });

    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });
});
