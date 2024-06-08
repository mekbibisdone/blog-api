/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import supertest from "supertest";
import express from "express";
import { handleBearerToken } from "@src/controller/utils";
import TestAgent from "supertest/lib/agent";

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
