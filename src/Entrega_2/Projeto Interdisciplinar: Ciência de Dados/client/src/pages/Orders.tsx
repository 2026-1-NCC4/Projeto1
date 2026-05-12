// client/src/pages/Orders.tsx
import { useEffect, useMemo, useState, useTransition } from "react";
import { Loader2, Filter, X } from "lucide-react";
import TableActions from "@/components/TablesActions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DataTable from "@/components/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { getStoreOrders } from "@/lib/mockData";
import type { StoreOrder } from "@/../../shared/types";

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"];
const INITIAL_VISIBLE_ROWS = 50;

type OrderFilters = {
  searchTerm: string;
  status: string;
  channel: string;
  startDate: string;
  endDate: string;
};

type ActionModalType = "view" | "edit" | "delete" | null;

const EMPTY_FILTERS: OrderFilters = {
  searchTerm: "",
  status: "all",
  channel: "all",
  startDate: "",
  endDate: "",
};

function toNumber(value: unknown): number {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function OrdersSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-3">
          <div className="h-9 w-48 rounded-xl bg-muted animate-pulse" />
          <div className="h-5 w-96 max-w-full rounded-lg bg-muted animate-pulse" />
        </div>

        <div className="h-10 w-28 rounded-lg bg-muted animate-pulse" />
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-muted-foreground shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm">Carregando pedidos com suavidade...</span>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            </CardHeader>

            <CardContent>
              <div className="h-8 w-24 rounded bg-muted animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="h-6 w-48 rounded bg-muted animate-pulse" />
            </CardHeader>

            <CardContent>
              <div className="h-[300px] rounded-2xl bg-muted animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="h-6 w-40 rounded bg-muted animate-pulse" />
        </CardHeader>

        <CardContent className="space-y-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-6 gap-4 rounded-xl border border-border p-3"
            >
              <div className="h-4 rounded bg-muted animate-pulse" />
              <div className="h-4 rounded bg-muted animate-pulse" />
              <div className="h-4 rounded bg-muted animate-pulse" />
              <div className="h-4 rounded bg-muted animate-pulse" />
              <div className="h-4 rounded bg-muted animate-pulse" />
              <div className="h-4 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<StoreOrder | null>(null);
  const [actionModal, setActionModal] = useState<ActionModalType>(null);

  const [visibleRows, setVisibleRows] = useState(INITIAL_VISIBLE_ROWS);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<OrderFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<OrderFilters>(EMPTY_FILTERS);

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      try {
        console.group("[Orders] Carregamento de pedidos");
        console.info("[Orders] Iniciando busca em getStoreOrders()");

        setLoading(true);
        setTableLoading(true);
        setErrorMessage("");

        const data = await getStoreOrders();

        console.info("[Orders] Dados recebidos:", data);
        console.info("[Orders] Total recebido:", data?.length ?? 0);

        if (!Array.isArray(data)) {
          console.error(
            "[Orders] Erro: getStoreOrders() não retornou array.",
            data
          );
          throw new Error("getStoreOrders() não retornou uma lista de pedidos.");
        }

        if (!isMounted) {
          console.warn("[Orders] Componente desmontado antes de setar os dados.");
          return;
        }

        startTransition(() => {
          setOrders(data);
          setVisibleRows(INITIAL_VISIBLE_ROWS);
        });

        console.info("[Orders] Pedidos aplicados no estado com sucesso.");
      } catch (error) {
        console.error("[Orders] Erro ao carregar pedidos:", error);

        if (!isMounted) return;

        setErrorMessage("Não foi possível carregar os pedidos do banco.");
      } finally {
        console.info("[Orders] Finalizando carregamento.");
        console.groupEnd();

        if (isMounted) {
          setLoading(false);

          window.setTimeout(() => {
            if (isMounted) setTableLoading(false);
          }, 250);
        }
      }
    }

    loadOrders();

    return () => {
      console.warn("[Orders] Componente desmontado.");
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    console.group("[Orders] Estado atual da tabela");
    console.info("orders:", orders.length);
    console.info("visibleRows:", visibleRows);
    console.info("appliedFilters:", appliedFilters);
    console.groupEnd();
  }, [orders, visibleRows, appliedFilters]);

  const formatCurrency = (value: unknown) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(toNumber(value));
  };

  const getOrderStatus = (status?: number | null) => {
    const statusMap: Record<number, string> = {
      0: "Pendente",
      1: "Confirmado",
      2: "Enviado",
      3: "Entregue",
      4: "Cancelado",
    };

    return statusMap[Number(status)] || "Desconhecido";
  };

  const getStatusColor = (status?: number | null) => {
    switch (Number(status)) {
      case 0:
        return "bg-yellow-100 text-yellow-800";
      case 1:
        return "bg-blue-100 text-blue-800";
      case 2:
        return "bg-purple-100 text-purple-800";
      case 3:
        return "bg-green-100 text-green-800";
      case 4:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date?: unknown) => {
    if (!date) return "-";

    const parsedDate = new Date(String(date));

    if (Number.isNaN(parsedDate.getTime())) return "-";

    return parsedDate.toLocaleDateString("pt-BR");
  };

  const closeActionModal = () => {
    console.info("[Orders] Fechando modal de ação.");
    setSelectedOrder(null);
    setActionModal(null);
  };

  const handleViewOrder = (order: StoreOrder) => {
    console.group("[Orders] Clique em Visualizar");
    console.info("Pedido recebido:", order);
    console.info("ID:", order.id);
    console.groupEnd();

    setSelectedOrder(order);
    setActionModal("view");
  };

  const handleEditOrder = (order: StoreOrder) => {
    console.group("[Orders] Clique em Editar");
    console.info("Pedido recebido:", order);
    console.info("ID:", order.id);
    console.groupEnd();

    setSelectedOrder(order);
    setActionModal("edit");
  };

  const handleDeleteOrder = (order: StoreOrder) => {
    console.group("[Orders] Clique em Excluir");
    console.info("Pedido recebido:", order);
    console.info("ID:", order.id);
    console.warn("A exclusão ainda não foi implementada no banco.");
    console.groupEnd();

    setSelectedOrder(order);
    setActionModal("delete");
  };

  const availableChannels = useMemo(() => {
    return Array.from(
      new Set(
        orders
          .map(order => order.saleschannel)
          .filter((channel): channel is string => Boolean(channel))
      )
    );
  }, [orders]);

  const filteredOrders = useMemo(() => {
    try {
      const result = orders.filter(order => {
        const search = appliedFilters.searchTerm.toLowerCase().trim();

        const matchesSearch =
          !search ||
          String(order.id ?? "").toLowerCase().includes(search) ||
          String(order.saleschannel ?? "").toLowerCase().includes(search) ||
          getOrderStatus(order.status).toLowerCase().includes(search) ||
          String(order.totalamount ?? "").toLowerCase().includes(search);

        const matchesStatus =
          appliedFilters.status === "all" ||
          String(order.status) === appliedFilters.status;

        const matchesChannel =
          appliedFilters.channel === "all" ||
          order.saleschannel === appliedFilters.channel;

        const orderDate = order.createdat ? new Date(order.createdat) : null;

        if (order.createdat && orderDate && Number.isNaN(orderDate.getTime())) {
          console.warn("[Orders] Data inválida encontrada:", {
            id: order.id,
            createdat: order.createdat,
            order,
          });
        }

        const matchesStartDate =
          !appliedFilters.startDate ||
          Boolean(orderDate && orderDate >= new Date(appliedFilters.startDate));

        const matchesEndDate =
          !appliedFilters.endDate ||
          Boolean(
            orderDate &&
              orderDate <= new Date(`${appliedFilters.endDate}T23:59:59`)
          );

        return (
          matchesSearch &&
          matchesStatus &&
          matchesChannel &&
          matchesStartDate &&
          matchesEndDate
        );
      });

      console.info("[Orders] Pedidos filtrados:", result.length);
      return result;
    } catch (error) {
      console.error("[Orders] Erro ao filtrar pedidos:", error);
      return [];
    }
  }, [orders, appliedFilters]);

  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce(
      (sum, order) => sum + toNumber(order.totalamount),
      0
    );
  }, [filteredOrders]);

  const averageOrderValue = useMemo(() => {
    if (filteredOrders.length === 0) return 0;
    return totalRevenue / filteredOrders.length;
  }, [filteredOrders.length, totalRevenue]);

  const deliveryRate = useMemo(() => {
    if (filteredOrders.length === 0) return 0;

    const deliveredOrders = filteredOrders.filter(
      order => Number(order.status) === 3
    ).length;

    return (deliveredOrders / filteredOrders.length) * 100;
  }, [filteredOrders]);

  const statusDistribution = useMemo(() => {
    return [
      {
        name: "Entregues",
        value: filteredOrders.filter(order => Number(order.status) === 3)
          .length,
      },
      {
        name: "Enviados",
        value: filteredOrders.filter(order => Number(order.status) === 2)
          .length,
      },
      {
        name: "Confirmados",
        value: filteredOrders.filter(order => Number(order.status) === 1)
          .length,
      },
      {
        name: "Pendentes",
        value: filteredOrders.filter(order => Number(order.status) === 0)
          .length,
      },
      {
        name: "Cancelados",
        value: filteredOrders.filter(order => Number(order.status) === 4)
          .length,
      },
    ].filter(item => item.value > 0);
  }, [filteredOrders]);

  const salesByChannel = useMemo(() => {
    const grouped = filteredOrders.reduce<Record<string, number>>(
      (acc, order) => {
        const channel = order.saleschannel || "Não informado";
        acc[channel] = (acc[channel] ?? 0) + 1;
        return acc;
      },
      {}
    );

    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredOrders]);

  const visibleOrders = useMemo(() => {
    const result = filteredOrders.slice(0, visibleRows);
    console.info("[Orders] Pedidos visíveis na tabela:", result.length);
    return result;
  }, [filteredOrders, visibleRows]);

  const hasMoreRows = visibleRows < filteredOrders.length;

  const activeFiltersCount = useMemo(() => {
    return Object.entries(appliedFilters).filter(([key, value]) => {
      if (key === "status" || key === "channel") return value !== "all";
      return Boolean(value);
    }).length;
  }, [appliedFilters]);

  const handleOpenFilters = () => {
    console.info("[Orders] Abrindo filtros:", appliedFilters);
    setDraftFilters(appliedFilters);
    setFiltersOpen(true);
  };

  const handleApplyFilters = () => {
    console.group("[Orders] Aplicando filtros");
    console.info("Filtros anteriores:", appliedFilters);
    console.info("Novos filtros:", draftFilters);
    console.groupEnd();

    setAppliedFilters(draftFilters);
    setVisibleRows(INITIAL_VISIBLE_ROWS);
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    console.warn("[Orders] Limpando filtros.");
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setVisibleRows(INITIAL_VISIBLE_ROWS);
    setFiltersOpen(false);
  };

  const handleLoadMore = () => {
    console.info("[Orders] Carregando mais pedidos.");

    setTableLoading(true);

    window.setTimeout(() => {
      startTransition(() => {
        setVisibleRows(prev => {
          const next = prev + INITIAL_VISIBLE_ROWS;

          console.info("[Orders] visibleRows atualizado:", {
            anterior: prev,
            novo: next,
          });

          return next;
        });
      });

      setTableLoading(false);
    }, 200);
  };

  const handleConfirmDelete = () => {
    if (!selectedOrder) return;

    console.group("[Orders] Confirmação visual de exclusão");
    console.info("Pedido selecionado:", selectedOrder);
    console.warn("Aqui você deve chamar a função real de delete no banco.");
    console.groupEnd();

    setOrders(prev => prev.filter(order => order.id !== selectedOrder.id));
    closeActionModal();
  };

  const handleConfirmEdit = () => {
    if (!selectedOrder) return;

    console.group("[Orders] Confirmação visual de edição");
    console.info("Pedido selecionado:", selectedOrder);
    console.warn("Aqui você deve chamar a função real de update no banco.");
    console.groupEnd();

    closeActionModal();
  };

  if (loading) return <OrdersSkeleton />;

  if (errorMessage) {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <h1 className="text-3xl font-bold text-foreground">Pedidos</h1>
        <p className="text-red-500">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pedidos</h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe pedidos reais carregados diretamente do banco de dados.
          </p>
        </div>

        <Button className="gap-2" onClick={handleOpenFilters}>
          <Filter className="h-4 w-4" />
          Filtrar
          {activeFiltersCount > 0 && (
            <span className="ml-1 rounded-full bg-background/20 px-2 py-0.5 text-xs">
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
                  Filtrar pedidos
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Os cards, gráficos e tabela serão atualizados após aplicar.
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
                  placeholder="ID, canal, status ou valor..."
                  value={draftFilters.searchTerm}
                  onChange={event =>
                    setDraftFilters(prev => ({
                      ...prev,
                      searchTerm: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
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
                  <option value="1">Confirmado</option>
                  <option value="2">Enviado</option>
                  <option value="3">Entregue</option>
                  <option value="4">Cancelado</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Canal</label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  value={draftFilters.channel}
                  onChange={event =>
                    setDraftFilters(prev => ({
                      ...prev,
                      channel: event.target.value,
                    }))
                  }
                >
                  <option value="all">Todos</option>
                  {availableChannels.map(channel => (
                    <option key={channel} value={channel}>
                      {channel}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data inicial</label>
                <Input
                  type="date"
                  value={draftFilters.startDate}
                  onChange={event =>
                    setDraftFilters(prev => ({
                      ...prev,
                      startDate: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data final</label>
                <Input
                  type="date"
                  value={draftFilters.endDate}
                  onChange={event =>
                    setDraftFilters(prev => ({
                      ...prev,
                      endDate: event.target.value,
                    }))
                  }
                />
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

      {actionModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {actionModal === "view" && "Visualizar pedido"}
                  {actionModal === "edit" && "Editar pedido"}
                  {actionModal === "delete" && "Excluir pedido"}
                </h2>

                <p className="mt-1 break-all text-sm text-muted-foreground">
                  ID: {selectedOrder.id}
                </p>
              </div>

              <button
                type="button"
                onClick={closeActionModal}
                className="rounded-lg p-2 hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              {actionModal === "delete" ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  Tem certeza que deseja excluir este pedido? Essa ação irá
                  remover o item visualmente da tabela.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">Canal</p>
                    <p className="font-medium">
                      {selectedOrder.saleschannel || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium">
                      {getOrderStatus(Number(selectedOrder.status))}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-medium">
                      {formatCurrency(selectedOrder.totalamount)}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Data</p>
                    <p className="font-medium">
                      {formatDate(selectedOrder.createdat)}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Loja</p>
                    <p className="break-all font-medium">
                      {String(selectedOrder.storeid ?? "-")}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Cliente</p>
                    <p className="break-all font-medium">
                      {String(selectedOrder.customerid ?? "-")}
                    </p>
                  </div>
                </div>
              )}

              {actionModal === "edit" && (
                <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700">
                  Modal de edição aberto. Aqui você pode adicionar inputs para
                  alterar o pedido e depois salvar no banco.
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border p-5 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={closeActionModal}>
                {actionModal === "view" ? "Fechar" : "Cancelar"}
              </Button>

              {actionModal === "delete" && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleConfirmDelete}
                >
                  Confirmar exclusão
                </Button>
              )}

              {actionModal === "edit" && (
                <Button type="button" onClick={handleConfirmEdit}>
                  Salvar alterações
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {(tableLoading || isPending) && (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-muted-foreground shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm">Preparando dados da tabela...</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {filteredOrders.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(totalRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(averageOrderValue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Entrega
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {deliveryRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell
                        key={`${entry.name}-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                Nenhum dado encontrado para os filtros aplicados.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vendas por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            {salesByChannel.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesByChannel}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                Nenhum dado encontrado para os filtros aplicados.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <DataTable<StoreOrder>
          title={`Pedidos exibindo ${visibleOrders.length} de ${filteredOrders.length}`}
          columns={[
            {
              key: "createdat",
              label: "Data",
              render: value => formatDate(value),
            },
            {
              key: "saleschannel",
              label: "Canal",
              render: value => (
                <span className="px-2 py-1 bg-secondary rounded text-sm">
                  {String(value || "-")}
                </span>
              ),
            },
            {
              key: "status",
              label: "Status",
              render: value => (
                <span
                  className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(
                    Number(value)
                  )}`}
                >
                  {getOrderStatus(Number(value))}
                </span>
              ),
            },
            {
              key: "totalamount",
              label: "Total",
              render: value => formatCurrency(value),
            },
            {
              key: "id",
              label: "Ações",
              render: (_value, row) => {
                console.info("[Orders] Renderizando ações para pedido:", row);

                return (
                  <TableActions<StoreOrder>
                    item={row}
                    onView={handleViewOrder}
                    onEdit={handleEditOrder}
                    onDelete={handleDeleteOrder}
                  />
                );
              },
            },
          ]}
          data={visibleOrders}
        />

        {hasMoreRows && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={tableLoading || isPending}
              className="gap-2"
            >
              {(tableLoading || isPending) && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Carregar mais pedidos
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}