import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/lib/api/baseQueryWithAuth';

// Agent Template interfaces
export interface AgentTemplate {
  id: string;
  agent_id: string;
  agent_category: string;
  name: string;
  description: string;
  icon: string | null;
  agent_type: string;
  agent_variant: string | null;
  website: string | null;
  user_sub_id: string | null;
  created_by: string;
  creator_name: string;
  created_by_details: {
    id: string;
    sub_id: string | null;
    full_name: string;
    email: string;
    role: string;
    is_active: boolean;
  };
  is_template: boolean;
  is_active: boolean;
  is_public: boolean;
  activations_count: number;
  active_activations_count: number;
  instances_count: number;
  active_instances_count: number;
  created_at: string;
  updated_at: string;
  agent_role: string | null | undefined;
}

export interface AgentTemplatesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AgentTemplate[];
  admin_user: {
    id: string;
    full_name: string;
    email: string;
    role: string;
    is_active: boolean;
  };
  message: string;
}

export interface TemplateAssignment {
  id: string;
  agent_template: string;
  admin_user: string;
  assigned_by: string;
  is_active: boolean;
  can_create_instances: boolean;
  can_manage_activations: boolean;
  can_assign_to_users: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
  template_details: {
    id: string;
    agent_id: string;
    name: string;
    description: string;
    agent_type: string;
    agent_variant: string;
    is_active: boolean;
    is_public: boolean;
    created_by: string;
    instances_count: number;
    active_instances_count: number;
  };
  admin_details: {
    id: string;
    sub_id: string;
    full_name: string;
    email: string;
    role: string;
    is_active: boolean;
    can_create_agent_instances: boolean;
    can_manage_agent_activations: boolean;
  };
  assigned_by_details: {
    id: string;
    sub_id: string | null;
    full_name: string;
    email: string;
    role: string;
  };
  assigned_by_name: string;
}

export interface TemplateAssignmentsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TemplateAssignment[];
  admin_user: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  };
}

export interface AgentInstance {
  id: string;
  agent_id: string;
  agent_category: string;
  template: string;
  template_details: {
    id: string;
    agent_id: string;
    name: string;
    description: string;
    agent_type: string;
    agent_variant: string;
    is_active: boolean;
    created_by: string;
  };
  name: string;
  description: string;
  icon: string | null;
  agent_type: string;
  agent_variant: string;
  website: string | null;
  user_sub_id: string;
  created_by: string;
  instance_created_by: string;
  creator_name: string;
  instance_creator_details: {
    id: string;
    sub_id: string;
    full_name: string;
    email: string;
    role: string;
    is_active: boolean;
  };
  is_instance: boolean;
  is_active: boolean;
  is_public: boolean;

  template_config: {
    name: string;
    description: string;
    icon: string | null;
    agent_type: string;
    agent_variant: string;
    website: string | null;
  };

  instance_config: {
    created_by_admin: string;
    template_source: string;
    created_at: string;
    context: string;
    agent_roles: string;
    language: string;
    tone: string;
    last_updated: string;
    updated_by: string;
  };

  effective_config: {
    name: string;
    description: string;
    icon: string | null;
    agent_type: string;
    agent_variant: string;
    website: string | null;
    created_by_admin: string;
    template_source: string;
    created_at: string;
    context: string;
    agent_roles: string;
    language: string;
    tone: string;
    last_updated: string;
    updated_by: string;
  };

  activations_count: number;
  active_activations_count: number;
  created_at: string;
  updated_at: string;

  activations: Array<{
    id: string;
    user: {
      id: string;
      sub_id: string;
      full_name: string;
      email: string;
      role: string;
      is_active: boolean;
      activation_code?: string | null;
      country?: string;
      customer_used_token?: number;
      password_set?: boolean;
      agent_roles?: string;
      context?: string;
    };
    status: boolean;
    context: string | null;
    agent_roles: string | null;
    activation_config: {
      [key: string]: string | number | boolean;
    } | null;
    activated_by: {
      id: string;
      full_name: string;
      email: string;
      role: string;
    };
    created_at: string;
    updated_at: string;
  }>;

