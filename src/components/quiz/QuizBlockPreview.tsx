import { useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { QuizBlock, VideoBlock } from "@/types/blocks";
import { normalizeBlock } from "@/types/blocks";

// ✅ Fase 8: Sub-componentes modulares
import { QuestionBlockPreview } from "./preview/QuestionBlockPreview";
import {
  TextBlockPreview, SeparatorBlockPreview, ImageBlockPreview, VideoBlockPreview,
  AudioBlockPreview, GalleryBlockPreview, EmbedBlockPreview, ButtonBlockPreview,
  PriceBlockPreview, MetricsBlockPreview,
} from "./preview/StaticBlockPreviews";
import {
  LoadingBlockPreview, ProgressBlockPreview, CountdownBlockPreview,
  TestimonialBlockPreview, SliderBlockPreview, TextInputBlockPreview,
  NPSBlockPreview, AccordionBlockPreview, ComparisonBlockPreview,
  SocialProofBlockPreview, AnimatedCounterBlockPreview,
} from "./preview/InteractiveBlockPreviews";

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
        return <TextBlockPreview key={block.id} block={block} />;
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
        return <ButtonBlockPreview key={block.id} block={block} onNavigateNext={onNavigateNext} onNavigateToQuestion={onNavigateToQuestion} />;
      case "price":
        return <PriceBlockPreview key={block.id} block={block} />;
      case "metrics":
        return <MetricsBlockPreview key={block.id} block={block} />;
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
        return <TextInputBlockPreview key={block.id} block={block} />;
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
