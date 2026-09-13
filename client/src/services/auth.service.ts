import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
} from "../api/auth.api";

export function login(username: string, password: string) {
  return apiLogin(username, password);
}

export function register(
  username: string,
  email: string,
  password: string,
) {
  return apiRegister(username, email, password);
}

export function logout() {
  return apiLogout();
}
