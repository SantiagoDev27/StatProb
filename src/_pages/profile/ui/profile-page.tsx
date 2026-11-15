import type { Metadata } from "next";
import { ProfileSettings } from "@/widgets/profile-settings";

export const metadata: Metadata = {
  title: "Personalizar Perfil",
};

export function ProfilePage() {
  return <ProfileSettings />;
}

