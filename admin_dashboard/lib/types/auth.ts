export interface User {
  id: string;
  email: string;
  role: "homeowner" | "contractor" | "admin";
  full_name: string;
  phone_number?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