  activations_summary: {
    total_count: number;
    active_count: number;
    inactive_count: number;
    has_activations: boolean;
  };
}

export interface AgentInstancesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AgentInstance[];
  admin_user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  summary: {
    total_instances: number;
    active_instances: number;
    inactive_instances: number;
    instances_with_activations: number;
  };
}

export interface CreateAgentTemplateRequest {
  name: string;
  description: string;
  agent_type: string;
  agent_role: string;
  agent_variant?: string;
  website?: string;
  is_active: boolean;
  is_public: boolean;
}

export interface CreateAgentTemplateResponse {
  message: string;
  template: {
    id: string;
    agent_id: string;
    agent_category: string;
    name: string;
    description: string;
    icon: string | null;
    agent_type: string;
    agent_variant: string | null;
    agent_role?: string;
    website: string | null;
    user_sub_id: string | null;
    created_by: string;
    creator_name: string;
    created_by_details: {
      id: string;
      sub_id: string | null;
      full_name: string;
      email: string;
      role: string;
      is_active: boolean;
    };
    is_template: boolean;
    is_active: boolean;
    is_public: boolean;
    additional_info?: Record<string, unknown>;
    activations_count: number;
    active_activations_count: number;
    instances_count: number;
    active_instances_count: number;
    created_at: string;
    updated_at: string;
  };
  creator: {
    id: string;
    full_name: string;
    role: string;
  };
}

export interface UpdateAgentTemplateRequest {
  name?: string;
  description?: string;
  agent_type?: string;
  agent_role?: string;
  agent_variant?: string;
  website?: string;
  is_active?: boolean;
  is_public?: boolean;
}

export interface AssignAdminToTemplateRequest {
  agent_template: string;
  admin_user: string;
  can_create_instances: boolean;
  can_manage_activations: boolean;
  can_modify_instances: boolean;
  expires_at?: string;
  notes?: string;
}

export interface AssignAdminToTemplateResponse {
  id: string;
  agent_template: string;
  admin_user: string;
  can_create_instances: boolean;
  can_manage_activations: boolean;
  can_modify_instances: boolean;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  message?: string;
}

export interface CreateActivationRequest {
  user_id: string;
  agent_id: string;
  status: boolean;
}

export interface CreateActivationResponse {
  message: string;
  action: string;
  created: boolean;
  activation: {
    id: string;
    user_id: string;
    agent_id: string;
    activated_by: string;
    status: boolean;
    context: string;
    agent_roles: string;
    activation_config: {
      [key: string]: string | number | boolean;
    } | null;
    user_details: {
      id: string;
      sub_id: string;
      full_name: string;
      email: string;
      role: string;
      is_active: boolean;
    };
    agent_details: {
      id: string;
      agent_id: string;
      name: string;
      description: string;
      agent_category: string;
      is_template: boolean;
      is_instance: boolean;
      is_active: boolean;
      is_public: boolean;
      creator_name: string;
      template_id: string;
      template_name: string;
      instance_creator: string;
    };
    activated_by_details: {
      id: string;
      sub_id: string;
      full_name: string;
      email: string;
      role: string;
      is_active: boolean;
    };
    effective_agent_config: {
      name: string;
      description: string;
      icon: string | null;
      agent_type: string;
      agent_variant: string;
      website: string | null;
      created_by_admin: string;
      template_source: string;
      created_at: string;
      context: string;
      agent_roles: string;
      language: string;
      tone: string;
      last_updated: string;
      updated_by: string;
    };
    created_at: string;
    updated_at: string;
  };
  activated_by: {
    id: string;
    full_name: string;
    role: string;
  };
}

export interface UpdateAgentInstanceConfigRequest {
  context: string;
  agent_roles: string;
}

