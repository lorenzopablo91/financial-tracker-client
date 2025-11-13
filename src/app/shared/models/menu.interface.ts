// src/app/models/menu.interface.ts
export interface MenuItem {
  path: string;
  label: string;
  icon: string;
  roles?: string[];
}