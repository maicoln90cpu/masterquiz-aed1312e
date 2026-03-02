import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { pushGTMEvent } from "@/lib/gtmLogger";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY = "mq_last_plan";

export const usePlanUpgradeEvent = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const check = async () => {
      const { data } = await supabase
        .from("user_subscriptions")
        .select("plan_type")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!data) return;

      const currentPlan = data.plan_type;
      const previousPlan = localStorage.getItem(STORAGE_KEY);

      // Se é a primeira vez, apenas salvar
      if (!previousPlan) {
        localStorage.setItem(STORAGE_KEY, currentPlan);
        return;
      }

      // Se mudou de free para qualquer plano pago
      if (previousPlan === "free" && currentPlan !== "free") {
        pushGTMEvent("PlanUpgraded", {
          plan_type: currentPlan,
          previous_plan: previousPlan,
        });
      }

      localStorage.setItem(STORAGE_KEY, currentPlan);
    };

    check();
  }, [user]);
};
