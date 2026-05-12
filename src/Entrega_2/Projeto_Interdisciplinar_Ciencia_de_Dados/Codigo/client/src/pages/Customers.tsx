// client/src/pages/Customers.tsx
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Plus,
  Check,
  X,
  Download,
  Loader2,
  Filter,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DataTable from "@/components/DataTable";
import TableActions from "@/components/TablesActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { getCustomers } from "@/lib/mockData";
import { exportToCSV } from "@/lib/csvExport";

import type { Customer } from "@/../../shared/types";

const INITIAL_VISIBLE_ROWS = 50;

type CustomerFilters = {
  searchTerm: string;
  status: string;
  gender: string;
  enriched: string;
};

type CustomerModalType = "create" | "view" | "edit" | "delete" | null;

type CustomerForm = {
  name: string;
  gender: string;
  dateofbirth: string;
  status: string;
  isenriched: boolean;
};

const EMPTY_FILTERS: CustomerFilters = {
  searchTerm: "",
  status: "all",
  gender: "all",
  enriched: "all",
};

const EMPTY_FORM: CustomerForm = {
  name: "",
  gender: "",
  dateofbirth: "",
  status: "0",
  isenriched: false,
};

function CustomersSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-3">
          <div className="h-9 w-48 rounded-xl bg-muted animate-pulse" />
          <div className="h-5 w-96 max-w-full rounded-lg bg-muted animate-pulse" />
        </div>

        <div className="flex gap-2">
          <div className="h-10 w-32 rounded-lg bg-muted animate-pulse" />
          <div className="h-10 w-32 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-muted-foreground shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm">Carregando clientes com suavidade...</span>
      </div>
    </div>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [visibleRows, setVisibleRows] = useState(INITIAL_VISIBLE_ROWS);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] =
    useState<CustomerFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<CustomerFilters>(EMPTY_FILTERS);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [modalType, setModalType] = useState<CustomerModalType>(null);
  const [customerForm, setCustomerForm] = useState<CustomerForm>(EMPTY_FORM);

  useEffect(() => {
    let isMounted = true;

    async function loadCustomers() {
      try {
        console.group("[Customers] Carregamento de clientes");

        setLoading(true);
        setTableLoading(true);
        setErrorMessage("");

        const data = await getCustomers();

        console.info("[Customers] Dados recebidos:", data);

        if (!Array.isArray(data)) {
          throw new Error("getCustomers() não retornou uma lista.");
        }

        if (!isMounted) return;

        startTransition(() => {
          setCustomers(data);
          setVisibleRows(INITIAL_VISIBLE_ROWS);
        });
      } catch (error) {
        console.error("[Customers] Erro ao carregar clientes:", error);

        if (!isMounted) return;

        setErrorMessage("Não foi possível carregar os clientes do banco.");
      } finally {
        console.groupEnd();

        if (isMounted) {
          setLoading(false);

          window.setTimeout(() => {
            if (isMounted) setTableLoading(false);
          }, 250);
        }
      }
    }

    loadCustomers();

    return () => {
      isMounted = false;
    };
  }, []);

  const getCustomerStatus = (status?: number | null) => {
    const statusMap: Record<number, string> = {
      0: "Ativo",
      1: "Inativo",
      2: "Bloqueado",
    };

    return statusMap[Number(status)] || "Desconhecido";
  };

  const getStatusColor = (status?: number | null) => {
    switch (Number(status)) {
      case 0:
        return "bg-green-100 text-green-800";
      case 1:
        return "bg-yellow-100 text-yellow-800";
      case 2:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (value: unknown) => {
    if (!value) return "-";

    const date = new Date(String(value));

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("pt-BR");
  };

  const filteredCustomers = useMemo(() => {
    const search = appliedFilters.searchTerm.toLowerCase().trim();

    const result = customers.filter(customer => {
      const matchesSearch =
        !search ||
        String(customer.id ?? "").toLowerCase().includes(search) ||
        String(customer.name ?? "").toLowerCase().includes(search) ||
        String(customer.gender ?? "").toLowerCase().includes(search) ||
        getCustomerStatus(customer.status).toLowerCase().includes(search);

      const matchesStatus =
        appliedFilters.status === "all" ||
        String(customer.status) === appliedFilters.status;

      const matchesGender =
        appliedFilters.gender === "all" ||
        String(customer.gender) === appliedFilters.gender;

      const matchesEnriched =
        appliedFilters.enriched === "all" ||
        String(Boolean(customer.isenriched)) === appliedFilters.enriched;

      return matchesSearch && matchesStatus && matchesGender && matchesEnriched;
    });

    console.info("[Customers] Clientes filtrados:", result.length);

    return result;
  }, [customers, appliedFilters]);

  const totalCustomers = filteredCustomers.length;

  const activeCustomers = useMemo(() => {
    return filteredCustomers.filter(customer => Number(customer.status) === 0)
      .length;
  }, [filteredCustomers]);

  const enrichedCustomers = useMemo(() => {
    return filteredCustomers.filter(customer => Boolean(customer.isenriched))
      .length;
  }, [filteredCustomers]);

  const enrichmentRate = useMemo(() => {
    if (totalCustomers === 0) return 0;

    return (enrichedCustomers / totalCustomers) * 100;
  }, [enrichedCustomers, totalCustomers]);

  const visibleCustomers = useMemo(() => {
    return filteredCustomers.slice(0, visibleRows);
  }, [filteredCustomers, visibleRows]);

  const hasMoreRows = visibleRows < filteredCustomers.length;

  const activeFiltersCount = useMemo(() => {
    return Object.entries(appliedFilters).filter(([, value]) => {
      return value !== "" && value !== "all";
    }).length;
  }, [appliedFilters]);

  const handleLoadMore = () => {
    setTableLoading(true);

    window.setTimeout(() => {
      startTransition(() => {
        setVisibleRows(prev => prev + INITIAL_VISIBLE_ROWS);
      });

      setTableLoading(false);
    }, 200);
  };

  const handleExportCSV = () => {
    exportToCSV<Customer>(
      filteredCustomers,
      [
        { key: "id", label: "ID" },
        { key: "name", label: "Nome" },
        {
          key: "gender",
          label: "Gênero",
          format: value => {
            if (value === "M") return "Masculino";
            if (value === "F") return "Feminino";
            return "-";
          },
        },
        {
          key: "dateofbirth",
          label: "Data de Nascimento",
          format: value => formatDate(value),
        },
        {
          key: "status",
          label: "Status",
          format: value => getCustomerStatus(value as number | null),
        },
        {
          key: "isenriched",
          label: "Enriquecido",
          format: value => (value ? "Sim" : "Não"),
        },
        {
          key: "createdat",
          label: "Cadastrado em",
          format: value => formatDate(value),
        },
      ],
      "clientes"
    );
  };

  const openCreateModal = () => {
    console.info("[Customers] Abrindo cadastro de novo cliente.");

    setSelectedCustomer(null);
    setCustomerForm(EMPTY_FORM);
    setModalType("create");
  };

  const openViewModal = (customer: Customer) => {
    console.info("[Customers] Visualizar cliente:", customer);

    setSelectedCustomer(customer);
    setCustomerForm({
      name: String(customer.name ?? ""),
      gender: String(customer.gender ?? ""),
      dateofbirth: customer.dateofbirth
        ? String(customer.dateofbirth).slice(0, 10)
        : "",
      status: String(customer.status ?? "0"),
      isenriched: Boolean(customer.isenriched),
    });
    setModalType("view");
  };

  const openEditModal = (customer: Customer) => {
    console.info("[Customers] Editar cliente:", customer);

    setSelectedCustomer(customer);
    setCustomerForm({
      name: String(customer.name ?? ""),
      gender: String(customer.gender ?? ""),
      dateofbirth: customer.dateofbirth
        ? String(customer.dateofbirth).slice(0, 10)
        : "",
      status: String(customer.status ?? "0"),
      isenriched: Boolean(customer.isenriched),
    });
    setModalType("edit");
  };

  const openDeleteModal = (customer: Customer) => {
    console.warn("[Customers] Excluir cliente:", customer);

    setSelectedCustomer(customer);
    setModalType("delete");
  };

  const closeModal = () => {
    setSelectedCustomer(null);
    setCustomerForm(EMPTY_FORM);
    setModalType(null);
  };

  const handleCreateCustomer = () => {
    if (!customerForm.name.trim()) {
      console.error("[Customers] Nome obrigatório para cadastrar cliente.");
      return;
    }

    const newCustomer = {
      id: crypto.randomUUID(),
      name: customerForm.name.trim(),
      gender: customerForm.gender || null,
      dateofbirth: customerForm.dateofbirth || null,
      status: Number(customerForm.status),
      isenriched: customerForm.isenriched,
      createdat: new Date().toISOString(),
    } as Customer;

    console.info("[Customers] Novo cliente criado localmente:", newCustomer);

    setCustomers(prev => [newCustomer, ...prev]);
    setVisibleRows(INITIAL_VISIBLE_ROWS);
    closeModal();
  };

  const handleUpdateCustomer = () => {
    if (!selectedCustomer) return;

    if (!customerForm.name.trim()) {
      console.error("[Customers] Nome obrigatório para editar cliente.");
      return;
    }

    const updatedCustomer = {
      ...selectedCustomer,
      name: customerForm.name.trim(),
      gender: customerForm.gender || null,
      dateofbirth: customerForm.dateofbirth || null,
      status: Number(customerForm.status),
      isenriched: customerForm.isenriched,
    } as Customer;

    console.info("[Customers] Cliente atualizado localmente:", updatedCustomer);

    setCustomers(prev =>
      prev.map(customer =>
        customer.id === selectedCustomer.id ? updatedCustomer : customer
      )
    );

    closeModal();
  };

  const handleDeleteCustomer = () => {
    if (!selectedCustomer) return;

    console.warn("[Customers] Cliente removido localmente:", selectedCustomer);

    setCustomers(prev =>
      prev.filter(customer => customer.id !== selectedCustomer.id)
    );

    closeModal();
  };

  const handleOpenFilters = () => {
    setDraftFilters(appliedFilters);
    setFiltersOpen(true);
  };

  const handleApplyFilters = () => {
    console.info("[Customers] Aplicando filtros:", draftFilters);

    setAppliedFilters(draftFilters);
    setVisibleRows(INITIAL_VISIBLE_ROWS);
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    console.warn("[Customers] Limpando filtros.");

    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setVisibleRows(INITIAL_VISIBLE_ROWS);
    setFiltersOpen(false);
  };

  if (loading) {
    return <CustomersSkeleton />;
  }

  if (errorMessage) {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
        <p className="text-red-500">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie e visualize clientes reais carregados diretamente do banco
            de dados.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={handleOpenFilters}>
            <Filter className="w-4 h-4" />
            Filtrar
            {activeFiltersCount > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExportCSV}
            disabled={filteredCustomers.length === 0 || isPending}
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>

          <Button className="gap-2" onClick={openCreateModal}>
            <Plus className="w-4 h-4" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Filtrar clientes
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Os cards e a tabela serão atualizados após aplicar.
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
                  placeholder="Nome, ID, gênero ou status..."
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
                  <option value="0">Ativo</option>
                  <option value="1">Inativo</option>
                  <option value="2">Bloqueado</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Gênero</label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  value={draftFilters.gender}
                  onChange={event =>
                    setDraftFilters(prev => ({
                      ...prev,
                      gender: event.target.value,
                    }))
                  }
                >
                  <option value="all">Todos</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Enriquecido</label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  value={draftFilters.enriched}
                  onChange={event =>
                    setDraftFilters(prev => ({
                      ...prev,
                      enriched: event.target.value,
                    }))
                  }
                >
                  <option value="all">Todos</option>
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
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

      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {modalType === "create" && "Cadastrar novo cliente"}
                  {modalType === "view" && "Visualizar cliente"}
                  {modalType === "edit" && "Editar cliente"}
                  {modalType === "delete" && "Excluir cliente"}
                </h2>

                {selectedCustomer && (
                  <p className="mt-1 break-all text-sm text-muted-foreground">
                    ID: {selectedCustomer.id}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              {modalType === "delete" ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  Tem certeza que deseja excluir o cliente{" "}
                  <strong>{selectedCustomer?.name}</strong>?
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium">Nome</label>
                    <Input
                      value={customerForm.name}
                      disabled={modalType === "view"}
                      onChange={event =>
                        setCustomerForm(prev => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Nome do cliente"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Gênero</label>
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground disabled:opacity-60"
                      value={customerForm.gender}
                      disabled={modalType === "view"}
                      onChange={event =>
                        setCustomerForm(prev => ({
                          ...prev,
                          gender: event.target.value,
                        }))
                      }
                    >
                      <option value="">Não informado</option>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Data de nascimento
                    </label>
                    <Input
                      type="date"
                      value={customerForm.dateofbirth}
                      disabled={modalType === "view"}
                      onChange={event =>
                        setCustomerForm(prev => ({
                          ...prev,
                          dateofbirth: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground disabled:opacity-60"
                      value={customerForm.status}
                      disabled={modalType === "view"}
                      onChange={event =>
                        setCustomerForm(prev => ({
                          ...prev,
                          status: event.target.value,
                        }))
                      }
                    >
                      <option value="0">Ativo</option>
                      <option value="1">Inativo</option>
                      <option value="2">Bloqueado</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={customerForm.isenriched}
                      disabled={modalType === "view"}
                      onChange={event =>
                        setCustomerForm(prev => ({
                          ...prev,
                          isenriched: event.target.checked,
                        }))
                      }
                    />
                    Cliente enriquecido
                  </label>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border p-5 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={closeModal}>
                {modalType === "view" ? "Fechar" : "Cancelar"}
              </Button>

              {modalType === "create" && (
                <Button type="button" onClick={handleCreateCustomer}>
                  Cadastrar cliente
                </Button>
              )}

              {modalType === "edit" && (
                <Button type="button" onClick={handleUpdateCustomer}>
                  Salvar alterações
                </Button>
              )}

              {modalType === "delete" && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteCustomer}
                >
                  Confirmar exclusão
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
              Total de Clientes
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totalCustomers}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clientes Ativos
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {activeCustomers}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clientes Enriquecidos
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {enrichedCustomers}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Enriquecimento
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {enrichmentRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <DataTable<Customer>
          title={`Clientes exibindo ${visibleCustomers.length} de ${filteredCustomers.length}`}
          columns={[
            { key: "name", label: "Nome" },
            {
              key: "gender",
              label: "Gênero",
              render: value => {
                if (value === "M") return "Masculino";
                if (value === "F") return "Feminino";
                return "-";
              },
            },
            {
              key: "dateofbirth",
              label: "Data de Nascimento",
              render: value => formatDate(value),
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
                  {getCustomerStatus(Number(value))}
                </span>
              ),
            },
            {
              key: "isenriched",
              label: "Enriquecido",
              render: value =>
                value ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <X className="w-4 h-4 text-red-600" />
                ),
            },
            {
              key: "createdat",
              label: "Cadastrado em",
              render: value => formatDate(value),
            },
            {
              key: "id",
              label: "Ações",
              render: (_value, row) => (
                <TableActions<Customer>
                  item={row}
                  onView={openViewModal}
                  onEdit={openEditModal}
                  onDelete={openDeleteModal}
                />
              ),
            },
          ]}
          data={visibleCustomers}
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
              Carregar mais clientes
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}