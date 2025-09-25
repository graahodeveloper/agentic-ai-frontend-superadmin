export interface LoginFormData {
    email: string;
    password: string;
}

export interface RegistrationFormData {
    name: string;
    email: string;
    password: string;
    country: string;
    confirmPassword: string;
}

export interface AuthState {
  access: string;
  email: string;
}

export interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  country?: string;
  confirmPassword?: string;
  general?: string;
  code?: string;
}

// User data types
export interface User {
  sub_id: string | null;
  activation_code?: string | null;
  first_name: string;
  last_name?: string;
  full_name?: string;
  name?: string;
  email: string;
  mobile?: string;
  is_active: boolean;
  id: string;
  created_at?: string;
  updated_at?: string;
  country?: string;
  role?: string;
  customer_used_token?: string;
  isAdmin?: boolean; // Add this line
  // agent_access_count?: number;
  // agent_access?: number;
  // ADD inside your existing User interface
  agent_access_count?: number;
  agent_access?: {
    id: string;
    agent_details: {
      name: string;
    };
    access_type: "view" | "use" | "manage" | "full"; // enforce allowed values
  }[];

}
type AgentAccessType = "view" | "use" | "manage" | "full";

// Define the main type
export type AgentAccess = {
  id: string;
  agent?: string;
  agent_details: {
    id?: string;
    name: string;
  };
  access_type: AgentAccessType;
};
export interface UserSession {
  isLoading: boolean;
  isAuthenticated: boolean;
  sub_id: string | null;
  email: string | null;
  name: string | null;
  error: string | null;
  first_name: string | null;
  last_name: string | null;
  country: string | null;
}
