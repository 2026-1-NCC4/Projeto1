import { useEffect, useMemo, useState, useTransition } from "react";
import { Plus, Download, Loader2, Filter, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DataTable from "@/components/DataTable";
import TableActions from "@/components/TablesActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { getCampaigns } from "@/lib/mockData";
import { exportToCSV } from "@/lib/csvExport";

import type { Campaign } from "@/../../shared/types";

const INITIAL_VISIBLE_ROWS = 50;

type CampaignFilters = {
  searchTerm: string;
  type: string;
  status: string;
};

type CampaignModalType = "create" | "view" | "edit" | "delete" | null;

type CampaignForm = {
  name: string;
  description: string;
  type: string;
  statusend: string;
  sendat: string;
};

const EMPTY_FILTERS: CampaignFilters = {
  searchTerm: "",
  type: "all",
  status: "all",
};

const EMPTY_FORM: CampaignForm = {
  name: "",
  description: "",
  type: "0",
  statusend: "0",
  sendat: "",
};

function CampaignsSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-3">
          <div className="h-9 w-56 rounded-xl bg-muted animate-pulse" />
          <div className="h-5 w-96 max-w-full rounded-lg bg-muted animate-pulse" />
        </div>

        <div className="flex gap-2">
          <div className="h-10 w-32 rounded-lg bg-muted animate-pulse" />
          <div className="h-10 w-36 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-muted-foreground shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm">Carregando campanhas com suavidade...</span>
      </div>
    </div>
  );
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [visibleRows, setVisibleRows] = useState(INITIAL_VISIBLE_ROWS);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] =
    useState<CampaignFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<CampaignFilters>(EMPTY_FILTERS);

  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  );
  const [modalType, setModalType] = useState<CampaignModalType>(null);
  const [campaignForm, setCampaignForm] = useState<CampaignForm>(EMPTY_FORM);

  useEffect(() => {
    let isMounted = true;

    async function loadCampaigns() {
      try {
        console.group("[Campaigns] Carregamento de campanhas");

        setLoading(true);
        setTableLoading(true);
        setErrorMessage("");

        const data = await getCampaigns();

        console.info("[Campaigns] Dados recebidos:", data);

        if (!Array.isArray(data)) {
          throw new Error("getCampaigns() não retornou uma lista.");
        }

        if (!isMounted) return;

        startTransition(() => {
          setCampaigns(data);
          setVisibleRows(INITIAL_VISIBLE_ROWS);
        });
      } catch (error) {
        console.error("[Campaigns] Erro ao carregar campanhas:", error);

        if (!isMounted) return;

        setErrorMessage("Não foi possível carregar as campanhas do banco.");
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

    loadCampaigns();

    return () => {
      isMounted = false;
    };
  }, []);

  const getCampaignType = (type?: number | null) => {
    const typeMap: Record<number, string> = {
      0: "Email",
      1: "SMS",
      2: "Push",
    };

    return typeMap[Number(type)] || "Desconhecido";
  };

  const getCampaignStatus = (status?: number | null) => {
    const statusMap: Record<number, string> = {
      0: "Rascunho",
      1: "Agendada",
      2: "Enviada",
      3: "Pausada",
      4: "Cancelada",
    };

    return statusMap[Number(status)] || "Desconhecido";
  };

  const getStatusColor = (status?: number | null) => {
    switch (Number(status)) {
      case 0:
        return "bg-gray-100 text-gray-800";
      case 1:
        return "bg-blue-100 text-blue-800";
      case 2:
        return "bg-green-100 text-green-800";
      case 3:
        return "bg-yellow-100 text-yellow-800";
      case 4:
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

  const filteredCampaigns = useMemo(() => {
    const search = appliedFilters.searchTerm.toLowerCase().trim();

    const result = campaigns.filter(campaign => {
      const matchesSearch =
        !search ||
        String(campaign.id ?? "").toLowerCase().includes(search) ||
        String(campaign.name ?? "").toLowerCase().includes(search) ||
        String(campaign.description ?? "").toLowerCase().includes(search) ||
        getCampaignType(campaign.type).toLowerCase().includes(search) ||
        getCampaignStatus(campaign.statusend).toLowerCase().includes(search);

      const matchesType =
        appliedFilters.type === "all" ||
        String(campaign.type) === appliedFilters.type;

      const matchesStatus =
        appliedFilters.status === "all" ||
        String(campaign.statusend) === appliedFilters.status;

      return matchesSearch && matchesType && matchesStatus;
    });

    console.info("[Campaigns] Campanhas filtradas:", result.length);

    return result;
  }, [campaigns, appliedFilters]);

  const activeCampaigns = useMemo(() => {
    return filteredCampaigns.filter(
      campaign =>
        Number(campaign.statusend) === 1 || Number(campaign.statusend) === 2
    ).length;
  }, [filteredCampaigns]);

  const successRate = useMemo(() => {
    if (filteredCampaigns.length === 0) return 0;

    const sentCampaigns = filteredCampaigns.filter(
      campaign => Number(campaign.statusend) === 2
    ).length;

    return (sentCampaigns / filteredCampaigns.length) * 100;
  }, [filteredCampaigns]);

  const visibleCampaigns = useMemo(() => {
    return filteredCampaigns.slice(0, visibleRows);
  }, [filteredCampaigns, visibleRows]);

  const hasMoreRows = visibleRows < filteredCampaigns.length;

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
    exportToCSV<Campaign>(
      filteredCampaigns,
      [
        { key: "id", label: "ID" },
        { key: "name", label: "Nome" },
        { key: "description", label: "Descrição" },
        {
          key: "type",
          label: "Tipo",
          format: value => getCampaignType(value as number | null),
        },
        {
          key: "statusend",
          label: "Status",
          format: value => getCampaignStatus(value as number | null),
        },
        {
          key: "createdat",
          label: "Criada em",
          format: value => formatDate(value),
        },
        {
          key: "sendat",
          label: "Enviada em",
          format: value => formatDate(value),
        },
      ],
      "campanhas"
    );
  };

  const openCreateModal = () => {
    console.info("[Campaigns] Abrindo cadastro de nova campanha.");

    setSelectedCampaign(null);
    setCampaignForm(EMPTY_FORM);
    setModalType("create");
  };

  const openViewModal = (campaign: Campaign) => {
    console.info("[Campaigns] Visualizar campanha:", campaign);

    setSelectedCampaign(campaign);
    setCampaignForm({
      name: String(campaign.name ?? ""),
      description: String(campaign.description ?? ""),
      type: String(campaign.type ?? "0"),
      statusend: String(campaign.statusend ?? "0"),
      sendat: campaign.sendat ? String(campaign.sendat).slice(0, 10) : "",
    });
    setModalType("view");
  };

  const openEditModal = (campaign: Campaign) => {
    console.info("[Campaigns] Editar campanha:", campaign);

    setSelectedCampaign(campaign);
    setCampaignForm({
      name: String(campaign.name ?? ""),
      description: String(campaign.description ?? ""),
      type: String(campaign.type ?? "0"),
      statusend: String(campaign.statusend ?? "0"),
      sendat: campaign.sendat ? String(campaign.sendat).slice(0, 10) : "",
    });
    setModalType("edit");
  };

  const openDeleteModal = (campaign: Campaign) => {
    console.warn("[Campaigns] Excluir campanha:", campaign);

    setSelectedCampaign(campaign);
    setModalType("delete");
  };

  const closeModal = () => {
    setSelectedCampaign(null);
    setCampaignForm(EMPTY_FORM);
    setModalType(null);
  };

  const handleCreateCampaign = () => {
    if (!campaignForm.name.trim()) {
      console.error("[Campaigns] Nome obrigatório para cadastrar campanha.");
      return;
    }

    const newCampaign = {
      id: crypto.randomUUID(),
      name: campaignForm.name.trim(),
      description: campaignForm.description.trim(),
      type: Number(campaignForm.type),
      statusend: Number(campaignForm.statusend),
      sendat: campaignForm.sendat || null,
      createdat: new Date().toISOString(),
    } as Campaign;

    console.info("[Campaigns] Nova campanha criada localmente:", newCampaign);

    setCampaigns(prev => [newCampaign, ...prev]);
    setVisibleRows(INITIAL_VISIBLE_ROWS);
    closeModal();
  };

  const handleUpdateCampaign = () => {
    if (!selectedCampaign) return;

    if (!campaignForm.name.trim()) {
      console.error("[Campaigns] Nome obrigatório para editar campanha.");
      return;
    }

    const updatedCampaign = {
      ...selectedCampaign,
      name: campaignForm.name.trim(),
      description: campaignForm.description.trim(),
      type: Number(campaignForm.type),
      statusend: Number(campaignForm.statusend),
      sendat: campaignForm.sendat || null,
    } as Campaign;

    console.info(
      "[Campaigns] Campanha atualizada localmente:",
      updatedCampaign
    );

    setCampaigns(prev =>
      prev.map(campaign =>
        campaign.id === selectedCampaign.id ? updatedCampaign : campaign
      )
    );

    closeModal();
  };

  const handleDeleteCampaign = () => {
    if (!selectedCampaign) return;

    console.warn("[Campaigns] Campanha removida localmente:", selectedCampaign);

    setCampaigns(prev =>
      prev.filter(campaign => campaign.id !== selectedCampaign.id)
    );

    closeModal();
  };

  const handleOpenFilters = () => {
    setDraftFilters(appliedFilters);
    setFiltersOpen(true);
  };

  const handleApplyFilters = () => {
    console.info("[Campaigns] Aplicando filtros:", draftFilters);

    setAppliedFilters(draftFilters);
    setVisibleRows(INITIAL_VISIBLE_ROWS);
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    console.warn("[Campaigns] Limpando filtros.");

    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setVisibleRows(INITIAL_VISIBLE_ROWS);
    setFiltersOpen(false);
  };

  if (loading) {
    return <CampaignsSkeleton />;
  }

  if (errorMessage) {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <h1 className="text-3xl font-bold text-foreground">Campanhas</h1>
        <p className="text-red-500">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campanhas</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie campanhas reais carregadas diretamente do banco de dados.
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
            disabled={filteredCampaigns.length === 0 || isPending}
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>

          <Button className="gap-2" onClick={openCreateModal}>
            <Plus className="w-4 h-4" />
            Nova Campanha
          </Button>
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Filtrar campanhas
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
                  placeholder="Nome, descrição, tipo ou status..."
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
                <label className="text-sm font-medium">Tipo</label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  value={draftFilters.type}
                  onChange={event =>
                    setDraftFilters(prev => ({
                      ...prev,
                      type: event.target.value,
                    }))
                  }
                >
                  <option value="all">Todos</option>
                  <option value="0">Email</option>
                  <option value="1">SMS</option>
                  <option value="2">Push</option>
                </select>
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
                  <option value="0">Rascunho</option>
                  <option value="1">Agendada</option>
                  <option value="2">Enviada</option>
                  <option value="3">Pausada</option>
                  <option value="4">Cancelada</option>
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
                  {modalType === "create" && "Cadastrar nova campanha"}
                  {modalType === "view" && "Visualizar campanha"}
                  {modalType === "edit" && "Editar campanha"}
                  {modalType === "delete" && "Excluir campanha"}
                </h2>

                {selectedCampaign && (
                  <p className="mt-1 break-all text-sm text-muted-foreground">
                    ID: {selectedCampaign.id}
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
                  Tem certeza que deseja excluir a campanha{" "}
                  <strong>{selectedCampaign?.name}</strong>?
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium">Nome</label>
                    <Input
                      value={campaignForm.name}
                      disabled={modalType === "view"}
                      onChange={event =>
                        setCampaignForm(prev => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Nome da campanha"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium">Descrição</label>
                    <Input
                      value={campaignForm.description}
                      disabled={modalType === "view"}
                      onChange={event =>
                        setCampaignForm(prev => ({
                          ...prev,
                          description: event.target.value,
                        }))
                      }
                      placeholder="Descrição da campanha"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo</label>
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground disabled:opacity-60"
                      value={campaignForm.type}
                      disabled={modalType === "view"}
                      onChange={event =>
                        setCampaignForm(prev => ({
                          ...prev,
                          type: event.target.value,
                        }))
                      }
                    >
                      <option value="0">Email</option>
                      <option value="1">SMS</option>
                      <option value="2">Push</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground disabled:opacity-60"
                      value={campaignForm.statusend}
                      disabled={modalType === "view"}
                      onChange={event =>
                        setCampaignForm(prev => ({
                          ...prev,
                          statusend: event.target.value,
                        }))
                      }
                    >
                      <option value="0">Rascunho</option>
                      <option value="1">Agendada</option>
                      <option value="2">Enviada</option>
                      <option value="3">Pausada</option>
                      <option value="4">Cancelada</option>
                    </select>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium">
                      Data de envio
                    </label>
                    <Input
                      type="date"
                      value={campaignForm.sendat}
                      disabled={modalType === "view"}
                      onChange={event =>
                        setCampaignForm(prev => ({
                          ...prev,
                          sendat: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border p-5 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={closeModal}>
                {modalType === "view" ? "Fechar" : "Cancelar"}
              </Button>

              {modalType === "create" && (
                <Button type="button" onClick={handleCreateCampaign}>
                  Cadastrar campanha
                </Button>
              )}

              {modalType === "edit" && (
                <Button type="button" onClick={handleUpdateCampaign}>
                  Salvar alterações
                </Button>
              )}

              {modalType === "delete" && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteCampaign}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Campanhas
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {filteredCampaigns.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Campanhas Ativas
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {activeCampaigns}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Sucesso
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {successRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <DataTable<Campaign>
          title={`Campanhas exibindo ${visibleCampaigns.length} de ${filteredCampaigns.length}`}
          columns={[
            { key: "name", label: "Nome" },
            {
              key: "type",
              label: "Tipo",
              render: value => (
                <span className="px-2 py-1 bg-secondary rounded text-sm">
                  {getCampaignType(Number(value))}
                </span>
              ),
            },
            {
              key: "statusend",
              label: "Status",
              render: value => (
                <span
                  className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(
                    Number(value)
                  )}`}
                >
                  {getCampaignStatus(Number(value))}
                </span>
              ),
            },
            {
              key: "createdat",
              label: "Criada em",
              render: value => formatDate(value),
            },
            {
              key: "sendat",
              label: "Enviada em",
              render: value => formatDate(value),
            },
            {
              key: "id",
              label: "Ações",
              render: (_value, row) => (
                <TableActions<Campaign>
                  item={row}
                  onView={openViewModal}
                  onEdit={openEditModal}
                  onDelete={openDeleteModal}
                />
              ),
            },
          ]}
          data={visibleCampaigns}
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
              Carregar mais campanhas
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}