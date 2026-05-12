import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  Database,
  Gift,
  LineChart,
  MessageCircle,
  PieChart,
  Repeat,
  ShieldCheck,
  Sparkles,
  Store,
  Target,
  TrendingUp,
  Users,
  WalletCards,
  Zap,
} from 'lucide-react';
import { useLocation } from 'wouter';

import FlowArt, { FlowSection } from '@/components/ui/story-scroll';

const benefits = [
  'Captura de dados no momento da venda',
  'Análise de comportamento do consumidor',
  'Automação de campanhas estratégicas',
  'Cashback integrado para fidelização',
  'Segmentação de clientes ativos e inativos',
  'Campanhas via WhatsApp com foco em retorno',
];

const features = [
  {
    icon: Database,
    title: 'Dados centralizados',
    description:
      'Clientes, pedidos, campanhas, histórico de compras e comportamento organizados em uma base única.',
  },
  {
    icon: Users,
    title: 'Segmentação inteligente',
    description:
      'Crie grupos por frequência, ticket médio, última compra, recorrência, inatividade e potencial de recompra.',
  },
  {
    icon: PieChart,
    title: 'Indicadores comerciais',
    description:
      'Acompanhe receita, pedidos, ticket médio, recompra, clientes ativos, campanhas e performance por canal.',
  },
  {
    icon: MessageCircle,
    title: 'Campanhas via WhatsApp',
    description:
      'Envie mensagens estratégicas para públicos específicos com foco em reativação, fidelização e novas vendas.',
  },
  {
    icon: Gift,
    title: 'Cashback e benefícios',
    description:
      'Crie incentivos para o cliente voltar, comprar novamente e manter relacionamento com a sua marca.',
  },
  {
    icon: LineChart,
    title: 'Decisão baseada em dados',
    description:
      'Pare de depender apenas de achismo e acompanhe oportunidades reais dentro da sua própria base de clientes.',
  },
];

const steps = [
  {
    icon: WalletCards,
    title: 'Importe sua base',
    text: 'Comece com dados vindos de planilhas, PDV, delivery, marketplaces ou integrações.',
  },
  {
    icon: Target,
    title: 'Entenda seus clientes',
    text: 'Identifique quem compra mais, quem sumiu, quem precisa ser reativado e quem tem maior potencial.',
  },
  {
    icon: Zap,
    title: 'Automatize campanhas',
    text: 'Crie ações para aniversariantes, clientes inativos, recompra, cashback e datas comemorativas.',
  },
  {
    icon: TrendingUp,
    title: 'Acompanhe o resultado',
    text: 'Monitore vendas recuperadas, retorno por campanha, recorrência e evolução do ticket médio.',
  },
];

const stats = [
  {
    value: '+35%',
    label: 'recorrência média',
    description: 'Clientes impactados no momento certo tendem a comprar mais vezes.',
  },
  {
    value: '+24%',
    label: 'vendas recuperadas',
    description: 'Campanhas de reativação ajudam a trazer clientes inativos de volta.',
  },
  {
    value: '+18%',
    label: 'ticket médio',
    description: 'Clientes fidelizados compram com mais confiança e frequência.',
  },
];

const integrations = ['iFood', '99Food', 'Linx', 'Excel', 'WhatsApp', 'PDV'];

const plans = [
  {
    name: 'Essencial',
    subtitle: 'Ideal para começar',
    price: 'R$ 297',
    description: 'Para operações que querem organizar clientes e iniciar campanhas.',
    features: [
      'Até 5.000 clientes',
      'Até 15 segmentações',
      'Até 5 campanhas',
      '1 número de WhatsApp',
      'Importação por planilha',
      'Automação de campanhas',
      'Dashboard comercial',
    ],
  },
  {
    name: 'Estratégia',
    subtitle: 'Para negócios em crescimento',
    price: 'R$ 597',
    description: 'Para quem quer vender mais com dados, recorrência e automação.',
    featured: true,
    features: [
      'Até 15.000 clientes',
      'Até 30 segmentações',
      'Até 20 campanhas',
      '5 números de WhatsApp',
      'Cashback integrado',
      'Segmentação avançada',
      'Suporte prioritário',
      'Relatórios gerenciais',
    ],
  },
  {
    name: 'Performance',
    subtitle: 'Para grandes operações',
    price: 'Sob consulta',
    description: 'Para redes, franquias e operações com alto volume de dados.',
    features: [
      'Clientes ilimitados',
      'Segmentações ilimitadas',
      'Campanhas ilimitadas',
      'WhatsApp ilimitado',
      'Gerente dedicado',
      'Relatórios personalizados',
      'Integrações sob demanda',
      'Consultoria estratégica',
    ],
  },
];

