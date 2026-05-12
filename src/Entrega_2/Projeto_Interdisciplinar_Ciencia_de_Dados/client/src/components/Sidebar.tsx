import { Link, useLocation } from 'wouter';
import {
  BarChart3,
  Mail,
  Users,
  ShoppingCart,
  Store,
  FileText,
  Settings,
  LogOut,
  X,
} from 'lucide-react';

import { supabase } from '@/lib/supabase';

interface SidebarProps {
  onClose?: () => void;
  collapsed?: boolean;
}

const menuItems = [
  { label: 'Overview', href: '/dashboard/overview', icon: BarChart3 },
  { label: 'Campanhas', href: '/dashboard/campaigns', icon: Mail },
  { label: 'Clientes', href: '/dashboard/customers', icon: Users },
  { label: 'Pedidos', href: '/dashboard/orders', icon: ShoppingCart },
  { label: 'Lojas', href: '/dashboard/stores', icon: Store },
  { label: 'Templates', href: '/dashboard/templates', icon: FileText },
];

export default function Sidebar({ onClose, collapsed = false }: SidebarProps) {
  const [location, navigate] = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
    onClose?.();
  };

  return (
    <div className="h-full bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden">
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center shrink-0">
            <BarChart3 className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <h1 className="font-bold text-lg text-sidebar-foreground truncate">
                Cannoli
              </h1>
              <p className="text-xs text-sidebar-accent-foreground truncate">
                Dashboard
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="lg:hidden p-2 rounded-lg hover:bg-sidebar-accent"
          aria-label="Fechar menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location === item.href ||
            location.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                collapsed ? 'justify-center' : ''
              } ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-2">
        <Link
          href="/dashboard/profile"
          onClick={onClose}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent ${
            collapsed ? 'justify-center' : ''
          } ${
            location === '/dashboard/profile'
              ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary'
              : ''
          }`}
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="font-medium">Configurações</span>}
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="font-medium">Sair</span>}
        </button>
      </div>
    </div>
  );
}