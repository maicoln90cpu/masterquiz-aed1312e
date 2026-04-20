import { logger } from '@/lib/logger';
import { useState } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Rocket, TrendingUp, Megaphone, FlaskConical, GraduationCap, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

interface ObjectiveOption {
  value: string;
  icon: React.ReactNode;
  labelKey: string;
}

const OBJECTIVES: ObjectiveOption[] = [
  { value: "lead_capture_launch", icon: <Rocket className="h-5 w-5" />, labelKey: "userObjectives.options.leadCapture" },
  { value: "vsl_conversion", icon: <TrendingUp className="h-5 w-5" />, labelKey: "userObjectives.options.vslConversion" },
  { value: "paid_traffic", icon: <Megaphone className="h-5 w-5" />, labelKey: "userObjectives.options.paidTraffic" },
  { value: "offer_validation", icon: <FlaskConical className="h-5 w-5" />, labelKey: "userObjectives.options.offerValidation" },
  { value: "educational", icon: <GraduationCap className="h-5 w-5" />, labelKey: "userObjectives.options.educational" },
];

interface UserObjectiveModalProps {
  open: boolean;
  userId: string;
  onComplete: () => void;
}

export const UserObjectiveModal = ({ open, userId, onComplete }: UserObjectiveModalProps) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleObjective = (value: string) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleSubmit = async () => {
    if (selected.length === 0) return;
    setSaving(true);
    try {
      const objectives = selected;

      const { error } = await (supabase as any)
        .from("profiles")
        .update({ user_objectives: objectives })
        .eq("id", userId);

      if (error) throw error;
      onComplete();
    } catch (err) {
      logger.error("Error saving objectives:", err);
      toast.error(t("common.errorSaving"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} modal>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-4 md:p-6 shadow-lg duration-200 sm:rounded-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
          )}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-xl text-center">
              {t("userObjectives.title")}
            </DialogTitle>
            <DialogDescription className="text-center">
              {t("userObjectives.subtitle")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {OBJECTIVES.map((obj, i) => {
              const isSelected = selected.includes(obj.value);
              return (
                <motion.button
                  key={obj.value}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  type="button"
                  onClick={() => toggleObjective(obj.value)}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                      : "border-border hover:border-primary/40 hover:bg-muted/50"
                  }`}
                >
                  <span className={isSelected ? "text-primary" : "text-muted-foreground"}>
                    {obj.icon}
                  </span>
                  <span className="text-sm font-medium">{t(obj.labelKey)}</span>
                </motion.button>
              );
            })}
          </div>

          <Button
            className="w-full"
            disabled={selected.length === 0 || saving}
            onClick={handleSubmit}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {t("userObjectives.continue")}
          </Button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>
  );
};
