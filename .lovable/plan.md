

## Plano: Seção de Depoimentos (Carrossel) + FAQ na página /precos

### O que será feito

1. **Criar componente `TestimonialsCarousel`** -- seção de depoimentos com cards em carrossel horizontal (Embla Carousel, já instalado), estilo inspirado na imagem de referência (cards com avatar, nome, @handle, rede social, texto do depoimento, data). Layout em coluna única com scroll lateral.

2. **Inserir na Landing Page (`Index.tsx`)** -- abaixo da seção de pricing (após `DeferredSection id="pricing"`) e antes do FAQ.

3. **Inserir na página `/precos` (`Pricing.tsx`)** -- abaixo do grid de cards de preço, seguido da seção FAQ (substituindo o botão "Ver FAQ" atual pelo componente `FAQAccordion` inline).

### Componente `TestimonialsCarousel`
- Usa `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselPrevious`, `CarouselNext` do `ui/carousel`
- Cada card: avatar circular, nome, @handle, icone de rede social (Instagram/X/WhatsApp), texto do depoimento, data
- Dados hardcoded inicialmente (5-6 depoimentos fictícios inspirados na imagem de referência)
- Cards com `basis-[85%] md:basis-[45%] lg:basis-[35%]` para mostrar parcialmente o próximo card
- Título da seção: "Depoimentos de quem comprovou e recomenda."
- Subtítulo: "Casos reais de clientes que testaram nossa solução"

### Arquivos

| Arquivo | Ação |
|---|---|
| `src/components/landing/TestimonialsCarousel.tsx` | **Novo** -- componente carrossel de depoimentos |
| `src/pages/Index.tsx` | Inserir `TestimonialsCarousel` entre pricing e FAQ |
| `src/pages/Pricing.tsx` | Inserir `TestimonialsCarousel` + `FAQAccordion` inline (remover botão "Ver FAQ") |

