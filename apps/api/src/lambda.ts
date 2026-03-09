import { dispatchApiRoute } from "./modules/api/index.js";

type ApiGatewayEvent = {
  rawPath: string;
  rawQueryString?: string;
  body?: string | null;
  isBase64Encoded?: boolean;
  requestContext?: { http?: { method?: string }; stage?: string  };
  headers?: Record<string, string | undefined>;
};

const corsHeaders = {
  "content-type": "application/json",
  "access-control-allow-origin": process.env.FRONTEND_ORIGIN || "*",
  "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
  "access-control-allow-headers": "Content-Type,Authorization",
};

export async function handler(event: ApiGatewayEvent) {
  const method = event.requestContext?.http?.method ?? "GET";
  const stage = event.requestContext?.stage ?? "";
  const rawPath = stage && event.rawPath?.startsWith(`/${stage}`)
  ? event.rawPath.slice(stage.length + 1) || "/"
  : event.rawPath || "/";
  const rawQuery = event.rawQueryString ? `?${event.rawQueryString}` : "";
  const path = `${rawPath}${rawQuery}`;

  const authHeader = event.headers?.authorization ?? event.headers?.Authorization;

  const rawBody =
    event.body == null
      ? undefined
      : event.isBase64Encoded
        ? Buffer.from(event.body, "base64").toString("utf8")
        : event.body;

  if (method === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: JSON.stringify({}),
    };
  }

  const response = await dispatchApiRoute(method, path, authHeader, rawBody);

  return {
    statusCode: response.statusCode,
    headers: corsHeaders,
    body: JSON.stringify(response.body),
  };
}

