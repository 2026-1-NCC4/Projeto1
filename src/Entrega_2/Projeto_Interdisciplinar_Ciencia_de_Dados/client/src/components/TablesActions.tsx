// client/src/components/TablesActions.tsx
import { Eye, Edit, Trash2 } from "lucide-react";

interface TableActionsProps<T> {
  item: T;
  onView?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  showView?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
}

export default function TableActions<T>({
  item,
  onView,
  onEdit,
  onDelete,
  showView = true,
  showEdit = true,
  showDelete = true,
}: TableActionsProps<T>) {
  return (
    <div className="relative z-10 flex items-center gap-2">
      {showView && (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onView?.(item);
          }}
          className="relative z-20 rounded p-1 transition-colors hover:bg-secondary"
          title="Visualizar"
        >
          <Eye className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      {showEdit && (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onEdit?.(item);
          }}
          className="relative z-20 rounded p-1 transition-colors hover:bg-secondary"
          title="Editar"
        >
          <Edit className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      {showDelete && (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onDelete?.(item);
          }}
          className="relative z-20 rounded p-1 transition-colors hover:bg-red-100"
          title="Excluir"
        >
          <Trash2 className="h-4 w-4 text-red-600" />
        </button>
      )}
    </div>
  );
}