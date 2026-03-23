import { useRef, useCallback, lazy, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { QuizBlock, VideoBlock } from "@/types/blocks";
import { normalizeBlock } from "@/types/blocks";
import type { QuizQuestion } from "@/types/quiz";

// ✅ Fase 8: Sub-componentes modulares
import { QuestionBlockPreview } from "./preview/QuestionBlockPreview";
import {
  TextBlockPreview, SeparatorBlockPreview, ImageBlockPreview, VideoBlockPreview,
  AudioBlockPreview, GalleryBlockPreview, EmbedBlockPreview, ButtonBlockPreview,
  PriceBlockPreview,
} from "./preview/StaticBlockPreviews";
import {
  LoadingBlockPreview, ProgressBlockPreview, CountdownBlockPreview,
  TestimonialBlockPreview, SliderBlockPreview, TextInputBlockPreview,
  NPSBlockPreview, AccordionBlockPreview, ComparisonBlockPreview,
  SocialProofBlockPreview, AnimatedCounterBlockPreview,
} from "./preview/InteractiveBlockPreviews";
import {
  CalloutBlockPreview, IconListBlockPreview, QuoteBlockPreview,
  BadgeRowBlockPreview, BannerBlockPreview,
} from "./preview/VisualBlockPreviews";
import {
  AnswerSummaryBlockPreview, ProgressMessageBlockPreview, AvatarGroupBlockPreview,
  ConditionalTextBlockPreview, ComparisonResultBlockPreview, PersonalizedCTABlockPreview,
} from "./preview/DynamicBlockPreviews";
import { RecommendationBlockPreview } from "./preview/RecommendationBlockPreview";

// ✅ FASE 12: Lazy load MetricsBlockPreview (recharts é pesado ~200KB)
const LazyMetricsBlockPreview = lazy(() =>
  import("./preview/MetricsBlockPreview").then(m => ({ default: m.MetricsBlockPreview }))
);

interface QuizBlockPreviewProps {
  blocks: QuizBlock[];
  showNavigationButton?: boolean;
  wrapInCard?: boolean;
  nextButtonText?: string;
  onNavigateNext?: () => void;
  onNavigateToQuestion?: (index: number) => void;
  selectedAnswer?: string | string[];
  onAnswerSelect?: (value: string, isMultiple: boolean) => void;
  onTextChange?: (text: string) => void;
  // Controlled textInput support
  onTextInputChange?: (blockId: string, value: string) => void;
  textInputValues?: Record<string, string>;
  // CTA tracking for funnel last step
  onCtaClick?: (ctaText: string, ctaUrl: string, blockId?: string) => void;
  // Runtime data for dynamic blocks
  answers?: Record<string, any>;
  questions?: QuizQuestion[];
  currentStep?: number;
  totalQuestions?: number;
}

export const QuizBlockPreview = ({
  blocks,
  showNavigationButton = true,
  wrapInCard = true,
  nextButtonText = "Próxima Pergunta",
  onNavigateNext,
  onNavigateToQuestion,
  selectedAnswer,
  onAnswerSelect,
  onTextChange,
  onTextInputChange,
  textInputValues,
  onCtaClick,
  answers,
  questions,
  currentStep,
  totalQuestions,
}: QuizBlockPreviewProps) => {
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  const trackFacebookPixelEvent = useCallback((eventName: string, params: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      try {
        if (eventName === 'VideoView') {
          (window as any).fbq('track', eventName, params);
        } else {
          (window as any).fbq('trackCustom', eventName, params);
        }
      } catch (error) {
        console.error('Erro ao enviar evento para Facebook Pixel:', error);
      }
    }
  }, []);

  const handleIframeLoad = useCallback((block: VideoBlock) => {
    trackFacebookPixelEvent('VideoView', {
      content_name: block.caption || 'Quiz Video',
      video_url: block.url,
      video_type: block.provider || 'iframe',
      note: 'Iframe tracking - eventos de progresso não disponíveis'
    });
  }, [trackFacebookPixelEvent]);

  const renderBlock = (rawBlock: QuizBlock) => {
    const block = normalizeBlock(rawBlock);
    switch (block.type) {
      case "question":
        return <QuestionBlockPreview key={block.id} block={block} selectedAnswer={selectedAnswer} onAnswerSelect={onAnswerSelect} onTextChange={onTextChange} />;
      case "text":
        return <TextBlockPreview key={block.id} block={block} answers={answers} questions={questions} />;
      case "separator":
        return <SeparatorBlockPreview key={block.id} block={block} />;
      case "image":
        return <ImageBlockPreview key={block.id} block={block} />;
      case "video":
        return <VideoBlockPreview key={block.id} block={block} trackFacebookPixelEvent={trackFacebookPixelEvent} handleIframeLoad={handleIframeLoad} />;
      case "audio":
        return <AudioBlockPreview key={block.id} block={block} />;
      case "gallery":
        return <GalleryBlockPreview key={block.id} block={block} />;
      case "embed":
        return <EmbedBlockPreview key={block.id} block={block} />;
      case "button":
        return <ButtonBlockPreview key={block.id} block={block} onNavigateNext={onNavigateNext} onNavigateToQuestion={onNavigateToQuestion} onCtaClick={onCtaClick} />;
      case "price":
        return <PriceBlockPreview key={block.id} block={block} onCtaClick={onCtaClick} />;
      case "metrics":
        return (
          <Suspense key={block.id} fallback={<Skeleton className="h-[300px] w-full rounded-lg" />}>
            <LazyMetricsBlockPreview block={block as QuizBlock & { type: 'metrics' }} />
          </Suspense>
        );
      case "loading":
        return <LoadingBlockPreview key={block.id} block={block} />;
      case "progress":
        return <ProgressBlockPreview key={block.id} block={block} currentQuestion={0} totalQuestions={10} />;
      case "countdown":
        return <CountdownBlockPreview key={block.id} block={block} />;
      case "testimonial":
        return <TestimonialBlockPreview key={block.id} block={block} />;
      case "slider":
        return <SliderBlockPreview key={block.id} block={block} />;
      case "textInput":
        return (
          <TextInputBlockPreview 
            key={block.id} 
            block={block} 
            controlledValue={textInputValues?.[block.id]}
            onValueChange={onTextInputChange ? (val) => onTextInputChange(block.id, val) : undefined}
          />
        );
      case "nps":
        return <NPSBlockPreview key={block.id} block={block} />;
      case "accordion":
        return <AccordionBlockPreview key={block.id} block={block} />;
      case "comparison":
        return <ComparisonBlockPreview key={block.id} block={block} />;
      case "socialProof":
        return <SocialProofBlockPreview key={block.id} block={block} />;
      case "animatedCounter":
        return <AnimatedCounterBlockPreview key={block.id} block={block} />;
      case "callout":
        return <CalloutBlockPreview key={block.id} block={block as QuizBlock & { type: 'callout' }} />;
      case "iconList":
        return <IconListBlockPreview key={block.id} block={block as QuizBlock & { type: 'iconList' }} />;
      case "quote":
        return <QuoteBlockPreview key={block.id} block={block as QuizBlock & { type: 'quote' }} />;
      case "badgeRow":
        return <BadgeRowBlockPreview key={block.id} block={block as QuizBlock & { type: 'badgeRow' }} />;
      case "banner":
        return <BannerBlockPreview key={block.id} block={block as QuizBlock & { type: 'banner' }} />;
      case "answerSummary":
        return <AnswerSummaryBlockPreview key={block.id} block={block as QuizBlock & { type: 'answerSummary' }} answers={answers} questions={questions} />;
      case "progressMessage":
        return <ProgressMessageBlockPreview key={block.id} block={block as QuizBlock & { type: 'progressMessage' }} currentStep={currentStep} totalQuestions={totalQuestions} />;
      case "avatarGroup":
        return <AvatarGroupBlockPreview key={block.id} block={block as QuizBlock & { type: 'avatarGroup' }} />;
      case "conditionalText":
        return <ConditionalTextBlockPreview key={block.id} block={block as QuizBlock & { type: 'conditionalText' }} answers={answers} questions={questions} />;
      case "comparisonResult":
        return <ComparisonResultBlockPreview key={block.id} block={block as QuizBlock & { type: 'comparisonResult' }} answers={answers} />;
      case "personalizedCTA":
        return <PersonalizedCTABlockPreview key={block.id} block={block as QuizBlock & { type: 'personalizedCTA' }} answers={answers} />;
      case "recommendation":
        return <RecommendationBlockPreview key={block.id} block={block as QuizBlock & { type: 'recommendation' }} answers={answers} questions={questions} />;
      case "calculator":
        return (
          <div key={block.id} className="p-6 bg-muted/30 rounded-lg border text-center">
            <p className="text-lg font-semibold">🧮 {(block as any).resultLabel || 'Resultado'}</p>
            <p className="text-2xl font-bold text-primary mt-2">
              {(block as any).resultPrefix || ''}{(block as any).formula ? '—' : '0'} {(block as any).resultUnit || ''}
            </p>
            {(block as any).formula && (
              <p className="text-xs text-muted-foreground mt-2">Fórmula: {(block as any).formula}</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const content = blocks.length === 0 ? (
    <p className="text-center text-muted-foreground">Adicione blocos para visualizar o preview</p>
  ) : (
    <>
      {blocks.map((block) => renderBlock(block))}
      {showNavigationButton && (
        <Button className="w-full" size="lg" onClick={onNavigateNext}>{nextButtonText}</Button>
      )}
    </>
  );

  if (!wrapInCard) {
    return <div className="space-y-4">{content}</div>;
  }

  return (
    <Card className="border-2">
      <CardContent className="p-8 space-y-8">{content}</CardContent>
    </Card>
  );
};
