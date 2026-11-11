
import api from "../core/api";

const BASE_PATH = "/customers/me/addresses";

const getAddressPath = (addressId) => {
  if (addressId === undefined || addressId === null || addressId === "") {
    throw new Error("Address ID is required.");
  }

  return `${BASE_PATH}/${encodeURIComponent(addressId)}`;
};

const addressService = {
  // Get all saved addresses
  getAll: () =>
    api.get(BASE_PATH),

  // Add new delivery address
  create: (payload) =>
    api.post(BASE_PATH, payload),

  // Update existing address
  update: (addressId, payload) =>
    api.put(getAddressPath(addressId), payload),

  // Delete saved address
  remove: (addressId) =>
    api.delete(getAddressPath(addressId)),
};

export default addressService;
