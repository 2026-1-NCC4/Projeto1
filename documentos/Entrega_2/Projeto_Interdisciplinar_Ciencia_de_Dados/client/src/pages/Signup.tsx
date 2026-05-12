import { ChangeEvent, FormEvent, ReactNode, useState } from 'react';
import { useLocation } from 'wouter';
import { BarChart3, Mail, ShoppingBag, Users, Store } from 'lucide-react';

import {
  Ripple,
  TechOrbitDisplay,
  AnimatedForm,
} from '@/components/ui/modern-animated-sign-in';

import { supabase } from '@/lib/supabase';

type SignupFormData = {
  name: string;
  company: string;
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

export default function Signup() {
  const [, navigate] = useLocation();

  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    company: '',
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorField, setErrorField] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement>,
    name: keyof SignupFormData
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
      setSuccessMessage('');

      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            company: formData.company,
          },
        },
      });

      if (error) {
        setErrorField(error.message || 'Não foi possível criar a conta.');
        return;
      }

      setSuccessMessage(
        'Conta criada com sucesso. Verifique seu e-mail para confirmar o cadastro.'
      );
    } catch {
      setErrorField('Erro inesperado ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  const formFields = {
    header: 'Crie sua conta',
    subHeader:
      'Cadastre-se para acessar o dashboard Cannoli e analisar campanhas, pedidos, clientes e indicadores do seu negócio.',
    fields: [
      {
        label: 'Nome completo',
        name: 'name',
        required: true,
        type: 'text' as const,
        placeholder: 'Seu nome',
        onChange: (event: ChangeEvent<HTMLInputElement>) =>
          handleInputChange(event, 'name'),
      },
      {
        label: 'Empresa',
        name: 'company',
        required: true,
        type: 'text' as const,
        placeholder: 'Nome da empresa ou restaurante',
        onChange: (event: ChangeEvent<HTMLInputElement>) =>
          handleInputChange(event, 'company'),
      },
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
        placeholder: 'Mínimo de 6 caracteres',
        onChange: (event: ChangeEvent<HTMLInputElement>) =>
          handleInputChange(event, 'password'),
      },
    ],
    submitButton: 'Criar conta',
    textVariantButton: 'Já tem conta? Entrar',
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
            Transforme dados em campanhas mais inteligentes.
          </h2>

          <p className="text-muted-foreground mt-3 max-w-xl">
            Visualize KPIs, receita, conversões e comportamento dos clientes em
            uma plataforma moderna e responsiva.
          </p>
        </div>
      </aside>

      <main className="w-full lg:w-1/2 min-h-screen flex items-center justify-center px-6 py-10 bg-background">
        <div className="w-full">
          <AnimatedForm
            {...formFields}
            loading={loading}
            errorField={errorField}
            onSubmit={handleSubmit}
            goTo={() => navigate('/login')}
          />

          {successMessage && (
            <p className="mt-4 text-center text-sm font-medium text-primary">
              {successMessage}
            </p>
          )}
        </div>
      </main>
    </section>
  );
}