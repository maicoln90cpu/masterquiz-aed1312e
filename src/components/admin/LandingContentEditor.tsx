import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLandingContentAdmin } from "@/hooks/useLandingContent";
import { toast } from "sonner";
import { Save, Loader2, Globe, RefreshCw, Eye, EyeOff, CheckCircle, ArrowRight, Play } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Hero preview component
const HeroPreview = ({ getPreviewValue }: { getPreviewValue: (key: string) => string }) => {
  return (
    <div className="border rounded-lg p-4 bg-gradient-to-b from-primary/5 via-background to-background mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Preview da Hero Section</span>
      </div>
      
      <div className="space-y-4 text-sm">
        {/* Badge */}
        <div className="flex items-start gap-2">
          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
            hero_badge
          </Badge>
          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
            ✨ {getPreviewValue('hero_badge') || 'Badge...'}
          </Badge>
        </div>

        {/* Headline Main */}
        <div className="flex items-start gap-2">
          <Badge variant="outline" className="text-xs shrink-0">hero_headline_main</Badge>
          <h2 className="text-lg font-bold text-foreground">
            {getPreviewValue('hero_headline_main') || 'Título principal...'}
          </h2>
        </div>

        {/* Headline Sub */}
        <div className="flex items-start gap-2">
          <Badge variant="outline" className="text-xs shrink-0">hero_headline_sub</Badge>
          <p className="text-base font-semibold text-primary">
            {getPreviewValue('hero_headline_sub') || 'Subtítulo...'}
          </p>
        </div>

        {/* Subheadline */}
        <div className="flex items-start gap-2">
          <Badge variant="outline" className="text-xs shrink-0">hero_subheadline</Badge>
          <p className="text-muted-foreground text-sm">
            {getPreviewValue('hero_subheadline') || 'Descrição...'}
          </p>
        </div>

        {/* Bullets */}
        <div className="space-y-2 border-l-2 border-primary/20 pl-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-2">
              <Badge variant="outline" className="text-xs shrink-0">hero_bullet_{i}</Badge>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-primary shrink-0" />
                <span className="text-xs">{getPreviewValue(`hero_bullet_${i}`) || `Bullet ${i}...`}</span>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">hero_cta_primary</Badge>
          <Button size="sm" className="text-xs h-7">
            {getPreviewValue('hero_cta_primary') || 'CTA Primário'} <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
          
          <Badge variant="outline" className="text-xs">hero_cta_secondary</Badge>
          <Button size="sm" variant="outline" className="text-xs h-7">
            <Play className="h-3 w-3 mr-1" /> {getPreviewValue('hero_cta_secondary') || 'CTA Secundário'}
          </Button>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">hero_trust_1</Badge>
          <span>🔒 {getPreviewValue('hero_trust_1') || 'Trust 1'}</span>
          <span>•</span>
          <Badge variant="outline" className="text-xs">hero_trust_2</Badge>
          <span>{getPreviewValue('hero_trust_2') || 'Trust 2'}</span>
          <span>•</span>
          <Badge variant="outline" className="text-xs">hero_trust_3</Badge>
          <span>{getPreviewValue('hero_trust_3') || 'Trust 3'}</span>
        </div>
      </div>
    </div>
  );
};

