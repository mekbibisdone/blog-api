/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import app from "@src/server";
import supertest from "supertest";

it("saves a user and return user data & token,\
 if all given fields are valid", async () => {
  const response = await supertest(app).post("/api/user").send({
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
  const response = await supertest(app).post("/api/user").send(incorrectData);
  expect(response.headers["content-type"]).toMatch(/json/);
  expect(response.status).toBe(400);
  expect(response.body.errors).toBeDefined();
  expect(response.body.data).toEqual(incorrectData);
});
