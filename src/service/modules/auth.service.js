
import api from "../core/api";

const authService = {
  // Customer registration
  signup: (payload) =>
    api.post("/customers/signup", payload),

  // Verify email
  verifyEmail: (payload) =>
    api.post("/customers/email/verify", payload),

  // Resend verification code
  resendVerification: (payload) =>
    api.post("/customers/email/verification/resend", payload),

  // Customer login
  login: (payload) =>
    api.post("/customers/login", payload),

  // Customer logout
  logout: () =>
    api.post("/customers/logout", {}),

  // Forgot password
  forgotPassword: (payload) =>
    api.post("/customers/password/forgot", payload),

  // Reset password
  resetPassword: (payload) =>
    api.post("/customers/password/reset", payload),
};

export default authService;
