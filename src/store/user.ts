import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { UserInfo } from "@/types";

export const useUserStore = defineStore("user", () => {
  const token = ref<string>(localStorage.getItem("token") || "");
  const userId = ref<number | null>(null);
  const username = ref<string>(localStorage.getItem("username") || "");
  const role = ref<string>(localStorage.getItem("role") || "");

  const isLoggedIn = computed(() => !!token.value);
  const isAdmin = computed(() => role.value === "ADMIN");

  function login(newToken: string, userInfo: UserInfo) {
    token.value = newToken;
    userId.value = userInfo.userId;
    username.value = userInfo.username;
    role.value = userInfo.role;
    localStorage.setItem("token", newToken);
    localStorage.setItem("username", userInfo.username);
    localStorage.setItem("role", userInfo.role);
  }

  function logout() {
    token.value = "";
    userId.value = null;
    username.value = "";
    role.value = "";
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
  }

  return { token, userId, username, role, isLoggedIn, isAdmin, login, logout };
});
