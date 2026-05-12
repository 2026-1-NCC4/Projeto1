import { useEffect, useMemo, useState } from "react";
import {
  Mail,
  Users,
  ShoppingCart,
  TrendingUp,
  Loader2,
  Filter,
  X,
} from "lucide-react";

import MetricCard from "@/components/MetricCard";
import DataTable from "@/components/DataTable";
import TableActions from "@/components/TablesActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type {
  DashboardKPI,
  TimeSeriesData,
  ChartDataPoint,
  CampaignOrder,
} from "@/../../shared/types";

import {
  getDashboardKPIs,
  getTimeSeriesData,
  getCampaignStatusDistribution,
  getOrderStatusDistribution,
  getRevenueByStore,
  getCampaignOrders,
} from "@/lib/mockData";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

type OrderFilters = {
  searchTerm: string;
  status: string;
};

const EMPTY_FILTERS: OrderFilters = {
  searchTerm: "",
  status: "all",
};

function OverviewSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-3">
        <div className="h-9 w-48 rounded-xl bg-muted animate-pulse" />
        <div className="h-5 w-full max-w-xl rounded-lg bg-muted animate-pulse" />
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-muted-foreground shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm">
          Carregando indicadores do dashboard...
        </span>
      </div>
    </div>
  );
}

