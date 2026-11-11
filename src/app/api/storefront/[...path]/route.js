
const API_BASE_URL = process.env.STOREFRONT_API_BASE_URL;
const STOREFRONT_KEY = process.env.STOREFRONT_API_KEY;
const STOREFRONT_SECRET = process.env.STOREFRONT_API_SECRET || "";

async function handler(request, context) {
  try {
    if (!API_BASE_URL || !STOREFRONT_KEY) {
      return Response.json(
        { success: false, message: "Storefront API configuration is missing." },
        { status: 500 }
      );
    }

    const { path = [] } = await context.params;

    if (
      !Array.isArray(path) ||
      path.length === 0 ||
      path.some((segment) => !segment || segment === "." || segment === "..")
    ) {
      return Response.json(
        { success: false, message: "Invalid API path." },
        { status: 400 }
      );
    }

    const encodedPath = path.map(encodeURIComponent).join("/");
    const incomingUrl = new URL(request.url);

    const targetUrl = new URL(
      `${API_BASE_URL.replace(/\/+$/, "")}/${encodedPath}`
    );

    targetUrl.search = incomingUrl.search;

    const headers = new Headers();

    headers.set("X-Storefront-Key", STOREFRONT_KEY);
    headers.set("Accept", request.headers.get("accept") || "application/json");

    if (STOREFRONT_SECRET) {
      headers.set("X-Storefront-Secret", STOREFRONT_SECRET);
    }

    const customerToken = request.headers.get("X-Customer-Token");
    const origin = request.headers.get("origin");
    const contentType = request.headers.get("content-type");

    if (customerToken) {
      headers.set("X-Customer-Token", customerToken);
    }

    if (origin) {
      headers.set("Origin", origin);
    }

    if (contentType) {
      headers.set("Content-Type", contentType);
    }

    const method = request.method;
    const body =
      method === "GET" || method === "HEAD"
        ? undefined
        : await request.arrayBuffer();

    const upstreamResponse = await fetch(targetUrl, {
      method,
      headers,
      body,
      cache: "no-store",
    });

    const responseHeaders = new Headers();

    for (const header of [
      "content-type",
      "content-disposition",
      "cache-control",
      "retry-after",
    ]) {
      const value = upstreamResponse.headers.get(header);
      if (value) responseHeaders.set(header, value);
    }

    return new Response(await upstreamResponse.arrayBuffer(), {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Storefront proxy error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to connect to the storefront API.",
      },
      { status: 502 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
