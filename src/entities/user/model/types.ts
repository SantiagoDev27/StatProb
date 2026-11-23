export type UserProfile = {
  id: string;
  titleName: string;
  fullName: string;
  alias: string;
  email: string;
  institutionalEmail: string;
  initials: string;
  photoUrl?: string | null;
  syncEnvironment: string;
  cloudRegion: string;
  latencyMs: number;
};