export default function Overview() {
  const [kpis, setKpis] = useState<DashboardKPI | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [campaignStatus, setCampaignStatus] = useState<ChartDataPoint[]>([]);
  const [orderStatus, setOrderStatus] = useState<ChartDataPoint[]>([]);
  const [revenueByStore, setRevenueByStore] = useState<ChartDataPoint[]>([]);
  const [campaignOrders, setCampaignOrders] = useState<CampaignOrder[]>([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<OrderFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<OrderFilters>(EMPTY_FILTERS);

  const [selectedOrder, setSelectedOrder] = useState<CampaignOrder | null>(
    null
  );

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        console.group("[Overview] Carregamento do dashboard");

        setLoading(true);
        setErrorMessage("");

        const [
          kpisData,
          timeSeries,
          campaignStatusData,
          orderStatusData,
          revenueStoreData,
          campaignOrdersData,
        ] = await Promise.all([
          getDashboardKPIs(),
          getTimeSeriesData(),
          getCampaignStatusDistribution(),
          getOrderStatusDistribution(),
          getRevenueByStore(),
          getCampaignOrders(),
        ]);

        console.info("[Overview] KPIs:", kpisData);
        console.info("[Overview] Pedidos recentes:", campaignOrdersData);

        if (!isMounted) return;

        setKpis(kpisData);
        setTimeSeriesData(timeSeries);
        setCampaignStatus(campaignStatusData);
        setOrderStatus(orderStatusData);
        setRevenueByStore(revenueStoreData);
        setCampaignOrders(campaignOrdersData);
      } catch (error) {
        console.error("[Overview] Erro ao carregar dashboard:", error);

        if (!isMounted) return;

        setErrorMessage(
          "Não foi possível carregar os dados reais do banco de dados."
        );
      } finally {
        console.groupEnd();

        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatCurrency = (value: unknown) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value ?? 0));
  };

  const formatNumber = (value: unknown) => {
    return new Intl.NumberFormat("pt-BR").format(Number(value ?? 0));
  };

  const formatPercent = (value: unknown) => {
    return `${Number(value ?? 0).toFixed(1)}%`;
  };

  const formatDate = (value: unknown) => {
    if (!value) return "-";

    const date = new Date(String(value));

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("pt-BR");
  };

  const getOrderStatus = (status?: number | null) => {
    const statusMap: Record<number, string> = {
      0: "Pendente",
      1: "Enviado",
      2: "Entregue",
      3: "Falha",
    };

    return statusMap[Number(status)] || "Desconhecido";
  };

  const getOrderStatusColor = (status?: number | null) => {
    switch (Number(status)) {
      case 0:
        return "bg-yellow-100 text-yellow-800";
      case 1:
        return "bg-blue-100 text-blue-800";
      case 2:
        return "bg-green-100 text-green-800";
      case 3:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredCampaignOrders = useMemo(() => {
    const search = appliedFilters.searchTerm.toLowerCase().trim();

    const result = campaignOrders.filter(order => {
      const matchesSearch =
        !search ||
        String(order.id ?? "").toLowerCase().includes(search) ||
        String(order.totalamount ?? "").toLowerCase().includes(search) ||
        getOrderStatus(order.status).toLowerCase().includes(search);

      const matchesStatus =
        appliedFilters.status === "all" ||
        String(order.status) === appliedFilters.status;

      return matchesSearch && matchesStatus;
    });

    console.info("[Overview] Pedidos recentes filtrados:", result.length);

    return result;
  }, [campaignOrders, appliedFilters]);

  const activeFiltersCount = useMemo(() => {
    return Object.entries(appliedFilters).filter(([, value]) => {
      return value !== "" && value !== "all";
    }).length;
  }, [appliedFilters]);

  const handleOpenFilters = () => {
    setDraftFilters(appliedFilters);
    setFiltersOpen(true);
  };

  const handleApplyFilters = () => {
    console.info("[Overview] Aplicando filtros:", draftFilters);

    setAppliedFilters(draftFilters);
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    console.warn("[Overview] Limpando filtros.");

    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setFiltersOpen(false);
  };

  const handleViewOrder = (order: CampaignOrder) => {
    console.group("[Overview] Visualizar pedido recente");
    console.info("Pedido:", order);
    console.info("ID:", order.id);
    console.groupEnd();

    setSelectedOrder(order);
  };

  const closeOrderModal = () => {
    setSelectedOrder(null);
  };

  if (loading) {
    return <OverviewSkeleton />;
  }

  if (errorMessage || !kpis) {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <h1 className="text-3xl font-bold text-foreground">Overview</h1>
        <p className="text-red-500">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Overview</h1>
          <p className="text-muted-foreground mt-2">
            Bem-vindo ao dashboard Cannoli. Aqui você acompanha métricas reais
            carregadas diretamente do banco de dados.
          </p>
        </div>

        <Button variant="outline" className="gap-2" onClick={handleOpenFilters}>
          <Filter className="w-4 h-4" />
          Filtrar pedidos
          {activeFiltersCount > 0 && (
            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Filtrar pedidos recentes
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  A tabela de pedidos recentes será atualizada após aplicar.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="rounded-lg p-2 hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Buscar</label>
                <Input
                  placeholder="ID, status ou valor..."
                  value={draftFilters.searchTerm}
                  onChange={event =>
                    setDraftFilters(prev => ({
                      ...prev,
                      searchTerm: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  value={draftFilters.status}
                  onChange={event =>
                    setDraftFilters(prev => ({
                      ...prev,
                      status: event.target.value,
                    }))
                  }
                >
                  <option value="all">Todos</option>
                  <option value="0">Pendente</option>
                  <option value="1">Enviado</option>
                  <option value="2">Entregue</option>
                  <option value="3">Falha</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border p-5 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={clearFilters}>
                Limpar filtros
              </Button>

              <Button type="button" onClick={handleApplyFilters}>
                Aplicar filtros
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Visualizar pedido recente
                </h2>

                <p className="mt-1 break-all text-sm text-muted-foreground">
                  ID: {selectedOrder.id}
                </p>
              </div>

              <button
                type="button"
                onClick={closeOrderModal}
                className="rounded-lg p-2 hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Data</p>
                <p className="font-medium">{formatDate(selectedOrder.sent_at)}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium">
                  {getOrderStatus(Number(selectedOrder.status))}
                </p>
              </div>

              <div>
                <p className="text-muted-foreground">Valor</p>
                <p className="font-medium">
                  {formatCurrency(selectedOrder.totalamount)}
                </p>
              </div>
            </div>

            <div className="flex justify-end border-t border-border p-5">
              <Button type="button" variant="outline" onClick={closeOrderModal}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Campanhas"
          value={kpis.totalCampaigns}
          change={0}
          icon={<Mail className="w-5 h-5" />}
          description={`${kpis.activeCampaigns} ativas`}
        />

        <MetricCard
          title="Total de Clientes"
          value={formatNumber(kpis.totalCustomers)}
          change={0}
          icon={<Users className="w-5 h-5" />}
          description={`${formatNumber(kpis.activeCustomers)} ativos`}
        />

        <MetricCard
          title="Total de Pedidos"
          value={formatNumber(kpis.totalOrders)}
          change={0}
          icon={<ShoppingCart className="w-5 h-5" />}
          description={`Ticket médio: ${formatCurrency(kpis.averageOrderValue)}`}
        />

        <MetricCard
          title="Receita Total"
          value={formatCurrency(kpis.totalRevenue)}
          change={0}
          icon={<TrendingUp className="w-5 h-5" />}
          description={`Taxa de conversão: ${formatPercent(kpis.conversionRate)}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Evolução de Campanhas e Pedidos</CardTitle>
          </CardHeader>

          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip />
                <Legend />

                <Line
                  type="monotone"
                  dataKey="campaigns"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                  name="Campanhas"
                />

                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={false}
                  name="Pedidos"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status de Campanhas</CardTitle>
          </CardHeader>

          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={campaignStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) =>
                    `${name} ${Number(percentage ?? 0).toFixed(1)}%`
                  }
                  outerRadius={80}
                  dataKey="value"
                >
                  {campaignStatus.map((entry, index) => (
                    <Cell
                      key={`${entry.name}-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Receita por Loja</CardTitle>
          </CardHeader>

          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByStore}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip formatter={value => formatCurrency(value)} />
                <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status de Pedidos</CardTitle>
          </CardHeader>

          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) =>
                    `${name} ${Number(percentage ?? 0).toFixed(1)}%`
                  }
                  outerRadius={80}
                  dataKey="value"
                >
                  {orderStatus.map((entry, index) => (
                    <Cell
                      key={`${entry.name}-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <DataTable<CampaignOrder>
        title={`Pedidos Recentes exibindo ${filteredCampaignOrders.slice(0, 5).length} de ${filteredCampaignOrders.length}`}
        columns={[
          { key: "id", label: "ID" },
          {
            key: "sent_at",
            label: "Data",
            render: value => formatDate(value),
          },
          {
            key: "status",
            label: "Status",
            render: value => (
              <span
                className={`px-2 py-1 rounded text-sm font-medium ${getOrderStatusColor(
                  Number(value)
                )}`}
              >
                {getOrderStatus(Number(value))}
              </span>
            ),
          },
          {
            key: "totalamount",
            label: "Valor",
            render: value => formatCurrency(value),
          },
          {
            key: "id",
            label: "Ações",
            render: (_value, row) => (
              <TableActions<CampaignOrder>
                item={row}
                onView={handleViewOrder}
                showEdit={false}
                showDelete={false}
              />
            ),
          },
        ]}
        data={filteredCampaignOrders.slice(0, 5)}
      />
    </div>
  );
}