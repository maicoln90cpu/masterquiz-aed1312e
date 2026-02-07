import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import quizCreatorImg from "@/assets/quiz-creator-real.jpeg";
import analyticsImg from "@/assets/analytics-real.jpeg";
import crmImg from "@/assets/crm-real.jpeg";
import integrationsImg from "@/assets/integrations-real.jpeg";
import multilingualImg from "@/assets/multilingual-real.jpeg";
import visualCreatorImg from "@/assets/visual-editor-real.jpeg";

export const PlatformGallery = () => {
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const screenshots = [
    { image: quizCreatorImg, title: "Criador Visual de Quiz", description: "Interface intuitiva de arrastar e soltar" },
    { image: analyticsImg, title: "Dashboard de Analytics", description: "Métricas em tempo real e insights profundos" },
    { image: crmImg, title: "CRM Integrado", description: "Gerencie leads e funil de vendas" },
    { image: visualCreatorImg, title: "Editor Visual", description: "Personalize cada detalhe sem código" },
    { image: integrationsImg, title: "Integrações Poderosas", description: "Conecte com suas ferramentas favoritas" },
    { image: multilingualImg, title: "Suporte Multilíngue", description: "Alcance audiências globais" },
  ];

  const handlePrevious = () => {
    setSelectedImage((prev) => (prev === null || prev === 0 ? screenshots.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedImage((prev) => (prev === null ? 0 : (prev + 1) % screenshots.length));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImage === null) return;
      if (e.key === "ArrowLeft") handlePrevious();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage]);

  return (
    <section className="py-20 bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 landing-animate">
          <h2 className="text-4xl font-bold mb-4">Plataforma Completa em Ação</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Veja como o MasterQuizz simplifica sua geração de leads com funcionalidades poderosas
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {screenshots.map((screenshot, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-xl bg-card border border-border shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer landing-animate"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => setSelectedImage(index)}
            >
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={screenshot.image}
                  alt={screenshot.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  {screenshot.title}
                </h3>
                <p className="text-sm text-muted-foreground">{screenshot.description}</p>
              </div>

              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-full p-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Dialog open={selectedImage !== null} onOpenChange={(open) => !open && setSelectedImage(null)}>
          <DialogContent className="max-w-7xl w-[95vw] h-[95vh] p-0 border-0 bg-transparent">
            <div className="relative w-full h-full flex items-center justify-center">
              {selectedImage !== null && (
                <>
                  <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 z-50 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                  <button onClick={handlePrevious} className="absolute left-4 z-50 p-3 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors">
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                  <button onClick={handleNext} className="absolute right-4 z-50 p-3 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors">
                    <ChevronRight className="w-8 h-8" />
                  </button>
                  <div className="w-full h-full flex flex-col items-center justify-center p-8">
                    <img src={screenshots[selectedImage].image} alt={screenshots[selectedImage].title} className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
                    <div className="mt-6 text-center">
                      <h3 className="text-2xl font-bold mb-2">{screenshots[selectedImage].title}</h3>
                      <p className="text-muted-foreground">{screenshots[selectedImage].description}</p>
                      <p className="text-sm text-muted-foreground mt-2">{selectedImage + 1} / {screenshots.length}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};
