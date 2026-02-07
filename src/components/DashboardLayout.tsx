import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import { LanguageSwitch } from "./LanguageSwitch";
import { InAppNotifications } from "./InAppNotifications";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header com trigger e ações */}
          <header className="h-14 border-b bg-card/80 backdrop-blur-sm flex items-center px-4 gap-4 sticky top-0 z-20">
            <SidebarTrigger />
            
            <div className="flex-1" />
            
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <InAppNotifications />
              <LanguageSwitch />
            </div>
          </header>

          {/* Conteúdo principal - sem scroll próprio, cada página controla */}
          <main className="flex-1 overflow-hidden">
            <div className="w-full h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
