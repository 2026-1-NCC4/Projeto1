import { useEffect, useMemo, useState, useTransition } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import DataTable from '@/components/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { getStores } from '@/lib/mockData';
import type { Store } from '@/../../shared/types';

const INITIAL_VISIBLE_ROWS = 50;

function StoresSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-3">
          <div className="h-9 w-40 rounded-xl bg-muted animate-pulse" />
          <div className="h-5 w-96 max-w-full rounded-lg bg-muted animate-pulse" />
        </div>

        <div className="h-10 w-32 rounded-lg bg-muted animate-pulse" />
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-muted-foreground shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm">Carregando lojas com suavidade...</span>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            </CardHeader>

            <CardContent>
              <div className="h-8 w-20 rounded bg-muted animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="h-5 w-44 rounded bg-muted animate-pulse" />
              <div className="mt-3 h-4 w-52 rounded bg-muted animate-pulse" />
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="h-4 w-full rounded bg-muted animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
              <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function Stores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [visibleRows, setVisibleRows] = useState(INITIAL_VISIBLE_ROWS);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;

    async function loadStores() {
      try {
        setLoading(true);
        setListLoading(true);
        setErrorMessage('');

        const data = await getStores();

        if (!isMounted) return;

        startTransition(() => {
          setStores(data);
          setVisibleRows(INITIAL_VISIBLE_ROWS);
        });
      } catch (error) {
        console.error(error);

        if (!isMounted) return;

        setErrorMessage('Não foi possível carregar as lojas do banco.');
      } finally {
        if (isMounted) {
          setLoading(false);

          window.setTimeout(() => {
            if (isMounted) {
              setListLoading(false);
            }
          }, 250);
        }
      }
    }

    loadStores();

    return () => {
      isMounted = false;
    };
  }, []);

  const getStoreStatus = (status?: number | null) => {
    const statusMap: Record<number, string> = {
      0: 'Ativa',
      1: 'Inativa',
    };

    return statusMap[Number(status)] || 'Desconhecido';
  };

  const getStatusColor = (status?: number | null) => {
    switch (Number(status)) {
      case 0:
        return 'bg-green-100 text-green-800';
      case 1:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const activeStores = useMemo(() => {
    return stores.filter((store) => Number(store.status) === 0).length;
  }, [stores]);

  const activityRate = useMemo(() => {
    if (stores.length === 0) return 0;

    return (activeStores / stores.length) * 100;
  }, [activeStores, stores.length]);

  const visibleStores = useMemo(() => {
    return stores.slice(0, visibleRows);
  }, [stores, visibleRows]);

  const hasMoreRows = visibleRows < stores.length;

  const handleLoadMore = () => {
    setListLoading(true);

    window.setTimeout(() => {
      startTransition(() => {
        setVisibleRows((prev) => prev + INITIAL_VISIBLE_ROWS);
      });

      setListLoading(false);
    }, 200);
  };

  if (loading) {
    return <StoresSkeleton />;
  }

  if (errorMessage) {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <h1 className="text-3xl font-bold text-foreground">Lojas</h1>
        <p className="text-red-500">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lojas</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie lojas reais carregadas diretamente do banco de dados.
          </p>
        </div>

        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Loja
        </Button>
      </div>

      {(listLoading || isPending) && (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-muted-foreground shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm">Preparando dados das lojas...</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Lojas
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stores.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lojas Ativas
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {activeStores}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Atividade
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {activityRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Exibindo {visibleStores.length} de {stores.length} lojas.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleStores.map((store) => (
            <Card
              key={store.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {store.name || 'Loja sem nome'}
                    </CardTitle>

                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span className="truncate">
                        {store.neighborhood || '-'}, {store.city || '-'}
                      </span>
                    </p>
                  </div>

                  <span
                    className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getStatusColor(
                      store.status
                    )}`}
                  >
                    {getStoreStatus(store.status)}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Estado:</span>
                    <span className="font-medium">{store.state || '-'}</span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">CEP:</span>
                    <span className="font-medium">{store.zipcode || '-'}</span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Criada em:</span>
                    <span className="font-medium">
                      {store.createdat
                        ? new Date(store.createdat).toLocaleDateString('pt-BR')
                        : '-'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-border">
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 hover:bg-secondary rounded transition-colors">
                    <Edit className="w-4 h-4" />
                    <span className="text-sm">Editar</span>
                  </button>

                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 hover:bg-red-50 rounded transition-colors">
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-600">Deletar</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <DataTable
          title={`Detalhes das Lojas exibindo ${visibleStores.length} de ${stores.length}`}
          columns={[
            { key: 'name', label: 'Nome' },
            { key: 'neighborhood', label: 'Bairro' },
            { key: 'city', label: 'Cidade' },
            { key: 'state', label: 'Estado' },
            { key: 'zipcode', label: 'CEP' },
            {
              key: 'status',
              label: 'Status',
              render: (value) => (
                <span
                  className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(
                    value
                  )}`}
                >
                  {getStoreStatus(value)}
                </span>
              ),
            },
            {
              key: 'createdat',
              label: 'Criada em',
              render: (value) =>
                value ? new Date(value).toLocaleDateString('pt-BR') : '-',
            },
            {
              key: 'id',
              label: 'Ações',
              render: () => (
                <div className="flex gap-2">
                  <button className="p-1 hover:bg-secondary rounded transition-colors">
                    <Edit className="w-4 h-4 text-muted-foreground" />
                  </button>

                  <button className="p-1 hover:bg-secondary rounded transition-colors">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              ),
            },
          ]}
          data={visibleStores}
        />

        {hasMoreRows && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={listLoading || isPending}
              className="gap-2"
            >
              {(listLoading || isPending) && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Carregar mais lojas
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}