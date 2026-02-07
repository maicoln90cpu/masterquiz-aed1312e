import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Check, RotateCcw, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DemoQuestion {
  id: string;
  type: "intro" | "single_choice" | "multiple_choice" | "loading" | "result";
  blocksKeys: string[];
  loadingDuration?: number;
}

const demoQuestionConfig: DemoQuestion[] = [
  {
    id: "intro",
    type: "intro",
    blocksKeys: ["title", "text", "button"]
  },
  {
    id: "objective",
    type: "single_choice",
    blocksKeys: ["question", "singleChoice", "emojis"]
  },
  {
    id: "channels",
    type: "multiple_choice",
    blocksKeys: ["multipleChoice", "emojis"]
  },
  {
    id: "loading",
    type: "loading",
    loadingDuration: 2500,
    blocksKeys: ["loading", "animation"]
  },
  {
    id: "result",
    type: "result",
    blocksKeys: ["result", "achievement"]
  }
];

interface LandingQuizDemoProps {
  onBlockChange?: (blocks: string[]) => void;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export const LandingQuizDemo = ({
  onBlockChange,
  autoPlay = false,
  autoPlayInterval = 4000
}: LandingQuizDemoProps) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [isPaused, setIsPaused] = useState(false);
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);

  const currentQuestion = demoQuestionConfig[currentIndex];
  const progress = ((currentIndex) / (demoQuestionConfig.length - 1)) * 100;

  // Get translated block names
  const getTranslatedBlocks = (blocksKeys: string[]): string[] => {
    return blocksKeys.map(key => t(`landingDemo.blocks.${key}`));
  };

  // Get options for current question type
  const getOptions = () => {
    if (currentQuestion.id === "objective") {
      return [
        { emoji: "📈", textKey: "sales" },
        { emoji: "🎯", textKey: "leads" },
        { emoji: "💡", textKey: "educate" },
        { emoji: "🔄", textKey: "retain" }
      ];
    }
    if (currentQuestion.id === "channels") {
      return [
        { emoji: "📱", textKey: "instagram" },
        { emoji: "📧", textKey: "email" },
        { emoji: "🌐", textKey: "website" },
        { emoji: "📢", textKey: "ads" }
      ];
    }
    return [];
  };

  const handleNext = useCallback(() => {
    if (currentIndex < demoQuestionConfig.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsLoadingComplete(false);
    } else {
      // Reset to beginning
      setCurrentIndex(0);
      setSelectedOptions({});
      setIsLoadingComplete(false);
    }
  }, [currentIndex]);

  const handleSelectOption = (option: string) => {
    const questionId = currentQuestion.id;
    
    if (currentQuestion.type === "multiple_choice") {
      setSelectedOptions(prev => {
        const current = prev[questionId] || [];
        if (current.includes(option)) {
          return { ...prev, [questionId]: current.filter(o => o !== option) };
        }
        return { ...prev, [questionId]: [...current, option] };
      });
    } else {
      setSelectedOptions(prev => ({ ...prev, [questionId]: [option] }));
    }
  };

  const isSelected = (option: string) => {
    return selectedOptions[currentQuestion.id]?.includes(option) || false;
  };

  // Notify parent of block changes
  useEffect(() => {
    const translatedBlocks = getTranslatedBlocks(currentQuestion.blocksKeys);
    onBlockChange?.(translatedBlocks);
  }, [currentIndex, currentQuestion.blocksKeys, onBlockChange, t]);

  // Loading auto-advance
  useEffect(() => {
    if (currentQuestion.type === "loading" && !isLoadingComplete) {
      const timer = setTimeout(() => {
        setIsLoadingComplete(true);
      }, currentQuestion.loadingDuration || 3000);
      return () => clearTimeout(timer);
    }
  }, [currentQuestion, isLoadingComplete]);

  const renderContent = () => {
    switch (currentQuestion.type) {
      case "intro":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center h-full text-center px-4 py-8"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="text-4xl mb-4"
            >
              {t('landingDemo.intro.emoji')}
            </motion.div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              {t('landingDemo.intro.title')}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {t('landingDemo.intro.subtitle')}
            </p>
            <Button 
              size="sm" 
              onClick={handleNext}
              className="group"
            >
              {t('landingDemo.intro.startButton')}
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        );

      case "loading":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full text-center px-4 py-8"
          >
            {!isLoadingComplete ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="mb-4"
                >
                  <Loader2 className="h-10 w-10 text-primary" />
                </motion.div>
                <h3 className="text-base font-semibold text-foreground mb-2">
                  {t('landingDemo.loading.title')}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t('landingDemo.loading.subtitle')}
                </p>
                <div className="flex gap-1 mt-4">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-primary"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4"
                >
                  <Check className="h-6 w-6 text-primary" />
                </motion.div>
                <p className="text-sm font-medium text-foreground mb-4">
                  {t('landingDemo.loading.complete')}
                </p>
                <Button size="sm" onClick={handleNext} className="group">
                  {t('landingDemo.navigation.seeResult')}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        );

      case "result":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center h-full text-center px-4 py-8"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4"
            >
              <span className="text-3xl">{t('landingDemo.result.emoji')}</span>
            </motion.div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              {t('landingDemo.result.title')}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {t('landingDemo.result.subtitle')}
            </p>
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleNext}
              className="group"
            >
              <RotateCcw className="mr-2 h-4 w-4 group-hover:-rotate-180 transition-transform duration-500" />
              {t('landingDemo.result.restartButton')}
            </Button>
          </motion.div>
        );

      default:
        const options = getOptions();
        const questionKey = currentQuestion.id as "objective" | "channels";
        
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex flex-col h-full px-4 py-4"
          >
            <h3 className="text-sm font-semibold text-foreground mb-1 text-center">
              {t(`landingDemo.${questionKey}.title`)}
            </h3>
            {currentQuestion.type === "multiple_choice" && (
              <p className="text-xs text-muted-foreground mb-3 text-center">
                {t(`landingDemo.${questionKey}.subtitle`)}
              </p>
            )}
            
            <div className="flex-1 flex flex-col gap-2">
              {options.map((option, idx) => {
                const optionText = t(`landingDemo.${questionKey}.options.${option.textKey}`);
                return (
                  <motion.button
                    key={option.textKey}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => handleSelectOption(option.textKey)}
                    className={`
                      w-full p-2.5 rounded-lg border text-left text-sm
                      transition-all duration-200
                      ${isSelected(option.textKey)
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card hover:border-primary/50 text-foreground"
                      }
                    `}
                  >
                    <span className="flex items-center gap-2">
                      {option.emoji && <span className="text-base">{option.emoji}</span>}
                      <span className="flex-1 text-xs">{optionText}</span>
                      {isSelected(option.textKey) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-4 h-4 rounded-full bg-primary flex items-center justify-center"
                        >
                          <Check className="h-2.5 w-2.5 text-primary-foreground" />
                        </motion.div>
                      )}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {currentQuestion.type === "multiple_choice" ? (
              <Button 
                size="sm" 
                onClick={handleNext}
                disabled={!selectedOptions[currentQuestion.id]?.length}
                className="mt-3 w-full group"
              >
                {t('landingDemo.navigation.next')}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            ) : selectedOptions[currentQuestion.id]?.length > 0 && (
              <Button 
                size="sm" 
                onClick={handleNext}
                className="mt-3 w-full group"
              >
                {t('landingDemo.navigation.next')}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            )}
          </motion.div>
        );
    }
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Phone Frame */}
      <div className="relative w-[280px] h-[560px] bg-background rounded-[40px] border-4 border-foreground/10 shadow-2xl overflow-hidden">
        {/* Status Bar */}
        <div className="h-8 bg-muted/50 flex items-center justify-between px-6 text-xs text-muted-foreground">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-2 flex gap-0.5">
              <div className="w-1 h-full bg-foreground/60 rounded-sm" />
              <div className="w-1 h-full bg-foreground/60 rounded-sm" />
              <div className="w-1 h-full bg-foreground/40 rounded-sm" />
              <div className="w-1 h-full bg-foreground/20 rounded-sm" />
            </div>
            <span className="ml-1">100%</span>
          </div>
        </div>

        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-foreground/10 rounded-b-2xl" />

        {/* Progress Bar */}
        <div className="px-4 pt-2">
          <Progress value={progress} className="h-1" />
          <p className="text-xs text-muted-foreground text-center mt-1">
            {t('landingDemo.stepOf', { current: currentIndex + 1, total: demoQuestionConfig.length })}
          </p>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-80px)]">
          <AnimatePresence mode="wait">
            <div key={currentQuestion.id} className="h-full">
              {renderContent()}
            </div>
          </AnimatePresence>
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-foreground/20 rounded-full" />
      </div>

      {/* Glow Effect */}
      <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-[50px] blur-2xl -z-10 opacity-50" />
    </div>
  );
};
