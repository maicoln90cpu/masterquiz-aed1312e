import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, LayoutDashboard, PlusCircle, Users, BarChart3, MessageSquare, Webhook, HelpCircle, Settings, LogOut, CreditCard, Shield, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { useTranslation } from "react-i18next";

export const MobileNav = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isMasterAdmin } = useUserRole();
  const { t } = useTranslation();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
      toast.success(t('nav.logoutSuccess'));
    } catch (error) {
      toast.error(t('nav.logoutError'));
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/dashboard' },
    { icon: PlusCircle, label: t('nav.createQuiz'), path: '/create-quiz' },
    { icon: Image, label: 'Galeria de Mídia', path: '/media-library' },
    { icon: Users, label: t('nav.crm'), path: '/crm' },
    { icon: BarChart3, label: t('nav.analytics'), path: '/analytics' },
    { icon: MessageSquare, label: t('nav.responses'), path: '/responses' },
    { icon: Webhook, label: t('nav.webhooks'), path: '/webhook-settings' },
  ];

  const supportItems = [
    { icon: HelpCircle, label: t('nav.faq'), path: '/faq' },
    { icon: Settings, label: t('nav.settings'), path: '/settings' },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-xl">
            <span className="text-2xl">🎯</span>
            MasterQuizz
          </SheetTitle>
        </SheetHeader>

        <div className="mt-8 space-y-6">
          {/* Principal */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-3 px-2">
              {t('nav.main')}
            </p>
            <div className="space-y-1">
              {menuItems.map((item) => (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleNavigation(item.path)}
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Suporte */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-3 px-2">
              {t('nav.support')}
            </p>
            <div className="space-y-1">
              {supportItems.map((item) => (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleNavigation(item.path)}
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Conta */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-3 px-2">
              {t('nav.account')}
            </p>
            <div className="space-y-1">
              {isMasterAdmin && (
                <Button
                  variant={isActive('/masteradm') ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleNavigation('/masteradm')}
                >
                  <Shield className="h-4 w-4 mr-3" />
                  {t('nav.masterPanel')}
                </Button>
              )}
              <Button
                variant={isActive('/settings') ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => handleNavigation('/settings')}
              >
                <CreditCard className="h-4 w-4 mr-3" />
                {t('nav.subscription')}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-3" />
                {t('nav.logout')}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
