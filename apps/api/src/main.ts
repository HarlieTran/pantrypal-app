import "dotenv/config";
import { createServer } from "node:http";
import { handleApiRoute } from "./modules/api/index.js";

const port = Number(process.env.PORT || 8788);
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

function sendJson(res: import("node:http").ServerResponse, status: number, body: unknown) {
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": frontendOrigin,
    "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
    "access-control-allow-headers": "Content-Type,Authorization",
  });
  res.end(JSON.stringify(body));
}

function readBody(req: import("node:http").IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  if (!req.url) return sendJson(res, 400, { error: "Invalid request" });
  if (req.method === "OPTIONS") return sendJson(res, 204, {});

  const rawBody =
    req.method === "PUT" || req.method === "POST" || req.method === "PATCH"
      ? await readBody(req)
      : undefined;
  const response = await handleApiRoute(req.method ?? "GET", req.url, req.headers.authorization, rawBody);
  return sendJson(res, response.statusCode, response.body);
});

server.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});

