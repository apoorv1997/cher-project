// src/hooks/useMe.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "../lib/api";
import type { User } from "../lib/schemas";
import { auth } from "../lib/auth";

export function useMe(enabled: boolean = true) {
  // optionally auto-enable only if a token exists
  const shouldRun = enabled && !!auth.getAccess();
  return useQuery<User, Error>({
    queryKey: ["me"],
    queryFn: () => getCurrentUser({ bustCache: true }),
    enabled: shouldRun,
    staleTime: 60_000, // 1 minute
  });
}

// handy helpers for login/logout flows
export function useAuthCache() {
  const qc = useQueryClient();
  return {
    setMe(user: User) { qc.setQueryData(["me"], user); },
    refetchMe() { return qc.invalidateQueries({ queryKey: ["me"] }); },
    clearMe() { qc.removeQueries({ queryKey: ["me"], exact: true }); },
  };
}