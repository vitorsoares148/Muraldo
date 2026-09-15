import api from "./axios";

export async function getUserInfo() {
  const response = await api.get(`/api/user/info`);

  return response.data;
}
