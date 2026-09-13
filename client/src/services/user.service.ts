import { getUserInfo as apiUserInfo } from "../api/user.api";

export function userInfo() {
  return apiUserInfo();
}
