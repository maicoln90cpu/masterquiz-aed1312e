import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Lightbulb, Minimize2, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

interface FloatingTutorialProps {
  currentStep: number;
}

export const FloatingTutorial = ({ currentStep }: FloatingTutorialProps) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('quiz_tutorial_seen');
    if (seen === 'true') {
      setHasSeenTutorial(true);
      setIsMinimized(true);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('quiz_tutorial_seen', 'true');
  };

  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Get content for current step
  const stepKey = `step${currentStep}` as 'step1' | 'step2' | 'step3' | 'step4' | 'step5';
  const validSteps = ['step1', 'step2', 'step3', 'step4', 'step5'];
  
  if (!isVisible || !validSteps.includes(stepKey)) return null;

  const title = t(`components.floatingTutorial.${stepKey}.title`);
  const description = t(`components.floatingTutorial.${stepKey}.description`);
  const tips = [
    t(`components.floatingTutorial.${stepKey}.tip1`),
    t(`components.floatingTutorial.${stepKey}.tip2`),
    t(`components.floatingTutorial.${stepKey}.tip3`),
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
      >
        <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                {!isMinimized && (
                  <div>
                    <CardTitle className="text-lg">{title}</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {description}
                    </CardDescription>
                  </div>
                )}
                {isMinimized && (
                  <span className="text-sm font-medium">
                    {t('components.floatingTutorial.tutorial')} - {t('components.floatingTutorial.stepOf', { current: currentStep, total: 5 })}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleToggleMinimize}
                >
                  {isMinimized ? (
                    <Maximize2 className="h-4 w-4" />
                  ) : (
                    <Minimize2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {!isMinimized && (
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {tips.map((tip, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 text-sm text-muted-foreground bg-background/50 p-2 rounded-md"
                  >
                    <span className="text-primary font-semibold mt-0.5">•</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-muted-foreground">
                  {t('components.floatingTutorial.stepOf', { current: currentStep, total: 5 })}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="text-xs"
                >
                  {t('components.floatingTutorial.dontShowAgain')}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};
