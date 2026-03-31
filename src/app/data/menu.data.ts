import { MenuItem } from '../shared/models/menu.interface';

export const MENU_ITEMS: MenuItem[] = [
  {
    path: '/dashboard',
    label: 'PANEL DE CONTROL',
    icon: 'dashboard',
    roles: ['ADMIN', 'VIEWER']
  },
  {
    path: '/balance',
    label: 'BALANCE',
    icon: 'account_balance',
    roles: ['ADMIN']
  },
  {
    path: '/portfolio',
    label: 'PORTAFOLIO',
    icon: 'wallet',
    roles: ['ADMIN', 'VIEWER']
  }
];
