import { ChangeEvent, FormEvent, ReactNode, useState } from 'react';
import { useLocation } from 'wouter';
import { BarChart3, Mail, ShoppingBag, Users, Store } from 'lucide-react';

import {
  Ripple,
  TechOrbitDisplay,
  AnimatedForm,
} from '@/components/ui/modern-animated-sign-in';

import { supabase } from '@/lib/supabase';

type LoginFormData = {
  email: string;
  password: string;
};

type OrbitIcon = {
  component: () => ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
  radius?: number;
  reverse?: boolean;
};

const iconsArray: OrbitIcon[] = [
  {
    component: () => <Mail className="w-8 h-8 text-primary drop-shadow-sm" />,
    className: 'size-[40px]',
    radius: 110,
    duration: 18,
  },
  {
    component: () => (
      <ShoppingBag className="w-8 h-8 text-primary drop-shadow-sm" />
    ),
    className: 'size-[40px]',
    radius: 170,
    duration: 22,
    reverse: true,
  },
  {
    component: () => <Users className="w-8 h-8 text-primary drop-shadow-sm" />,
    className: 'size-[40px]',
    radius: 230,
    duration: 24,
  },
  {
    component: () => <Store className="w-8 h-8 text-primary drop-shadow-sm" />,
    className: 'size-[40px]',
    radius: 290,
    duration: 28,
    reverse: true,
  },
];

export default function Login() {
  const [, navigate] = useLocation();

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorField, setErrorField] = useState('');

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement>,
    name: keyof LoginFormData
  ) => {
    setFormData((prev) => ({
      ...prev,
      [name]: event.target.value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setLoading(true);
      setErrorField('');

      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        setErrorField('E-mail ou senha inválidos.');
        return;
      }

      navigate('/dashboard/overview');
    } catch {
      setErrorField('Erro inesperado ao fazer login.');
    } finally {
      setLoading(false);
    }
  };

  const formFields = {
    header: 'Bem-vindo de volta',
    subHeader:
      'Entre no dashboard inteligente da Cannoli para acompanhar campanhas, pedidos, clientes e indicadores.',
    fields: [
      {
        label: 'E-mail',
        name: 'email',
        required: true,
        type: 'email' as const,
        placeholder: 'seuemail@exemplo.com',
        onChange: (event: ChangeEvent<HTMLInputElement>) =>
          handleInputChange(event, 'email'),
      },
      {
        label: 'Senha',
        name: 'password',
        required: true,
        type: 'password' as const,
        placeholder: 'Digite sua senha',
        onChange: (event: ChangeEvent<HTMLInputElement>) =>
          handleInputChange(event, 'password'),
      },
    ],
    submitButton: 'Entrar',
    textVariantButton: 'Ainda não tem conta? Inscreva-se',
  };

  return (
    <section className="min-h-screen bg-background text-foreground flex">
      <aside className="hidden lg:flex relative w-1/2 overflow-hidden border-r border-border bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <Ripple mainCircleSize={100} />

        <div className="absolute top-8 left-8 z-10 flex items-center gap-3">
          <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
            <BarChart3 className="w-6 h-6 text-primary-foreground" />
          </div>

          <div>
            <h1 className="font-bold text-xl text-foreground">Cannoli</h1>
            <p className="text-xs text-muted-foreground">
              Foodtech Analytics
            </p>
          </div>
        </div>

        <TechOrbitDisplay iconsArray={iconsArray} text="Cannoli" />

        <div className="absolute bottom-8 left-8 right-8 z-10">
          <h2 className="text-3xl font-bold text-foreground">
            Dashboard inteligente para campanhas foodtech.
          </h2>

          <p className="text-muted-foreground mt-3 max-w-xl">
            Acompanhe conversões, receita, pedidos, clientes e performance das
            campanhas em tempo real.
          </p>
        </div>
      </aside>

      <main className="w-full lg:w-1/2 min-h-screen flex items-center justify-center px-6 py-10 bg-background">
        <AnimatedForm
          {...formFields}
          loading={loading}
          errorField={errorField}
          onSubmit={handleSubmit}
          goTo={() => navigate('/signup')}
        />
      </main>
    </section>
  );
}