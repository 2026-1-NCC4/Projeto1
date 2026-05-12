import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Menu,
  Bell,
  User,
  ChevronDown,
  UserCircle,
  LogOut,
} from 'lucide-react';

import { supabase } from '@/lib/supabase';

interface HeaderProps {
  onMenuClick?: () => void;
  onSidebarToggle?: () => void;
  sidebarOpen?: boolean;
}

interface UserProfile {
  name: string;
  email: string;
  role?: string;
}

export default function Header({
  onMenuClick,
  onSidebarToggle,
}: HeaderProps) {
  const [, navigate] = useLocation();

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) return;

      const authUser = session.user;

      const { data } = await supabase
        .from('users')
        .select('name, email, role')
        .eq('auth_user_id', authUser.id)
        .single();

      if (data) {
        setUser(data);
      } else {
        setUser({
          name:
            authUser.user_metadata?.name ||
            authUser.email?.split('@')[0] ||
            'Usuário',
          email: authUser.email || '',
        });
      }
    }

    loadUser();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  const initials =
    user?.name
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'U';

  return (
    <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border h-16 flex items-center justify-between px-4 sm:px-5 lg:px-8">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onSidebarToggle}
          className="hidden lg:inline-flex p-2 hover:bg-secondary rounded-lg transition-colors"
          aria-label="Alternar sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h2 className="text-base sm:text-lg font-semibold text-foreground truncate">
          Dashboard
        </h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div
          ref={dropdownRef}
          className="relative flex items-center gap-2 sm:gap-3 sm:pl-4 sm:border-l border-border"
        >
          <div className="hidden md:block text-right">
            <p className="text-sm font-medium text-foreground">
              {user?.name || 'Carregando...'}
            </p>

            <p className="text-xs text-muted-foreground">
              {user?.email || ''}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1.5 sm:p-2 hover:bg-secondary rounded-lg transition-colors"
            aria-label="Abrir menu do usuário"
          >
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shrink-0 text-xs font-semibold text-primary-foreground">
              {initials}
            </div>

            <motion.div
              animate={{ rotate: dropdownOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="hidden sm:block"
            >
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-xl border border-border bg-card shadow-xl shadow-primary/10"
              >
                <div className="border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {user?.name || 'Usuário'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email || ''}
                  </p>
                  {user?.role && (
                    <span className="mt-2 inline-flex rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      {user.role}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/profile');
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-foreground transition hover:bg-secondary"
                >
                  <UserCircle className="h-4 w-4 text-primary" />
                  Ver meu perfil
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-sm text-destructive transition hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}