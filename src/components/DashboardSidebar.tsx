import { useNavigate, useLocation, Link } from "react-router-dom";
import { 
  Plus, 
  LayoutDashboard, 
  FileQuestion, 
  Users, 
  MessageSquare, 
  BarChart3, 
  Image, 
  Webhook, 
  Settings,
  LogOut,
  Plug
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";

export function DashboardSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { open, setOpen } = useSidebar();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
      
      setUserName(profile?.full_name || user.email?.split('@')[0] || 'User');
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
      toast.success(t('nav.logoutSuccess'));
    } catch (error) {
      toast.error(t('nav.logoutError'));
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const handleScrollToSection = (sectionId: string) => {
    if (location.pathname !== '/dashboard') {
      navigate('/dashboard');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        element?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      element?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const mainItems = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/dashboard', onClick: undefined },
    { icon: FileQuestion, label: t('nav.myQuizzes'), path: '/meus-quizzes', onClick: undefined },
    { icon: Users, label: t('nav.crm'), path: '/crm', onClick: undefined },
    { icon: MessageSquare, label: t('nav.responses'), path: '/responses', onClick: undefined },
    { icon: BarChart3, label: t('nav.analytics'), path: '/analytics', onClick: undefined },
    { icon: Image, label: t('nav.gallery'), path: '/media-library', onClick: undefined },
  ];

  const secondaryItems = [
    { icon: Plug, label: t('nav.integrations'), path: '/integrations' },
    { icon: Webhook, label: t('nav.webhooks'), path: '/webhook-settings' },
    { icon: Settings, label: t('nav.settings'), path: '/settings' },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={logo} alt="MasterQuiz" className="h-8 w-8 rounded-md object-contain" />
            {open && <span className="font-bold text-lg">MasterQuiz</span>}
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Botão Criar Quiz destacado */}
        <div className="p-4">
          <Button 
            className="w-full gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            onClick={() => navigate('/create-quiz')}
          >
            <Plus className="h-4 w-4" />
            {open && <span>{t('dashboard.createQuiz')}</span>}
          </Button>
        </div>

        <Separator />

        {/* Menu Principal */}
        <SidebarGroup>
          {open && <SidebarGroupLabel>{t('nav.main')}</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton 
                    onClick={() => item.onClick ? item.onClick() : navigate(item.path)}
                    isActive={isActive(item.path)}
                    tooltip={!open ? item.label : undefined}
                  >
                    <item.icon className="h-4 w-4" />
                    {open && <span>{item.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator />

        {/* Menu Secundário */}
        <SidebarGroup>
          {open && <SidebarGroupLabel>{t('nav.other')}</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton 
                    onClick={() => navigate(item.path)}
                    isActive={isActive(item.path)}
                    tooltip={!open ? item.label : undefined}
                  >
                    <item.icon className="h-4 w-4" />
                    {open && <span>{item.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer com usuário e logout */}
      <SidebarFooter className="border-t p-4">
        <div className="space-y-2">
          {open && (
            <div className="px-2 py-1 text-sm text-muted-foreground truncate">
              {userName}
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            {open && <span>{t('nav.logout')}</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
