import { ApiError, handleApiResponse } from "./api-error";

const PROXY_URL = "/api/storefront";

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
    const {
        method = "GET",
        params,
        body,
        headers = {},
        responseType = "json",
        cache = "no-store",
        signal,
    } = options;

    const cleanPath = path.replace(/^\/+/, "");

    const url = `${PROXY_URL}/${cleanPath}${buildQuery(params)}`;

    const requestHeaders = new Headers(headers);

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


    // Automatically attach customer token to API requests
    if (typeof window !== "undefined") {
        const customerToken = localStorage.getItem("customerToken");

        if (customerToken && !requestHeaders.has("X-Customer-Token")) {
            requestHeaders.set("X-Customer-Token", customerToken);
        }
    }


    try {
        const response = await fetch(url, {
            method,
            headers: requestHeaders,
            body: requestBody,
            cache,
            signal,
        });

        if (responseType === "blob" && response.ok) {
            return await response.blob();
        }

        return await handleApiResponse(response, responseType);
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        if (error.name === "AbortError") {
            throw error;
        }

        throw new ApiError({
            message: error.message || "Unable to connect to the store.",
            status: 0,
            error: "NETWORK_ERROR",
        });
    }
}

const api = {
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
        return request(path, {
            ...options,
            method: "DELETE",
        });
    },

    request,
};

export default api;