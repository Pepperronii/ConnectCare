export interface User {
  userId: number;
  fullName: string;
  email: string;
  role: 'Customer' | 'Staff' | 'Admin';
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
}