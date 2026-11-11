
import "server-only";

import { API_CONFIG, validateApiConfig } from "./api-config";
import { handleApiResponse } from "./api-error";

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, item));
    } else {
      searchParams.append(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

async function request(path, options = {}) {
  validateApiConfig();

  const {
    method = "GET",
    params,
    body,
    headers = {},
    responseType = "json",
    cache = "no-store",
    next,
  } = options;

  const cleanPath = path.replace(/^\/+/, "");
  const baseURL = API_CONFIG.baseURL.replace(/\/+$/, "");
  const url = `${baseURL}/${cleanPath}${buildQuery(params)}`;

  const requestHeaders = new Headers(headers);

  requestHeaders.set("X-Storefront-Key", API_CONFIG.storefrontKey);

  if (API_CONFIG.storefrontSecret) {
    requestHeaders.set(
      "X-Storefront-Secret",
      API_CONFIG.storefrontSecret
    );
  }

  let requestBody;

  if (body !== undefined && body !== null) {
    if (
      body instanceof FormData ||
      body instanceof Blob ||
      typeof body === "string"
    ) {
      requestBody = body;
    } else {
      requestHeaders.set("Content-Type", "application/json");
      requestBody = JSON.stringify(body);
    }
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: requestBody,
    cache,
    ...(next ? { next } : {}),
  });

  return handleApiResponse(response, responseType);
}

const serverApi = {
  get(path, options = {}) {
    return request(path, { ...options, method: "GET" });
  },

  post(path, body, options = {}) {
    return request(path, { ...options, method: "POST", body });
  },

  put(path, body, options = {}) {
    return request(path, { ...options, method: "PUT", body });
  },

  patch(path, body, options = {}) {
    return request(path, { ...options, method: "PATCH", body });
  },

  delete(path, options = {}) {
    return request(path, { ...options, method: "DELETE" });
  },

  request,
};

export default serverApi;
