import request from "@/utils/request";

export const authApi = {
  login: (data: { username: string; password: string }) =>
    request.post("/auth/login", data),
  register: (data: {
    username: string;
    password: string;
    confirmPassword: string;
  }) => request.post("/auth/register", data),
  logout: () => request.post("/auth/logout"),
  changePassword: (data: {
    oldPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) => request.put("/auth/password", data),
};
