import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SubTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
  badge?: number;
}

interface AdminSubTabsProps {
  tabs: SubTab[];
  defaultTab?: string;
  children: (activeTab: string) => React.ReactNode;
}

const colorClasses: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  yellow: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
  red: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
  purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
  pink: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
};

export function AdminSubTabs({ tabs, defaultTab, children }: AdminSubTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

  const getActiveClasses = (tab: SubTab, isActive: boolean) => {
    if (!isActive) {
      return "text-muted-foreground hover:text-foreground hover:bg-muted/50";
    }
    
    if (tab.color && colorClasses[tab.color]) {
      return cn("font-medium border", colorClasses[tab.color]);
    }
    
    return "bg-background shadow-sm text-foreground font-medium";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 p-1.5 bg-muted/50 rounded-lg">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            size="sm"
            className={cn(
              "flex items-center gap-2 transition-all relative",
              getActiveClasses(tab, activeTab === tab.id)
            )}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
            {tab.badge != null && tab.badge > 0 && (
              <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                {tab.badge}
              </span>
            )}
          </Button>
        ))}
      </div>

      <div className="mt-4">
        {children(activeTab)}
      </div>
    </div>
  );
}
