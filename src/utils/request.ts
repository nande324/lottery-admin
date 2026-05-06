import axios from "axios";
import { MessagePlugin } from "tdesign-vue-next";

const request = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

request.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (data.code && data.code !== 200) {
      MessagePlugin.error(data.message || "请求失败");
      return Promise.reject(new Error(data.message));
    }
    return response;
  },
  (error) => {
    if (error.code === "ECONNABORTED") {
      MessagePlugin.error("请求超时，请检查网络后重试");
    } else if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/admin/";
        MessagePlugin.warning("登录已过期，请重新登录");
      } else if (status === 403) {
        MessagePlugin.error("无权限访问该资源");
      } else if (status === 500) {
        MessagePlugin.error("服务器内部错误，请稍后重试");
      } else {
        MessagePlugin.error(error.response.data?.message || "请求失败");
      }
    } else {
      MessagePlugin.error("网络连接失败");
    }
    return Promise.reject(error);
  },
);

export default request;