export interface UpdateAgentInstanceConfigResponse {
  message: string;
  instance: {
    id: string;
    agent_id: string;
    agent_category: string;
    template: string;
    template_details: {
      id: string;
      agent_id: string;
      name: string;
      description: string;
      agent_type: string;
      agent_variant: string;
      is_active: boolean;
      created_by: string;
    };
    name: string;
    description: string;
    icon: string | null;
    agent_type: string;
    agent_variant: string;
    website: string | null;
    user_sub_id: string;
    created_by: string;
    instance_created_by: string;
    creator_name: string;
    instance_creator_details: {
      id: string;
      sub_id: string;
      full_name: string;
      email: string;
      role: string;
      is_active: boolean;
    };
    is_instance: boolean;
    is_active: boolean;
    is_public: boolean;
    template_config: {
      name: string;
      description: string;
      icon: string | null;
      agent_type: string;
      agent_variant: string;
      website: string | null;
    };
    instance_config: {
      created_by_admin: string;
      template_source: string;
      created_at: string;
      context: string;
      agent_roles: string;
      language: string;
      tone: string;
      last_updated: string;
      updated_by: string;
    };
    effective_config: {
      name: string;
      description: string;
      icon: string | null;
      agent_type: string;
      agent_variant: string;
      website: string | null;
      created_by_admin: string;
      template_source: string;
      created_at: string;
      context: string;
      agent_roles: string;
      language: string;
      tone: string;
      last_updated: string;
      updated_by: string;
    };
    activations_count: number;
    active_activations_count: number;
    created_at: string;
    updated_at: string;
  };
}

export interface APIError {
  data?: {
    name?: string[];
    detail?: string;
  };
  message?: string;
}

// Workspace interfaces
export interface WorkspaceCreatedBy {
  id: string;
  email: string;
  full_name: string;
}

export interface Workspace {
  id: string;
  name: string;
  domain: string;
  created_by: string;
  created_by_details: WorkspaceCreatedBy;
  members_count: number;
  created_at: string;
  updated_at: string;
}

export interface WorkspacesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Workspace[];
}

// ─── NEW: Delete workspace response ───────────────────────────────────────────
export interface DeleteWorkspaceResponse {
  message: string;
  deleted_workspace: {
    id: string;
    name: string;
    domain: string;
    members_count: number;
    created_at: string;
  };
}

export interface CreateAgentInstanceRequest {
  template_id: string;
  name: string;
  user_sub_id: string;
  is_active: boolean;
}

export interface CreateAgentInstanceResponse {
  message: string;
  instance: AgentInstance;
  created_by: {
    id: string;
    full_name: string;
    role: string;
  };
  template_assignment: {
    template_name: string;
    assignment_valid: boolean;
  };
}

export interface AgentInstanceAPIError {
  name?: string[];
  detail?: string;
}

