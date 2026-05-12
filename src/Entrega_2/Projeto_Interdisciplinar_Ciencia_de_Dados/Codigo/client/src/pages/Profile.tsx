import { useEffect, useMemo, useState } from 'react';
import {
  User,
  Mail,
  Building2,
  ShieldCheck,
  CalendarDays,
  Clock,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { useLocation } from 'wouter';

import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ProfileData = {
  id: string;
  email: string;
  name: string;
  company: string;
  role: string;
  createdAt: string;
  lastSignInAt: string;
};

export default function Profile() {
  const [, navigate] = useLocation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [profile, setProfile] = useState<ProfileData>({
    id: '',
    email: '',
    name: '',
    company: '',
    role: 'Usuário',
    createdAt: '',
    lastSignInAt: '',
  });

  const initials = useMemo(() => {
    const name = profile.name || profile.email || 'U';

    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }, [profile.name, profile.email]);

  const formatDate = (date?: string) => {
    if (!date) return 'Não informado';

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(date));
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setErrorMessage('');

        const { data, error } = await supabase.auth.getUser();

        if (error || !data.user) {
          setErrorMessage('Não foi possível carregar os dados do usuário.');
          return;
        }

        const user = data.user;

        setProfile({
          id: user.id,
          email: user.email || '',
          name:
            String(user.user_metadata?.name || user.user_metadata?.full_name || '') ||
            '',
          company: String(user.user_metadata?.company || ''),
          role: String(user.user_metadata?.role || 'Usuário'),
          createdAt: user.created_at || '',
          lastSignInAt: user.last_sign_in_at || '',
        });
      } catch {
        setErrorMessage('Erro inesperado ao carregar o perfil.');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setSuccessMessage('');
      setErrorMessage('');

      const { error } = await supabase.auth.updateUser({
        data: {
          name: profile.name,
          company: profile.company,
        },
      });

      if (error) {
        setErrorMessage(error.message || 'Não foi possível salvar o perfil.');
        return;
      }

      setSuccessMessage('Perfil atualizado com sucesso.');
    } catch {
      setErrorMessage('Erro inesperado ao salvar o perfil.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Carregando perfil...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="container py-8">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o dashboard
          </button>

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary text-3xl font-bold text-primary-foreground shadow-lg shadow-primary/25">
                {initials}
              </div>

              <div>
                <h1 className="text-3xl font-bold">
                  {profile.name || 'Meu perfil'}
                </h1>

                <p className="mt-1 flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 text-primary" />
                  {profile.email}
                </p>

                <p className="mt-1 flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4 text-primary" />
                  {profile.company || 'Empresa não informada'}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
              <p className="text-xs text-muted-foreground">Tipo de conta</p>
              <p className="mt-1 flex items-center gap-2 font-semibold text-primary">
                <ShieldCheck className="h-4 w-4" />
                {profile.role}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-8">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Dados pessoais</h2>
              <p className="text-sm text-muted-foreground">
                Visualize e atualize as informações principais da sua conta.
              </p>
            </div>

            <div className="grid gap-5">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Nome completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  <Input
                    value={profile.name}
                    onChange={(event) =>
                      setProfile((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    className="pl-10"
                    placeholder="Digite seu nome"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Empresa</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  <Input
                    value={profile.company}
                    onChange={(event) =>
                      setProfile((prev) => ({
                        ...prev,
                        company: event.target.value,
                      }))
                    }
                    className="pl-10"
                    placeholder="Nome da empresa ou restaurante"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  <Input
                    value={profile.email}
                    disabled
                    className="pl-10 opacity-80"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  O e-mail é gerenciado pela autenticação da conta.
                </p>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  {successMessage}
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Salvar alterações
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Informações da conta</h2>

              <div className="mt-5 space-y-4">
                <div className="rounded-xl bg-secondary p-4">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    Conta criada em
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDate(profile.createdAt)}
                  </p>
                </div>

                <div className="rounded-xl bg-secondary p-4">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="h-4 w-4 text-primary" />
                    Último acesso
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDate(profile.lastSignInAt)}
                  </p>
                </div>

                <div className="rounded-xl bg-secondary p-4">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    ID do usuário
                  </p>
                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    {profile.id}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-6">
              <h3 className="font-semibold text-primary">
                Segurança da conta
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Para alterar senha, e-mail ou métodos de autenticação, use as
                opções configuradas no Supabase Auth.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}