import { ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  description?: string;
}

export default function MetricCard({
  title,
  value,
  change,
  icon,
  description,
}: MetricCardProps) {
  const isPositive = typeof change === 'number' && change > 0;
  const isNegative = typeof change === 'number' && change < 0;

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 min-w-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground truncate">
          {title}
        </CardTitle>

        {icon && <div className="text-muted-foreground shrink-0">{icon}</div>}
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-2 min-w-0">
          <div className="text-xl sm:text-2xl font-bold text-foreground truncate">
            {value}
          </div>

          {change !== undefined && (
            <div className="flex items-center gap-1 min-w-0">
              {isPositive ? (
                <ArrowUp className="w-4 h-4 text-green-600 shrink-0" />
              ) : isNegative ? (
                <ArrowDown className="w-4 h-4 text-red-600 shrink-0" />
              ) : null}

              <span
                className={`text-xs font-medium truncate ${
                  isPositive
                    ? 'text-green-600'
                    : isNegative
                      ? 'text-red-600'
                      : 'text-muted-foreground'
                }`}
              >
                {isPositive ? '+' : ''}
                {change}% vs mês anterior
              </span>
            </div>
          )}

          {description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}