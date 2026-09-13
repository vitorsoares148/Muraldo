import type { UserInfoResponse } from "../types/user";
import api from "./axios";

export async function getUserInfo(): Promise<UserInfoResponse> {
  const response = await api.get<UserInfoResponse>(`/api/user/info`);

  return response.data;
}