const faqs = [
  {
    question: 'A Cannoli substitui meu sistema de venda?',
    answer:
      'Não. A Cannoli complementa sua operação, centralizando dados e transformando informações em campanhas, indicadores e relacionamento.',
  },
  {
    question: 'Preciso ter uma base organizada?',
    answer:
      'Não necessariamente. Você pode começar com planilhas ou bases simples. A plataforma ajuda a estruturar os dados para uso comercial.',
  },
  {
    question: 'Serve apenas para restaurantes?',
    answer:
      'Não. A Cannoli foi pensada para bares, restaurantes e varejo alimentar, mas também pode atender negócios com venda recorrente.',
  },
];

export default function Landing() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed left-0 top-0 z-[999] w-full border-b border-white/10 bg-black/75 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between text-white">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <BarChart3 className="h-5 w-5" />
            </div>

            <div className="text-left">
              <p className="text-lg font-black leading-none">Cannoli</p>
              <p className="text-xs text-white/60">CRM & Fidelização</p>
            </div>
          </button>

          <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
            <a href="#solucao" className="transition hover:text-white">
              Solução
            </a>
            <a href="#recursos" className="transition hover:text-white">
              Recursos
            </a>
            <a href="#planos" className="transition hover:text-white">
              Planos
            </a>
            <a href="#faq" className="transition hover:text-white">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white sm:block"
            >
              Entrar
            </button>

            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-black transition hover:bg-white/90"
            >
              Começar
            </button>
          </div>
        </div>
      </header>

      <FlowArt aria-label="Landing page Cannoli">
        <FlowSection
          aria-label="Hero"
          style={{ backgroundColor: '#0f172a', color: '#fff' }}
        >
          <div className="pt-20">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 shadow-xl backdrop-blur">
              <Sparkles className="h-4 w-4 text-primary" />
              CRM, fidelização e inteligência de dados para vender mais
            </div>

            <h1 className="max-w-7xl text-[clamp(3.3rem,10vw,10.5rem)] font-black uppercase leading-[0.82] tracking-tight">
              Venda.
              <br />
              Conheça.
              <br />
              Fidelize.
            </h1>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-end">
            <div>
              <p className="max-w-4xl text-[clamp(1.1rem,2.4vw,2rem)] leading-relaxed text-white/80">
                Transforme vendas pontuais em relacionamento contínuo com CRM,
                dados, campanhas automatizadas, cashback e segmentação
                inteligente.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate('/signup')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 font-black text-primary-foreground shadow-xl shadow-primary/30 transition hover:bg-primary/90"
                >
                  Quero vender com dados
                  <ArrowRight className="h-5 w-5" />
                </button>

                <a
                  href="#planos"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 py-4 font-bold text-white backdrop-blur transition hover:bg-white/15"
                >
                  Ver planos
                </a>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur">
              <div className="rounded-[1.5rem] bg-black/30 p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">Recorrência média</p>
                    <p className="mt-2 text-6xl font-black text-primary">
                      +35%
                    </p>
                  </div>

                  <div className="rounded-2xl bg-primary p-4 text-primary-foreground">
                    <TrendingUp className="h-8 w-8" />
                  </div>
                </div>

                {[
                  ['Clientes ativos', '78%'],
                  ['Vendas recuperadas', '24%'],
                  ['Ticket médio', '+18%'],
                ].map(([label, value]) => (
                  <div key={label} className="mb-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-white/60">{label}</span>
                      <span className="font-bold">{value}</span>
                    </div>
                    <div className="h-3 rounded-full bg-white/10">
                      <div className="h-3 w-3/4 rounded-full bg-primary" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FlowSection>

        <FlowSection
          id="solucao"
          aria-label="Solução"
          style={{ backgroundColor: '#f97316', color: '#fff' }}
        >
          <p className="pt-20 text-xs font-bold uppercase tracking-[0.2em]">
            01 — Sobre a solução
          </p>

          <hr className="border-white/50" />

          <h2 className="text-[clamp(3.3rem,10vw,10rem)] font-black uppercase leading-[0.82] tracking-tight">
            Dados
            <br />
            Viram
            <br />
            Decisão.
          </h2>

          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <p className="max-w-3xl text-[clamp(1.1rem,2.4vw,2rem)] leading-relaxed">
              A Cannoli organiza clientes, pedidos e histórico de consumo para
              gerar indicadores, segmentações e oportunidades comerciais.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              {benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="rounded-3xl border border-white/20 bg-white/10 p-5 shadow-xl backdrop-blur"
                >
                  <Check className="mb-4 h-6 w-6" />
                  <p className="font-bold">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </FlowSection>

        <FlowSection
          id="recursos"
          aria-label="Recursos"
          style={{ backgroundColor: '#020617', color: '#fff' }}
        >
          <p className="pt-20 text-xs font-bold uppercase tracking-[0.2em]">
            02 — Recursos
          </p>

          <hr className="border-white/40" />

          <h2 className="text-[clamp(3.3rem,10vw,10rem)] font-black uppercase leading-[0.82] tracking-tight">
            CRM
            <br />
            Para
            <br />
            Crescer.
          </h2>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="group rounded-[2rem] border border-white/10 bg-white/[0.08] p-6 shadow-xl backdrop-blur transition hover:-translate-y-1 hover:bg-white/[0.12]"
                >
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 text-primary">
                    <Icon className="h-7 w-7" />
                  </div>

                  <h3 className="text-2xl font-black">{feature.title}</h3>

                  <p className="mt-4 leading-7 text-white/70">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </FlowSection>

        <FlowSection
          aria-label="Como funciona"
          style={{ backgroundColor: '#F5F0E8', color: '#000' }}
        >
          <p className="pt-20 text-xs font-bold uppercase tracking-[0.2em]">
            03 — Como funciona
          </p>

          <hr className="border-black/40" />

          <h2 className="text-[clamp(3.3rem,10vw,10rem)] font-black uppercase leading-[0.82] tracking-tight">
            Importe.
            <br />
            Analise.
            <br />
            Aja.
          </h2>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((item, index) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-xl"
                >
                  <p className="mb-6 text-5xl font-black text-primary/20">
                    0{index + 1}
                  </p>

                  <Icon className="mb-5 h-8 w-8 text-primary" />

                  <h3 className="text-2xl font-black">{item.title}</h3>

                  <p className="mt-4 leading-7 text-black/60">{item.text}</p>
                </div>
              );
            })}
          </div>
        </FlowSection>

        <FlowSection
          aria-label="Indicadores"
          style={{ backgroundColor: '#111827', color: '#fff' }}
        >
          <p className="pt-20 text-xs font-bold uppercase tracking-[0.2em]">
            04 — Indicadores
          </p>

          <hr className="border-white/40" />

          <h2 className="text-[clamp(3.3rem,10vw,10rem)] font-black uppercase leading-[0.82] tracking-tight">
            Meça
            <br />
            O Que
            <br />
            Importa.
          </h2>

          <div className="grid gap-6 lg:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[2rem] border border-white/10 bg-white/10 p-7 shadow-2xl backdrop-blur"
              >
                <p className="text-6xl font-black text-primary">
                  {stat.value}
                </p>

                <h3 className="mt-4 text-2xl font-black">{stat.label}</h3>

                <p className="mt-4 leading-7 text-white/70">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
        </FlowSection>

        <FlowSection
          aria-label="Integrações"
          style={{ backgroundColor: '#ffffff', color: '#000' }}
        >
          <p className="pt-20 text-xs font-bold uppercase tracking-[0.2em]">
            05 — Integrações
          </p>

          <hr className="border-black/30" />

          <h2 className="text-[clamp(3.3rem,10vw,10rem)] font-black uppercase leading-[0.82] tracking-tight">
            Tudo
            <br />
            Em Uma
            <br />
            Base.
          </h2>

          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <p className="max-w-3xl text-[clamp(1.1rem,2.4vw,2rem)] leading-relaxed text-black/70">
              Conecte dados de canais de venda, planilhas, delivery, PDV e
              WhatsApp para criar uma visão mais completa do cliente.
            </p>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {integrations.map((integration) => (
                <div
                  key={integration}
                  className="flex h-28 items-center justify-center rounded-3xl border border-black/10 bg-black/[0.03] p-5 shadow-sm"
                >
                  <span className="text-2xl font-black text-primary">
                    {integration}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </FlowSection>

        <FlowSection
          id="planos"
          aria-label="Planos"
          style={{ backgroundColor: '#1A3DE8', color: '#fff' }}
        >
          <p className="pt-20 text-xs font-bold uppercase tracking-[0.2em]">
            06 — Planos
          </p>

          <hr className="border-white/40" />

          <h2 className="text-[clamp(3.3rem,10vw,10rem)] font-black uppercase leading-[0.82] tracking-tight">
            Escolha
            <br />
            Seu
            <br />
            Plano.
          </h2>

          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-[2rem] border p-6 shadow-2xl ${
                  plan.featured
                    ? 'border-white bg-white text-black'
                    : 'border-white/20 bg-white/10 text-white backdrop-blur'
                }`}
              >
                {plan.featured && (
                  <span className="absolute right-5 top-5 rounded-full bg-primary px-3 py-1 text-xs font-black text-primary-foreground">
                    Recomendado
                  </span>
                )}

                <h3 className="text-3xl font-black">{plan.name}</h3>

                <p
                  className={`mt-2 text-sm ${
                    plan.featured ? 'text-black/60' : 'text-white/60'
                  }`}
                >
                  {plan.subtitle}
                </p>

                <p className="mt-5 text-4xl font-black">{plan.price}</p>

                <p
                  className={`mt-3 text-sm leading-6 ${
                    plan.featured ? 'text-black/60' : 'text-white/60'
                  }`}
                >
                  {plan.description}
                </p>

                <div className="my-6 h-px bg-current opacity-20" />

                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-3 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => navigate('/signup')}
                  className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 font-black transition ${
                    plan.featured
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-white text-black hover:bg-white/90'
                  }`}
                >
                  Escolher plano
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </FlowSection>

        <FlowSection
          id="faq"
          aria-label="Perguntas frequentes"
          style={{ backgroundColor: '#F5F0E8', color: '#000' }}
        >
          <p className="pt-20 text-xs font-bold uppercase tracking-[0.2em]">
            07 — FAQ
          </p>

          <hr className="border-black/30" />

          <h2 className="text-[clamp(3.3rem,10vw,10rem)] font-black uppercase leading-[0.82] tracking-tight">
            Dúvidas
            <br />
            Comuns.
          </h2>

          <div className="grid gap-5 lg:grid-cols-3">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-xl"
              >
                <ShieldCheck className="mb-5 h-8 w-8 text-primary" />

                <h3 className="text-xl font-black">{faq.question}</h3>

                <p className="mt-4 leading-7 text-black/60">{faq.answer}</p>
              </div>
            ))}
          </div>
        </FlowSection>

        <FlowSection
          aria-label="Chamada final"
          style={{ backgroundColor: '#000', color: '#fff' }}
        >
          <p className="pt-20 text-xs font-bold uppercase tracking-[0.2em]">
            08 — Comece agora
          </p>

          <hr className="border-white/40" />

          <h2 className="text-[clamp(3.3rem,10vw,10rem)] font-black uppercase leading-[0.82] tracking-tight">
            Menos
            <br />
            Achismo.
            <br />
            Mais
            <br />
            Dados.
          </h2>

          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="max-w-4xl text-[clamp(1.1rem,2.4vw,2rem)] leading-relaxed text-white/75">
                Construa relacionamento com quem já comprou de você e transforme
                dados em campanhas, recorrência e fidelização.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/70">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2">
                  <Store className="h-4 w-4" />
                  Restaurantes
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2">
                  <Repeat className="h-4 w-4" />
                  Recorrência
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2">
                  <Database className="h-4 w-4" />
                  Dados
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 font-black text-black shadow-2xl transition hover:bg-white/90"
            >
              Começar agora
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </FlowSection>
      </FlowArt>
    </div>
  );
}