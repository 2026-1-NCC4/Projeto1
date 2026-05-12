import { useEffect, useMemo, useState } from "react";
import { Plus, Copy, Filter, X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DataTable from "@/components/DataTable";
import TableActions from "@/components/TablesActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { getTemplates } from "@/lib/mockData";
import type { Template } from "@/../../shared/types";

type TemplateFilters = {
  searchTerm: string;
  createdBy: string;
};

type TemplateModalType = "create" | "view" | "edit" | "delete" | null;

type TemplateForm = {
  name: string;
  description: string;
  createdby: string;
};

const EMPTY_FILTERS: TemplateFilters = {
  searchTerm: "",
  createdBy: "all",
};

const EMPTY_FORM: TemplateForm = {
  name: "",
  description: "",
  createdby: "",
};

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] =
    useState<TemplateFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<TemplateFilters>(EMPTY_FILTERS);

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [modalType, setModalType] = useState<TemplateModalType>(null);
  const [templateForm, setTemplateForm] = useState<TemplateForm>(EMPTY_FORM);

  useEffect(() => {
    async function loadTemplates() {
      try {
        console.group("[Templates] Carregamento de templates");

        setLoading(true);
        setErrorMessage("");

        const data = await getTemplates();

        console.info("[Templates] Dados recebidos:", data);

        if (!Array.isArray(data)) {
          throw new Error("getTemplates() não retornou uma lista.");
        }

        setTemplates(data);
      } catch (error) {
        console.error("[Templates] Erro ao carregar templates:", error);
        setErrorMessage("Não foi possível carregar os templates do banco.");
      } finally {
        console.groupEnd();
        setLoading(false);
      }
    }

    loadTemplates();
  }, []);

  const formatDate = (value: unknown) => {
    if (!value) return "-";

    const date = new Date(String(value));

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("pt-BR");
  };

  const availableCreators = useMemo(() => {
    return Array.from(
      new Set(
        templates
          .map(template => template.createdby)
          .filter((createdBy): createdBy is string => Boolean(createdBy))
      )
    );
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    const search = appliedFilters.searchTerm.toLowerCase().trim();

    const result = templates.filter(template => {
      const matchesSearch =
        !search ||
        String(template.id ?? "").toLowerCase().includes(search) ||
        String(template.name ?? "").toLowerCase().includes(search) ||
        String(template.description ?? "").toLowerCase().includes(search) ||
        String(template.createdby ?? "").toLowerCase().includes(search);

      const matchesCreatedBy =
        appliedFilters.createdBy === "all" ||
        template.createdby === appliedFilters.createdBy;

      return matchesSearch && matchesCreatedBy;
    });

    console.info("[Templates] Templates filtrados:", result.length);

    return result;
  }, [templates, appliedFilters]);

  const activeFiltersCount = useMemo(() => {
    return Object.entries(appliedFilters).filter(([, value]) => {
      return value !== "" && value !== "all";
    }).length;
  }, [appliedFilters]);

  const openCreateModal = () => {
    console.info("[Templates] Abrindo cadastro de novo template.");

    setSelectedTemplate(null);
    setTemplateForm(EMPTY_FORM);
    setModalType("create");
  };

  const openViewModal = (template: Template) => {
    console.info("[Templates] Visualizar template:", template);

    setSelectedTemplate(template);
    setTemplateForm({
      name: String(template.name ?? ""),
      description: String(template.description ?? ""),
      createdby: String(template.createdby ?? ""),
    });
    setModalType("view");
  };

  const openEditModal = (template: Template) => {
    console.info("[Templates] Editar template:", template);

    setSelectedTemplate(template);
    setTemplateForm({
      name: String(template.name ?? ""),
      description: String(template.description ?? ""),
      createdby: String(template.createdby ?? ""),
    });
    setModalType("edit");
  };

  const openDeleteModal = (template: Template) => {
    console.warn("[Templates] Excluir template:", template);

    setSelectedTemplate(template);
    setModalType("delete");
  };

  const closeModal = () => {
    setSelectedTemplate(null);
    setTemplateForm(EMPTY_FORM);
    setModalType(null);
  };

  const handleCreateTemplate = () => {
    if (!templateForm.name.trim()) {
      console.error("[Templates] Nome obrigatório para cadastrar template.");
      return;
    }

    const newTemplate = {
      id: crypto.randomUUID(),
      name: templateForm.name.trim(),
      description: templateForm.description.trim(),
      createdby: templateForm.createdby.trim() || "Usuário atual",
      createdat: new Date().toISOString(),
    } as Template;

    console.info("[Templates] Novo template criado localmente:", newTemplate);

    setTemplates(prev => [newTemplate, ...prev]);
    closeModal();
  };

  const handleUpdateTemplate = () => {
    if (!selectedTemplate) return;

    if (!templateForm.name.trim()) {
      console.error("[Templates] Nome obrigatório para editar template.");
      return;
    }

    const updatedTemplate = {
      ...selectedTemplate,
      name: templateForm.name.trim(),
      description: templateForm.description.trim(),
      createdby: templateForm.createdby.trim() || selectedTemplate.createdby,
    } as Template;

    console.info("[Templates] Template atualizado localmente:", updatedTemplate);

    setTemplates(prev =>
      prev.map(template =>
        template.id === selectedTemplate.id ? updatedTemplate : template
      )
    );

    closeModal();
  };

  const handleDeleteTemplate = () => {
    if (!selectedTemplate) return;

    console.warn("[Templates] Template removido localmente:", selectedTemplate);

    setTemplates(prev =>
      prev.filter(template => template.id !== selectedTemplate.id)
    );

    closeModal();
  };

  const handleDuplicateTemplate = (template: Template) => {
    const duplicatedTemplate = {
      ...template,
      id: crypto.randomUUID(),
      name: `${template.name || "Template sem nome"} - Cópia`,
      createdat: new Date().toISOString(),
    } as Template;

    console.info("[Templates] Template duplicado localmente:", {
      original: template,
      copia: duplicatedTemplate,
    });

    setTemplates(prev => [duplicatedTemplate, ...prev]);
  };

  const handleOpenFilters = () => {
    setDraftFilters(appliedFilters);
    setFiltersOpen(true);
  };

  const handleApplyFilters = () => {
    console.info("[Templates] Aplicando filtros:", draftFilters);

    setAppliedFilters(draftFilters);
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    console.warn("[Templates] Limpando filtros.");

    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setFiltersOpen(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Templates</h1>
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-muted-foreground shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm">Carregando templates do banco...</span>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Templates</h1>
        <p className="text-red-500">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Templates</h1>
          <p className="text-muted-foreground mt-2">
            Crie e gerencie templates reais carregados diretamente do banco de
            dados.
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

          <Button className="gap-2" onClick={openCreateModal}>
            <Plus className="w-4 h-4" />
            Novo Template
          </Button>
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Filtrar templates
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
                  placeholder="Nome, descrição, ID ou criador..."
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
                <label className="text-sm font-medium">Criado por</label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  value={draftFilters.createdBy}
                  onChange={event =>
                    setDraftFilters(prev => ({
                      ...prev,
                      createdBy: event.target.value,
                    }))
                  }
                >
                  <option value="all">Todos</option>
                  {availableCreators.map(creator => (
                    <option key={creator} value={creator}>
                      {creator}
                    </option>
                  ))}
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
                  {modalType === "create" && "Cadastrar novo template"}
                  {modalType === "view" && "Visualizar template"}
                  {modalType === "edit" && "Editar template"}
                  {modalType === "delete" && "Excluir template"}
                </h2>

                {selectedTemplate && (
                  <p className="mt-1 break-all text-sm text-muted-foreground">
                    ID: {selectedTemplate.id}
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
                  Tem certeza que deseja excluir o template{" "}
                  <strong>{selectedTemplate?.name}</strong>?
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome</label>
                    <Input
                      value={templateForm.name}
                      disabled={modalType === "view"}
                      onChange={event =>
                        setTemplateForm(prev => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Nome do template"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Descrição</label>
                    <Input
                      value={templateForm.description}
                      disabled={modalType === "view"}
                      onChange={event =>
                        setTemplateForm(prev => ({
                          ...prev,
                          description: event.target.value,
                        }))
                      }
                      placeholder="Descrição do template"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Criado por</label>
                    <Input
                      value={templateForm.createdby}
                      disabled={modalType === "view"}
                      onChange={event =>
                        setTemplateForm(prev => ({
                          ...prev,
                          createdby: event.target.value,
                        }))
                      }
                      placeholder="Nome ou e-mail do criador"
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
                <Button type="button" onClick={handleCreateTemplate}>
                  Cadastrar template
                </Button>
              )}

              {modalType === "edit" && (
                <Button type="button" onClick={handleUpdateTemplate}>
                  Salvar alterações
                </Button>
              )}

              {modalType === "delete" && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteTemplate}
                >
                  Confirmar exclusão
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Templates
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {filteredTemplates.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Templates Ativos
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {filteredTemplates.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Uso Médio
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold text-foreground">-</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">
                {template.name || "Template sem nome"}
              </CardTitle>

              <p className="text-sm text-muted-foreground mt-2">
                {template.description || "Sem descrição"}
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="text-sm space-y-2">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Criado por:</span>
                  <span className="font-medium">
                    {template.createdby || "-"}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Data:</span>
                  <span className="font-medium">
                    {formatDate(template.createdat)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => handleDuplicateTemplate(template)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 hover:bg-secondary rounded transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span className="text-sm">Duplicar</span>
                </button>

                <button
                  type="button"
                  onClick={() => openEditModal(template)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 hover:bg-secondary rounded transition-colors"
                >
                  <span className="text-sm">Editar</span>
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DataTable<Template>
        title={`Detalhes dos Templates exibindo ${filteredTemplates.length}`}
        columns={[
          { key: "name", label: "Nome" },
          { key: "description", label: "Descrição" },
          {
            key: "createdat",
            label: "Criado em",
            render: value => formatDate(value),
          },
          { key: "createdby", label: "Criado por" },
          {
            key: "id",
            label: "Ações",
            render: (_value, row) => (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDuplicateTemplate(row)}
                  className="rounded p-1 transition-colors hover:bg-secondary"
                  title="Duplicar"
                >
                  <Copy className="h-4 w-4 text-muted-foreground" />
                </button>

                <TableActions<Template>
                  item={row}
                  onView={openViewModal}
                  onEdit={openEditModal}
                  onDelete={openDeleteModal}
                />
              </div>
            ),
          },
        ]}
        data={filteredTemplates}
      />
    </div>
  );
}