export interface TemplateInstance {
  id: string;
  agent_id: string;
  name: string;
  user_sub_id: string;
  instance_creator_name: string;
  is_active: boolean;
  is_public: boolean;
  activations_count: number;
  active_activations_count: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateInstancesResponse {
  template: {
    id: string;
    name: string;
    agent_id: string;
  };
  instances_count: number;
  active_instances_count: number;
  instances: TemplateInstance[];
}

// Template Field interfaces
export interface FieldChoice {
  value: string;
  label: string;
}

export interface TemplateField {
  id?: string;
  field_name: string;
  field_label: string;
  field_type: 'text' | 'textarea' | 'email' | 'url' | 'number' | 'select' | 'multiselect' | 'radio' | 'checkbox' | 'date' | 'datetime' | 'file' | 'password';
  is_required?: boolean;
  is_sensitive?: boolean;
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  default_value?: string;
  placeholder?: string;
  help_text?: string;
  choices?: FieldChoice[];
  display_order: number;
  field_group?: string;
}

export interface BulkCreateFieldsRequest {
  agent_template: string;
  fields: TemplateField[];
}

export interface BulkCreateFieldsResponse {
  message: string;
  created_count: number;
  errors_count: number;
  template: {
    id: string;
    name: string;
  };
  created_fields: Array<{
    id: string;
    field_name: string;
    field_label: string;
    display_order: number;
  }>;
  errors?: Array<{
    index: number;
    field_name: string;
    error: string;
  }>;
}

export interface GetTemplateFieldsResponse {
  template: {
    id: string;
    name: string;
    agent_id: string;
  };
  fields_count: number;
  fields: Array<{
    id: string;
    agent_template: string;
    field_name: string;
    field_label: string;
    field_type: string;
    is_required: boolean;
    is_sensitive: boolean;
    min_length: number | null;
    max_length: number | null;
    min_value: number | null;
    max_value: number | null;
    default_value: string;
    placeholder: string;
    help_text: string;
    choices: FieldChoice[];
    display_order: number;
    field_group: string;
    created_at: string;
    updated_at: string;
  }>;
}

export interface UpdateTemplateFieldRequest {
  field_name?: string;
  field_label?: string;
  field_type?: 'text' | 'textarea' | 'email' | 'url' | 'number' | 'select' | 'multiselect' | 'radio' | 'checkbox' | 'date' | 'datetime' | 'file' | 'password';
  is_required?: boolean;
  is_sensitive?: boolean;
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  default_value?: string;
  placeholder?: string;
  help_text?: string;
  choices?: FieldChoice[];
  display_order?: number;
  field_group?: string;
}

export interface UpdateTemplateFieldResponse {
  message: string;
  field: {
    id: string;
    agent_template: string;
    field_name: string;
    field_label: string;
    field_type: string;
    is_required: boolean;
    is_sensitive: boolean;
    min_length: number | null;
    max_length: number | null;
    min_value: number | null;
    max_value: number | null;
    default_value: string;
    placeholder: string;
    help_text: string;
    choices: FieldChoice[];
    display_order: number;
    field_group: string;
    created_at: string;
    updated_at: string;
  };
}

export interface AgentTemplatesQueryParams {
  admin_id: string;
  page?: number;
}

export const agentTemplateApi = createApi({
  reducerPath: 'agentTemplateApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['AgentTemplate', 'AdminAssignment', 'TemplateAssignment', 'AgentInstance', 'Activation', 'Workspace', 'TemplateField'],
  endpoints: (builder) => ({

    // ─── Workspace endpoints ───────────────────────────────────────────────────

    getWorkspaces: builder.query<WorkspacesResponse, { page?: number }>({
      query: ({ page = 1 }) => ({
        url: `workspaces/?page=${page}`,
        method: 'GET',
      }),
      providesTags: ['Workspace'],
      transformResponse: (response: unknown) => {
        if (
          typeof response === 'object' &&
          response !== null &&
          'results' in response
        ) {
          return response as WorkspacesResponse;
        }
        throw new Error('Invalid response format');
      },
    }),

    // DELETE /api/v1/workspaces/<uuid>/
    // Pass force=true to delete even when workspace has members
    deleteWorkspace: builder.mutation<DeleteWorkspaceResponse, { id: string; force?: boolean }>({
      query: ({ id, force = false }) => ({
        url: `workspaces/${id}/${force ? '?force=true' : ''}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Workspace'],
      transformResponse: (response: unknown) => {
        // Backend returns { message, deleted_workspace } on success
        if (
          typeof response === 'object' &&
          response !== null &&
          'message' in response
        ) {
          return response as DeleteWorkspaceResponse;
        }
        // Handle 204 No Content (default ModelViewSet destroy — no custom override yet)
        return { message: 'Workspace deleted successfully', deleted_workspace: { id: '', name: '', domain: '', members_count: 0, created_at: '' } };
      },
      transformErrorResponse: (response: unknown) => {
        if (
          typeof response === 'object' &&
          response !== null &&
          'data' in response &&
          typeof (response as { data: unknown }).data === 'object'
        ) {
          return (response as { data: APIError }).data;
        }
        return { detail: 'Failed to delete workspace' };
      },
    }),

    // ─── Other endpoints (unchanged) ──────────────────────────────────────────

    getTemplateInstances: builder.query<TemplateInstancesResponse, { templateId: string; admin_id: string }>({
      query: ({ templateId, admin_id }) => ({
        url: `agent-templates/${templateId}/instances/?admin_id=${encodeURIComponent(admin_id)}`,
        method: 'GET',
      }),
      providesTags: (result, error, { templateId }) => [
        { type: 'AgentInstance', id: templateId },
        'AgentInstance'
      ],
      transformResponse: (response: unknown) => {
        if (
          typeof response === 'object' &&
          response !== null &&
          'template' in response &&
          'instances' in response
        ) {
          return response as TemplateInstancesResponse;
        }
        throw new Error('Invalid response format');
      },
    }),

    upsertActivation: builder.mutation<
      CreateActivationResponse,
      { admin_sub_id: string; data: CreateActivationRequest }
    >({
      query: ({ admin_sub_id, data }) => ({
        url: `activations/upsert/?admin_sub_id=${encodeURIComponent(admin_sub_id)}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Activation', 'AgentInstance'],
      transformResponse: (response: unknown) => {
        if (
          typeof response === 'object' &&
          response !== null &&
          'message' in response &&
          'activation' in response
        ) {
          return response as CreateActivationResponse;
        }
        throw new Error('Invalid activation response format');
      },
      transformErrorResponse: (response: unknown) => {
        if (
          typeof response === 'object' &&
          response !== null &&
          'data' in response &&
          typeof (response as { data: unknown }).data === 'object'
        ) {
          return (response as { data: APIError }).data;
        }
        return { detail: 'An unexpected error occurred during activation upsert' };
      },
    }),

    createActivation: builder.mutation<
      CreateActivationResponse,
      { admin_sub_id: string; data: CreateActivationRequest }
    >({
      query: ({ admin_sub_id, data }) => ({
        url: `activations/?admin_sub_id=${encodeURIComponent(admin_sub_id)}`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Activation', 'AgentInstance'],
      transformResponse: (response: unknown) => {
        if (
          typeof response === 'object' &&
          response !== null &&
          'message' in response &&
          'activation' in response
        ) {
          return response as CreateActivationResponse;
        }
        throw new Error('Invalid activation response format');
      },
      transformErrorResponse: (response: unknown) => {
        if (
          typeof response === 'object' &&
          response !== null &&
          'data' in response &&
          typeof (response as { data: unknown }).data === 'object'
        ) {
          return (response as { data: APIError }).data;
        }
        return { detail: 'An unexpected error occurred during activation' };
      },
    }),

    updateAgentInstanceConfig: builder.mutation<
      UpdateAgentInstanceConfigResponse,
      { id: string; admin_sub_id: string; data: UpdateAgentInstanceConfigRequest }
    >({
      query: ({ id, admin_sub_id, data }) => ({
        url: `agent-instances/${id}/update-config/?admin_sub_id=${encodeURIComponent(admin_sub_id)}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['AgentInstance'],
      transformResponse: (response: unknown) => {
        if (
          typeof response === 'object' &&
          response !== null &&
          'message' in response &&
          'instance' in response
        ) {
          return response as UpdateAgentInstanceConfigResponse;
        }
        throw new Error('Invalid agent instance config update response format');
      },
      transformErrorResponse: (response: unknown) => {
        if (
          typeof response === 'object' &&
          response !== null &&
          'data' in response &&
          typeof (response as { data: unknown }).data === 'object'
        ) {
          return (response as { data: APIError }).data;
        }
        return { detail: 'An unexpected error occurred during agent configuration update' };
      },
    }),

    createAgentInstance: builder.mutation<
      CreateAgentInstanceResponse,
      { admin_sub_id: string; data: CreateAgentInstanceRequest }
    >({
      query: ({ admin_sub_id, data }) => ({
        url: `agent-instances/?admin_sub_id=${encodeURIComponent(admin_sub_id)}`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['AgentInstance', 'TemplateAssignment'],
      transformResponse: (response: unknown) => {
        if (
          typeof response === 'object' &&
          response !== null &&
          'message' in response &&
          'instance' in response
        ) {
          return response as CreateAgentInstanceResponse;
        }
        throw new Error('Invalid response format');
      },
      transformErrorResponse: (response: unknown) => {
        if (
          typeof response === 'object' &&
          response !== null &&
          'data' in response &&
          typeof (response as { data: unknown }).data === 'object'
        ) {
          return (response as { data: AgentInstanceAPIError }).data;
        }
        return { detail: 'An unexpected error occurred' };
      },
    }),

    getAgentInstancesByAdminId: builder.query<AgentInstancesResponse, string>({
      query: (admin_sub_id) => ({
        url: `agent-instances/?admin_sub_id=${encodeURIComponent(admin_sub_id)}&include_activations=true`,
        method: 'GET',
      }),
      providesTags: (result, error, admin_sub_id) => [
        { type: 'AgentInstance', id: admin_sub_id },
        'AgentInstance',
        'Activation'
      ],
      transformResponse: (response: unknown) => {
        if (
          typeof response === 'object' &&
          response !== null &&
          'results' in response
        ) {
          return response as AgentInstancesResponse;
        }
        throw new Error('Invalid response format');
      },
    }),

    getAgentTemplatesByAdminId: builder.query<AgentTemplatesResponse, string>({
      query: (admin_id) => ({
        url: `agent-templates/?admin_id=${encodeURIComponent(admin_id)}`,
        method: 'GET',
      }),
      providesTags: (result, error, admin_id) => [
        { type: 'AgentTemplate', id: admin_id },
        'AgentTemplate'
      ],
      transformResponse: (response: unknown) => {
        if (
          typeof response === 'object' &&
          response !== null &&
          'results' in response
        ) {
          return response as AgentTemplatesResponse;
        }
        throw new Error('Invalid response format');
      },
    }),

    getTemplateAssignmentsByAdminId: builder.query<TemplateAssignmentsResponse, string>({
      query: (admin_id) => ({
        url: `template-assignments/by-admin/?admin_id=${encodeURIComponent(admin_id)}`,
        method: 'GET',
      }),
      providesTags: (result, error, admin_id) => [
        { type: 'TemplateAssignment', id: admin_id },
        'TemplateAssignment'
      ],
      transformResponse: (response: unknown) => {
        if (
          typeof response === 'object' &&
          response !== null &&
          'results' in response
        ) {
          return response as TemplateAssignmentsResponse;
        }
        throw new Error('Invalid response format');
      },
    }),

    getAgentTemplateById: builder.query<AgentTemplate, { id: string; admin_id: string }>({
      query: ({ id, admin_id }) => ({
        url: `agent-templates/${id}/?admin_id=${encodeURIComponent(admin_id)}`,
        method: 'GET',
      }),
      providesTags: (result) => result ? [{ type: 'AgentTemplate', id: result.id }] : [],
      transformResponse: (response: unknown) => {
        if (
          typeof response === 'object' &&
          response !== null &&
          'id' in response
        ) {
          return response as AgentTemplate;
        }
        throw new Error('Invalid response format');
      },
    }),

    createAgentTemplate: builder.mutation<CreateAgentTemplateResponse, { admin_id: string; data: CreateAgentTemplateRequest }>({
      query: ({ admin_id, data }) => ({
        url: `agent-templates/?admin_id=${encodeURIComponent(admin_id)}`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['AgentTemplate'],
      transformResponse: (response: unknown): CreateAgentTemplateResponse => {
        if (
          typeof response === 'object' &&
          response !== null &&
          'message' in response &&
          'template' in response &&
          'created_by' in response
        ) {
          const apiResponse = response as {
            message: string;
            template: {
              id: string;
              agent_id: string;
              agent_category: string;
              name: string;
              description: string;
              icon: string | null;
              agent_type: string;
              agent_variant: string | null;
              agent_role: string;
              website: string | null;
              user_sub_id: string | null;
              created_by: string;
              creator_name: string;
              created_by_details: {
                id: string;
                sub_id: string | null;
                full_name: string;
                email: string;
                role: string;
                is_active: boolean;
              };
              is_template: boolean;
              is_active: boolean;
              is_public: boolean;
              additional_info: Record<string, unknown>;
              activations_count: number;
              active_activations_count: number;
              instances_count: number;
              active_instances_count: number;
              created_at: string;
              updated_at: string;
            };
            created_by: {
              id: string;
              full_name: string;
              role: string;
            };
          };

          return {
            message: apiResponse.message,
            template: {
              id: apiResponse.template.id,
              agent_id: apiResponse.template.agent_id,
              agent_category: apiResponse.template.agent_category,
              name: apiResponse.template.name,
              description: apiResponse.template.description,
              icon: apiResponse.template.icon,
              agent_type: apiResponse.template.agent_type,
              agent_variant: apiResponse.template.agent_variant,
              website: apiResponse.template.website,
              user_sub_id: apiResponse.template.user_sub_id,
              created_by: apiResponse.template.created_by,
              creator_name: apiResponse.template.creator_name,
              created_by_details: apiResponse.template.created_by_details,
              is_template: apiResponse.template.is_template,
              is_active: apiResponse.template.is_active,
              is_public: apiResponse.template.is_public,
              activations_count: apiResponse.template.activations_count,
              active_activations_count: apiResponse.template.active_activations_count,
              instances_count: apiResponse.template.instances_count,
              active_instances_count: apiResponse.template.active_instances_count,
              created_at: apiResponse.template.created_at,
              updated_at: apiResponse.template.updated_at,
            },
            creator: apiResponse.created_by,
          };
        }

        throw new Error('Invalid response format received from template creation API');
      },
    }),

    updateAgentTemplate: builder.mutation<CreateAgentTemplateResponse, { id: string; admin_id: string; data: UpdateAgentTemplateRequest }>({
      query: ({ id, admin_id, data }) => ({
        url: `agent-templates/${id}/?admin_id=${encodeURIComponent(admin_id)}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { admin_id }) => [
        { type: 'AgentTemplate', id: admin_id },
        'AgentTemplate'
      ],
      transformResponse: (response: unknown): CreateAgentTemplateResponse => {
        if (
          typeof response === 'object' &&
          response !== null &&
          'id' in response &&
          'agent_id' in response
        ) {
          const r = response as { id: string; agent_id: string };

          return {
            message: 'Template updated successfully',
            template: {
              id: r.id,
              agent_id: r.agent_id,
              agent_category: '',
              name: '',
              description: '',
              icon: null,
              agent_type: '',
              agent_variant: null,
              website: null,
              user_sub_id: null,
              created_by: '',
              creator_name: '',
              created_by_details: {
                id: '',
                sub_id: null,
                full_name: '',
                email: '',
                role: '',
                is_active: false,
              },
              is_template: false,
              is_active: false,
              is_public: false,
              activations_count: 0,
              active_activations_count: 0,
              instances_count: 0,
              active_instances_count: 0,
              created_at: '',
              updated_at: '',
            },
            creator: {
              id: '',
              full_name: '',
              role: '',
            },
          };
        }

        throw new Error('Invalid response format');
      },
    }),

    deleteAgentTemplate: builder.mutation<{ message: string }, { id: string; admin_id: string }>({
      query: ({ id, admin_id }) => ({
        url: `agent-templates/${id}/?admin_id=${encodeURIComponent(admin_id)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { admin_id }) => [
        { type: 'AgentTemplate', id: admin_id },
        'AgentTemplate'
      ],
    }),

    assignAdminToTemplate: builder.mutation<AssignAdminToTemplateResponse, { admin_id: string; data: AssignAdminToTemplateRequest }>({
      query: ({ admin_id, data }) => ({
        url: `template-assignments/?admin_id=${encodeURIComponent(admin_id)}`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['AdminAssignment', 'AgentTemplate'],
      transformResponse: (response: unknown) => {
        if (
          typeof response === 'object' &&
          response !== null
        ) {
          return response as AssignAdminToTemplateResponse;
        }
        throw new Error('Invalid response format');
      },
    }),

    bulkCreateTemplateFields: builder.mutation<BulkCreateFieldsResponse, { admin_id: string; data: BulkCreateFieldsRequest }>({
      query: ({ admin_id, data }) => ({
        url: `template-fields/bulk-create/?admin_id=${encodeURIComponent(admin_id)}`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['TemplateField', 'AgentTemplate'],
      transformResponse: (response: unknown) => {
        if (
          typeof response === 'object' &&
          response !== null &&
          'message' in response &&
          'created_count' in response
        ) {
          return response as BulkCreateFieldsResponse;
        }
        throw new Error('Invalid response format');
      },
      transformErrorResponse: (response: unknown) => {
        if (
          typeof response === 'object' &&
          response !== null &&
          'data' in response &&
          typeof (response as { data: unknown }).data === 'object'
        ) {
          return (response as { data: APIError }).data;
        }
        return { detail: 'An unexpected error occurred during bulk field creation' };
      },
    }),

    getTemplateFieldsByTemplateId: builder.query<GetTemplateFieldsResponse, { template_id: string; admin_id: string }>({
      query: ({ template_id, admin_id }) => ({
        url: `template-fields/by-template/?template_id=${encodeURIComponent(template_id)}&admin_id=${encodeURIComponent(admin_id)}`,
        method: 'GET',
      }),
      providesTags: (result, error, { template_id }) => [
        { type: 'TemplateField', id: template_id },
        'TemplateField'
      ],
      transformResponse: (response: unknown) => {
        if (
          typeof response === 'object' &&
          response !== null &&
          'template' in response &&
          'fields' in response
        ) {
          return response as GetTemplateFieldsResponse;
        }
        throw new Error('Invalid response format');
      },
    }),

    updateTemplateField: builder.mutation<UpdateTemplateFieldResponse, { field_id: string; admin_id: string; data: UpdateTemplateFieldRequest }>({
      query: ({ field_id, admin_id, data }) => ({
        url: `template-fields/${field_id}/?admin_id=${encodeURIComponent(admin_id)}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { field_id }) => [
        { type: 'TemplateField', id: field_id },
        'TemplateField'
      ],
      transformResponse: (response: unknown) => {
        if (
          typeof response === 'object' &&
          response !== null &&
          'message' in response &&
          'field' in response
        ) {
          return response as UpdateTemplateFieldResponse;
        }
        throw new Error('Invalid response format');
      },
      transformErrorResponse: (response: unknown) => {
        if (
          typeof response === 'object' &&
          response !== null &&
          'data' in response &&
          typeof (response as { data: unknown }).data === 'object'
        ) {
          return (response as { data: APIError }).data;
        }
        return { detail: 'An unexpected error occurred during field update' };
      },
    }),
  }),
});

export const {
  useGetWorkspacesQuery,
  useDeleteWorkspaceMutation,           // ← NEW
  useGetTemplateInstancesQuery,
  useCreateActivationMutation,
  useUpsertActivationMutation,
  useUpdateAgentInstanceConfigMutation,
  useCreateAgentInstanceMutation,
  useGetAgentTemplatesByAdminIdQuery,
  useGetTemplateAssignmentsByAdminIdQuery,
  useGetAgentInstancesByAdminIdQuery,
  useGetAgentTemplateByIdQuery,
  useCreateAgentTemplateMutation,
  useUpdateAgentTemplateMutation,
  useDeleteAgentTemplateMutation,
  useAssignAdminToTemplateMutation,
  useBulkCreateTemplateFieldsMutation,
  useGetTemplateFieldsByTemplateIdQuery,
  useUpdateTemplateFieldMutation,
} = agentTemplateApi;

export const getAdminIdFromStorage = (): string | null => {
  try {
    const superAdminUser = localStorage.getItem('superAdminUser');
    if (superAdminUser) {
      const adminData = JSON.parse(superAdminUser);
      return adminData.id || null;
    }
    return null;
  } catch (error) {
    console.error('Error parsing superAdminUser from localStorage:', error);
    return null;
  }
};