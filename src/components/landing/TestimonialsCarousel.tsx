import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { useLandingABTest } from "@/hooks/useLandingABTest";

const TESTIMONIALS = [
  {
    name: "Mariana Silva",
    handle: "@marianasilva",
    avatar: "",
    text: "Depois que comecei a usar o MasterQuiz, minha taxa de conversão subiu 40%. Os leads já chegam qualificados e prontos para comprar. Melhor investimento que fiz!",
    date: "12 Fev 2026",
    rating: 5,
  },
  {
    name: "Lucas Oliveira",
    handle: "@lucasoliv",
    avatar: "",
    text: "Eu testei várias plataformas de quiz e nenhuma tinha CRM integrado. O MasterQuiz resolve tudo em um só lugar. Recomendo demais para infoprodutores!",
    date: "28 Jan 2026",
    rating: 5,
  },
  {
    name: "Fernanda Costa",
    handle: "@fecosta.mkt",
    avatar: "",
    text: "A integração com Kiwify foi o diferencial. Meus quizzes agora direcionam direto pro checkout e os resultados são absurdos. Triplicou meu faturamento em 2 meses.",
    date: "05 Mar 2026",
    rating: 5,
  },
  {
    name: "Rafael Mendes",
    handle: "@rafaelmendes",
    avatar: "",
    text: "Sou gestor de tráfego e uso o MasterQuiz para qualificar leads antes de enviar pro cliente. A taxa de rejeição caiu pela metade. Ferramenta essencial!",
    date: "18 Fev 2026",
    rating: 5,
  },
  {
    name: "Camila Ramos",
    handle: "@camilaramos",
    avatar: "",
    text: "Criei meu primeiro quiz em menos de 10 minutos. A interface é intuitiva e os templates prontos facilitam demais. Já capturei mais de 500 leads qualificados!",
    date: "01 Mar 2026",
    rating: 5,
  },
  {
    name: "Thiago Barbosa",
    handle: "@thiagobarbosa",
    avatar: "",
    text: "O analytics em tempo real me dá visibilidade total do funil. Sei exatamente onde os leads abandonam e otimizo na hora. Game changer pro meu negócio!",
    date: "22 Fev 2026",
    rating: 5,
  },
];

export const TestimonialsCarousel = () => {
  const { getContentForElement } = useLandingABTest('testimonials_title');
  const titleAB = getContentForElement('testimonials_title');

  return (
    <div className="w-full">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">
          {titleAB?.text || 'Depoimentos de quem comprovou e recomenda.'}
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Casos reais de clientes que testaram nossa solução
        </p>
      </div>

      <div className="relative max-w-6xl mx-auto px-12">
        <Carousel
          opts={{
            align: "start",
            loop: true,
            dragFree: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {TESTIMONIALS.map((t, i) => (
              <CarouselItem
                key={i}
                className="pl-4 basis-[85%] md:basis-[45%] lg:basis-[35%]"
              >
                <Card className="h-full border bg-card hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-6 flex flex-col h-full">
                    {/* Stars */}
                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: t.rating }).map((_, si) => (
                        <Star
                          key={si}
                          className="h-4 w-4 fill-primary text-primary"
                        />
                      ))}
                    </div>

                    {/* Text */}
                    <p className="text-sm leading-relaxed text-foreground flex-1 mb-6">
                      "{t.text}"
                    </p>

                    {/* Author */}
                    <div className="flex items-center gap-3 pt-4 border-t border-border">
                      <Avatar className="h-10 w-10">
                        {t.avatar ? (
                          <AvatarImage src={t.avatar} alt={t.name} />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                          {t.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {t.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t.handle}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {t.date}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="-left-6" />
          <CarouselNext className="-right-6" />
        </Carousel>
      </div>
    </div>
  );
};
