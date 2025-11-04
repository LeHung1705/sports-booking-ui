export interface LoginRequest {
    email: string;
    password: string;
  }
  
  export interface LoginResponse {
    access_token: string;
    user: {
      email: string;
      full_name: string;
    };
  }
  
  export interface RegisterRequest {
    full_name: string;
    email: string;
    phone?: string;
    password: string;
  }
  
  export interface RegisterResponse {
    id: string;
    email: string;
    full_name: string;
    token: string;
  }
  
  export interface ForgotPasswordRequest {
    email: string;
  }
  
  export interface ForgotPasswordResponse {
    message: string;
  }