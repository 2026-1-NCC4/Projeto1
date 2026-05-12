// client/src/components/DataTable.tsx
import type { ReactNode } from "react";

export type DataTableColumn<T> = {
  key: keyof T | string;
  label: string;
  render?: (value: unknown, row: T, rowIndex: number) => ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  title?: string;
  columns: DataTableColumn<T>[];
  data: T[];
};

export default function DataTable<T>({ title, columns, data }: DataTableProps<T>) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      {title && (
        <div className="border-b border-border p-4">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className="px-4 py-3 text-left font-medium text-muted-foreground"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.length > 0 ? (
              data.map((row, rowIndex) => {
                const rowId = (row as { id?: string | number }).id ?? rowIndex;

                return (
                  <tr
                    key={String(rowId)}
                    className="border-t border-border transition-colors hover:bg-muted/30"
                  >
                    {columns.map((column) => {
                      const value = (row as Record<string, unknown>)[
                        String(column.key)
                      ];

                      return (
                        <td
                          key={`${String(column.key)}-${String(rowId)}`}
                          className={`relative px-4 py-3 text-foreground ${column.className ?? ""}`}
                        >
                          {column.render
                            ? column.render(value, row, rowIndex)
                            : String(value ?? "-")}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}