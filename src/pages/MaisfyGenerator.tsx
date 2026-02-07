import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { useTranslation } from "react-i18next";

const MaisfyGenerator = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [productUrl, setProductUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!productUrl) {
      toast.error(t('maisfy.enterProductUrl'));
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      toast.success(t('maisfy.quizGenerated'));
      setIsGenerating(false);
      navigate('/create-quiz');
    }, 2000);
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back')}
            </Button>
            <LanguageSwitch />
          </div>
          <h1 className="text-2xl font-bold mt-2">Gerador Maisfy AI</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-accent/50 shadow-lg">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-accent" />
            </div>
            <CardTitle className="text-2xl text-accent">Crie Quiz com IA</CardTitle>
            <CardDescription>
              Insira a URL de um produto Maisfy e nossa IA criará automaticamente um quiz de conversão otimizado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="product-url">URL do Produto Maisfy</Label>
              <Input
                id="product-url"
                placeholder="https://maisfy.com/produto/..."
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Cole o link completo do produto na plataforma Maisfy
              </p>
            </div>

            <div className="bg-secondary/30 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">O que a IA vai gerar:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>✓ Perguntas personalizadas baseadas no produto</li>
                <li>✓ Resultados otimizados para conversão</li>
                <li>✓ Formulário de captura configurado</li>
                <li>✓ Design profissional aplicado</li>
              </ul>
            </div>

            <Button 
              className="w-full bg-accent hover:bg-accent/90" 
              size="lg"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                  Gerando Quiz...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Gerar Quiz com IA
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default MaisfyGenerator;
