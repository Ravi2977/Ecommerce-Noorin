export class ApiError extends Error {
  constructor({
    message = "Something went wrong.",
    status = 500,
    error = "API_ERROR",
    data = null,
  } = {}) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.error = error;
    this.data = data;
  }
}

export async function handleApiResponse(response, responseType = "json") {
  let data;

  try {
    if (responseType === "blob") {
      data = await response.blob();
    } else if (responseType === "text") {
      data = await response.text();
    } else {
      const contentType = response.headers.get("content-type");

      data = contentType?.includes("application/json")
        ? await response.json()
        : await response.text();
    }
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new ApiError({
      message:
        data?.message ||
        data?.error ||
        `Request failed with status ${response.status}`,

      status: response.status,
      error: data?.error || "API_ERROR",
      data,
    });
  }

  return data;
}