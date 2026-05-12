import { ReactNode } from 'react';
import { Filter, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface FilterModalProps {
  open: boolean;
  title?: string;
  onOpenChange: (open: boolean) => void;
  onApply: () => void;
  onClear: () => void;
  children: ReactNode;
}

export default function FilterModal({
  open,
  title = 'Filtros',
  onOpenChange,
  onApply,
  onClear,
  children,
}: FilterModalProps) {
  return (
    <>
      <Button type="button" className="gap-2" onClick={() => onOpenChange(true)}>
        <Filter className="h-4 w-4" />
        Filtrar
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border p-5">
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-lg p-2 hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
              {children}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border p-5 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={onClear}>
                Limpar
              </Button>

              <Button type="button" onClick={onApply}>
                Aplicar filtros
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}