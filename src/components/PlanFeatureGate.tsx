import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PlanFeatureGateProps {
  featureName: string;
  featureDescription: string;
  children: React.ReactNode;
  isAllowed: boolean;
  isLoading?: boolean;
}

/**
 * Componente que bloqueia acesso a features baseado no plano do usuário.
 * Mostra o conteúdo original se permitido, ou um card de upgrade se não.
 */
export const PlanFeatureGate = ({
  featureName,
  featureDescription,
  children,
  isAllowed,
  isLoading = false,
}: PlanFeatureGateProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="py-12 text-center">
          <div className="h-12 w-12 mx-auto mb-4 bg-muted rounded-full" />
          <div className="h-4 w-48 mx-auto bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (isAllowed) {
    return <>{children}</>;
  }

  return (
    <Card className="border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="py-12 text-center space-y-4">
        <div className="relative inline-block">
          <div className="p-4 rounded-full bg-primary/10">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1" />
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">{featureName}</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {featureDescription}
          </p>
        </div>

        <Button 
          onClick={() => navigate('/precos')} 
          className="mt-4"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Fazer Upgrade
        </Button>
        
        <p className="text-xs text-muted-foreground">
          Disponível nos planos Partner e Premium
        </p>
      </CardContent>
    </Card>
  );
};