export const LandingContentEditor = () => {
  const { contentByCategory, allContent, isLoading, updateContent } = useLandingContentAdmin();
  const [editedValues, setEditedValues] = useState<Record<string, { pt?: string; en?: string; es?: string }>>({});
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(true);
  const [selectedLang, setSelectedLang] = useState<'pt' | 'en' | 'es'>('pt');

  const handleChange = (id: string, lang: 'pt' | 'en' | 'es', value: string) => {
    setEditedValues(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [lang]: value
      }
    }));
  };

  const handleSave = async (id: string, currentValues: { pt: string | null; en: string | null; es: string | null }) => {
    const edited = editedValues[id];
    if (!edited) return;

    setSavingIds(prev => new Set(prev).add(id));

    try {
      await updateContent.mutateAsync({
        id,
        value_pt: edited.pt !== undefined ? edited.pt : (currentValues.pt || undefined),
        value_en: edited.en !== undefined ? edited.en : (currentValues.en || undefined),
        value_es: edited.es !== undefined ? edited.es : (currentValues.es || undefined),
      });

      // Clear edited values for this id
      setEditedValues(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });

      toast.success("Conteúdo atualizado!");
    } catch (error) {
      toast.error("Erro ao salvar conteúdo");
    } finally {
      setSavingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const hasChanges = (id: string) => {
    return editedValues[id] !== undefined;
  };

  // Get preview value for a key (shows edited or current value)
  const getPreviewValue = (key: string): string => {
    const item = allContent?.find(c => c.key === key);
    if (!item) return '';
    
    const edited = editedValues[item.id];
    const langField = `value_${selectedLang}` as const;
    
    if (edited?.[selectedLang] !== undefined) {
      return edited[selectedLang] || '';
    }
    
    return item[langField] || item.value_pt || '';
  };

  const categoryLabels: Record<string, string> = {
    hero: "🎯 Hero Section",
    features: "✨ Features",
    pricing: "💰 Preços",
    cta: "🔘 Call to Actions",
    footer: "📄 Footer",
    general: "⚙️ Geral",
  };

  const categoryDescriptions: Record<string, string> = {
    hero: "Primeira seção da landing - título, subtítulo, bullets e CTAs principais",
    features: "Seção de funcionalidades e benefícios",
    pricing: "Textos relacionados a preços e planos",
    cta: "Botões e chamadas para ação",
    footer: "Rodapé da página",
    general: "Outros textos gerais",
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const categories = Object.keys(contentByCategory);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Editor de Conteúdo da Landing Page
            </CardTitle>
            <CardDescription>
              Edite os textos da landing page em múltiplos idiomas. O preview mostra exatamente onde cada campo aparece.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showPreview ? 'Ocultar Preview' : 'Mostrar Preview'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Language selector for preview */}
        <div className="flex items-center gap-2 mt-4">
          <span className="text-sm text-muted-foreground">Idioma do preview:</span>
          <div className="flex gap-1">
            {(['pt', 'en', 'es'] as const).map(lang => (
              <Button
                key={lang}
                variant={selectedLang === lang ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedLang(lang)}
                className="text-xs"
              >
                {lang === 'pt' ? '🇧🇷 PT' : lang === 'en' ? '🇺🇸 EN' : '🇪🇸 ES'}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={categories} className="space-y-2">
          {categories.map(category => (
            <AccordionItem key={category} value={category} className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{categoryLabels[category] || category}</span>
                  <Badge variant="secondary" className="text-xs">
                    {contentByCategory[category].length} itens
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {/* Description */}
                {categoryDescriptions[category] && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {categoryDescriptions[category]}
                  </p>
                )}

                {/* Show preview for hero category */}
                {category === 'hero' && showPreview && (
                  <HeroPreview getPreviewValue={getPreviewValue} />
                )}

                <div className="space-y-6 pt-4">
                  {contentByCategory[category].map(item => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-4 bg-muted/20">
                      <div className="flex items-start justify-between">
                        <div>
                          <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                            {item.key}
                          </code>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          disabled={!hasChanges(item.id) || savingIds.has(item.id)}
                          onClick={() => handleSave(item.id, {
                            pt: item.value_pt,
                            en: item.value_en,
                            es: item.value_es
                          })}
                        >
                          {savingIds.has(item.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-1" />
                              Salvar
                            </>
                          )}
                        </Button>
                      </div>

                      <Tabs defaultValue="pt" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="pt">🇧🇷 Português</TabsTrigger>
                          <TabsTrigger value="en">🇺🇸 English</TabsTrigger>
                          <TabsTrigger value="es">🇪🇸 Español</TabsTrigger>
                        </TabsList>

                        {(['pt', 'en', 'es'] as const).map(lang => (
                          <TabsContent key={lang} value={lang} className="mt-3">
                            {(item[`value_${lang}`] || '').length > 100 ? (
                              <Textarea
                                value={editedValues[item.id]?.[lang] ?? item[`value_${lang}`] ?? ''}
                                onChange={(e) => handleChange(item.id, lang, e.target.value)}
                                rows={4}
                                placeholder={`Conteúdo em ${lang === 'pt' ? 'Português' : lang === 'en' ? 'Inglês' : 'Espanhol'}`}
                              />
                            ) : (
                              <Input
                                value={editedValues[item.id]?.[lang] ?? item[`value_${lang}`] ?? ''}
                                onChange={(e) => handleChange(item.id, lang, e.target.value)}
                                placeholder={`Conteúdo em ${lang === 'pt' ? 'Português' : lang === 'en' ? 'Inglês' : 'Espanhol'}`}
                              />
                            )}
                          </TabsContent>
                        ))}
                      </Tabs>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {categories.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum conteúdo encontrado. Adicione conteúdo via SQL.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
