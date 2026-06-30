export type Plan = "Starter" | "Creator" | "Studio";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  initials: string;
  plan: Plan;
};

export type AuthState = {
  user: AuthUser | null;
  isLoaded: boolean;
  signOut: () => void;
};
