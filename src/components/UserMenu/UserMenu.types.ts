import type { MeDto } from "@/lib/api-types";

export interface UserMenuProps {
  me: MeDto;
  onLogout: () => void;
}
