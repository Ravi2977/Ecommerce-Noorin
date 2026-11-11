export const API_CONFIG = {
  baseURL: process.env.STOREFRONT_API_BASE_URL,
  storefrontKey: process.env.STOREFRONT_API_KEY,
  storefrontSecret: process.env.STOREFRONT_API_SECRET || "",
  proxyURL: "/api/storefront",
  timeout: 30000,
};

export function validateApiConfig() {
  if (!API_CONFIG.baseURL) {
    throw new Error("STOREFRONT_API_BASE_URL is missing.");
  }

  if (!API_CONFIG.storefrontKey) {
    throw new Error("STOREFRONT_API_KEY is missing.");
  }
}