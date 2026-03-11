import { Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

export const GuaranteeBanner = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-3xl mx-auto mb-10">
      <div className="flex items-center justify-center gap-4 bg-primary/5 border border-primary/20 rounded-2xl px-6 py-4">
        <Shield className="h-10 w-10 text-primary flex-shrink-0" />
        <div className="text-center sm:text-left">
          <p className="text-lg font-bold text-foreground">
            Garantia incondicional de 15 dias
          </p>
          <p className="text-sm text-muted-foreground">
            Se não gostar, devolvemos 100% do seu dinheiro. Sem perguntas, sem burocracia.
          </p>
        </div>
      </div>
    </div>
  );
};
