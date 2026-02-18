import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Rocket, TrendingUp, Megaphone, FlaskConical, GraduationCap, MoreHorizontal, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  { value: "other", icon: <MoreHorizontal className="h-5 w-5" />, labelKey: "userObjectives.options.other" },
];

interface UserObjectiveModalProps {
  open: boolean;
  userId: string;
  onComplete: () => void;
}

export const UserObjectiveModal = ({ open, userId, onComplete }: UserObjectiveModalProps) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string[]>([]);
  const [otherText, setOtherText] = useState("");
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
      const objectives = selected.includes("other") && otherText.trim()
        ? [...selected.filter((v) => v !== "other"), `other:${otherText.trim()}`]
        : selected;

      const { error } = await (supabase as any)
        .from("profiles")
        .update({ user_objectives: objectives })
        .eq("id", userId);

      if (error) throw error;
      onComplete();
    } catch (err) {
      console.error("Error saving objectives:", err);
      toast.error(t("common.errorSaving"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} modal>
      <DialogContent
        className="sm:max-w-lg [&>button]:hidden !max-h-none !overflow-y-visible"
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

        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
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

          {selected.includes("other") && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-2"
            >
              <Input
                placeholder={t("userObjectives.otherPlaceholder")}
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                maxLength={100}
              />
            </motion.div>
          )}
        </div>

        <Button
          className="w-full mt-4"
          disabled={selected.length === 0 || saving}
          onClick={handleSubmit}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          {t("userObjectives.continue")}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
