import type { LoginRequest, LoginResponse, User } from "../types/auth";
import { apiClient } from "./api";

export async function login(credentials: LoginRequest) {
  const response = await apiClient.post<LoginResponse>(
    "/auth/login",
    credentials
  );

  if (response.data) {
    apiClient.setToken(response.data.token);
    return response.data;
  }

  throw new Error(response.error?.message || "Login failed");
}

export function logout() {
  apiClient.setToken(null);
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const response = await apiClient.get<User>("/user/me");
  return response.data || null;
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("auth_token");
}
