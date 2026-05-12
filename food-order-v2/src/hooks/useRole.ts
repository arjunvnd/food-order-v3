import { useAuth0 } from "@auth0/auth0-react";
import { useAppSelector } from "./useAppStore";
import type { UserRole } from "../types";

export function useRole(): UserRole | null {
  return useAppSelector((s) => s.auth.role);
}

export function useIsRole(role: UserRole): boolean {
  return useAppSelector((s) => s.auth.role === role);
}

export function useAuthToken(): (() => Promise<string>) | null {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  if (!isAuthenticated) return null;
  return getAccessTokenSilently;
}
