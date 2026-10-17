export interface AuthUser {
  id: string;
  email: string;
  full_name?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  is_active?: boolean;
  created_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  full_name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  name?: string;
}

export interface AuthResponse {
  user: AuthUser;
  message?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AuthUser | null>;
  clearError: () => void;
}
