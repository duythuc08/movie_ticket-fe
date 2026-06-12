export const AUTH_ROUTES = {
  LOGIN: "/login",
  SIGNUP: "/signup",
  VERIFY_EMAIL: "/verify-email",
  FORGOT_PASSWORD: "/login/forgot-password",
  HOME: "/",
} as const;

export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: "Sai tên đăng nhập hoặc mật khẩu!",
  ACCOUNT_NOT_ENABLED: "Tài khoản chưa được xác minh. Vui lòng kiểm tra email.",
  REGISTER_FAILED: "Đăng ký thất bại. Vui lòng thử lại.",
  OTP_INVALID: "Mã OTP không hợp lệ hoặc đã hết hạn.",
  FORGOT_PASSWORD_FAILED: "Không tìm thấy tài khoản với email này.",
  RESET_PASSWORD_FAILED: "Đặt lại mật khẩu thất bại. Vui lòng thử lại.",
  SERVER_ERROR: "Lỗi máy chủ. Vui lòng thử lại sau.",
} as const;

export const AUTH_TOKEN_KEY = "token";
export const REFRESH_TOKEN_KEY = "refreshToken";

export const OTP_RESEND_COOLDOWN = 30;
