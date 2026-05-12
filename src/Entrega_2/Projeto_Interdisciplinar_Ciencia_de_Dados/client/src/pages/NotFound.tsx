import { Link } from 'wouter';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 px-4">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <p className="text-2xl font-semibold text-muted-foreground">
            Página não encontrada
          </p>
        </div>
        <p className="text-muted-foreground max-w-md mx-auto">
          Desculpe, a página que você está procurando não existe ou foi removida.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link href="/">
            <Button className="gap-2">
              <Home className="w-4 h-4" />
              Ir para Home
            </Button>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
