import api from "./api";

export interface RoleDefinition {
  value: string;
  label: string;
  description: string;
}

export interface PlatformUser {
  id: string;
  auth0Sub: string;
  email: string;
  name: string | null;
  role: string;
  status: "PENDING" | "ACTIVE";
  createdAt: string;
}

export interface AccessRequest {
  id: string;
  auth0Sub: string;
  email: string;
  name: string | null;
  role: string;
  requestNote: string | null;
  createdAt: string;
}

export const superAdminService = {
  /** GET /api/super-admin/roles — available roles from backend config */
  getRoles(): Promise<RoleDefinition[]> {
    return api.get<RoleDefinition[]>("/super-admin/roles").then((r) => r.data);
  },

  /** GET /api/super-admin/users — all platform users */
  getUsers(): Promise<PlatformUser[]> {
    return api.get<PlatformUser[]>("/super-admin/users").then((r) => r.data);
  },

  /** PATCH /api/super-admin/users/:userId/role */
  updateUserRole(
    userId: string,
    role: string,
  ): Promise<{ id: string; email: string; name: string | null; role: string }> {
    return api
      .patch(`/super-admin/users/${userId}/role`, { role })
      .then((r) => r.data);
  },

  /** GET /api/super-admin/access-requests — users pending approval */
  getAccessRequests(): Promise<AccessRequest[]> {
    return api
      .get<AccessRequest[]>("/super-admin/access-requests")
      .then((r) => r.data);
  },

  /** PATCH /api/super-admin/access-requests/:userId/approve */
  approveRequest(userId: string): Promise<PlatformUser> {
    return api
      .patch(`/super-admin/access-requests/${userId}/approve`)
      .then((r) => r.data);
  },

  /** PATCH /api/super-admin/access-requests/:userId/reject */
  rejectRequest(userId: string): Promise<PlatformUser> {
    return api
      .patch(`/super-admin/access-requests/${userId}/reject`)
      .then((r) => r.data);
  },
};
