import { describe, it, expect } from "@jest/globals";
import { dispatchApiRoute } from "../../../src/modules/api/routes/router.js";

describe("Router Integration", () => {
  describe("Health endpoint", () => {
    it("should return 200 for GET /health", async () => {
      const response = await dispatchApiRoute("GET", "/health");
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ ok: true, service: "api" });
    });
  });

  describe("Query string normalization", () => {
    it("should normalize /health?foo=bar to /health", async () => {
      const response = await dispatchApiRoute("GET", "/health?foo=bar");
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ ok: true, service: "api" });
    });

    it("should normalize /me?token=xyz to /me", async () => {
      const response = await dispatchApiRoute("GET", "/me?token=xyz");
      expect(response.statusCode).toBe(401);
    });
  });

  describe("404 handling", () => {
    it("should return 404 for unknown routes", async () => {
      const response = await dispatchApiRoute("GET", "/unknown");
      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({ error: "Not found" });
    });
  });
});
