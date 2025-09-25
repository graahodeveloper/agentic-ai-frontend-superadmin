export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  is_active: boolean;
  activations_count: number;
  active_activations_count: number;
  created_at: string;
  updated_at: string;
  activation_data?: ActivationData; // Add ? to make it optional
}

export interface AgentUser {
  id: string;
  sub_id: string;
  activation_code: string | null;
  full_name: string;
  email: string;
  is_active: boolean;
}

export interface ActivationData {
  id: string;
  user: AgentUser;
  status: boolean;
  context?: string;
  agent_roles?: string;
  created_at: string;
  updated_at: string;
}