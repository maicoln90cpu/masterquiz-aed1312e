import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useResourceLimits } from "@/hooks/useResourceLimits";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface Notification {
  id: string;
  type: 'warning' | 'danger';
  title: string;
  message: string;
  resource: string;
}

export const InAppNotifications = () => {
  const { limits } = useResourceLimits();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!limits) return;

    const newNotifications: Notification[] = [];

    // Verificar quizzes
    if (limits.quizzes.isAtLimit) {
      newNotifications.push({
        id: 'quiz-limit',
        type: 'danger',
        title: t('notifications.quizLimitReached'),
        message: t('notifications.quizLimitMessage', { 
          current: limits.quizzes.current, 
          limit: limits.quizzes.limit 
        }),
        resource: 'quizzes'
      });
    } else if (limits.quizzes.isNearLimit) {
      newNotifications.push({
        id: 'quiz-warning',
        type: 'warning',
        title: t('notifications.quizNearLimit'),
        message: t('notifications.quizNearMessage', { 
          percentage: limits.quizzes.percentage.toFixed(0),
          current: limits.quizzes.current,
          limit: limits.quizzes.limit
        }),
        resource: 'quizzes'
      });
    }

    // Verificar respostas
    if (limits.responses.isAtLimit) {
      newNotifications.push({
        id: 'response-limit',
        type: 'danger',
        title: t('notifications.responseLimitReached'),
        message: t('notifications.responseLimitMessage', { 
          current: limits.responses.current, 
          limit: limits.responses.limit 
        }),
        resource: 'responses'
      });
    } else if (limits.responses.isNearLimit) {
      newNotifications.push({
        id: 'response-warning',
        type: 'warning',
        title: t('notifications.responseNearLimit'),
        message: t('notifications.responseNearMessage', { 
          percentage: limits.responses.percentage.toFixed(0),
          current: limits.responses.current,
          limit: limits.responses.limit
        }),
        resource: 'responses'
      });
    }

    // Verificar leads
    if (limits.leads.isAtLimit) {
      newNotifications.push({
        id: 'lead-limit',
        type: 'danger',
        title: t('notifications.leadLimitReached'),
        message: t('notifications.leadLimitMessage', { 
          current: limits.leads.current, 
          limit: limits.leads.limit 
        }),
        resource: 'leads'
      });
    } else if (limits.leads.isNearLimit) {
      newNotifications.push({
        id: 'lead-warning',
        type: 'warning',
        title: t('notifications.leadNearLimit'),
        message: t('notifications.leadNearMessage', { 
          percentage: limits.leads.percentage.toFixed(0),
          current: limits.leads.current,
          limit: limits.leads.limit
        }),
        resource: 'leads'
      });
    }

    setNotifications(newNotifications);
    
    // Verificar quais notificações já foram vistas
    const seenNotifications = JSON.parse(localStorage.getItem('seenNotifications') || '[]');
    const unseenCount = newNotifications.filter(n => !seenNotifications.includes(n.id)).length;
    setUnreadCount(unseenCount);
  }, [limits, t]);

  const handleOpenChange = (open: boolean) => {
    if (open && notifications.length > 0) {
      // Marcar todas como vistas
      const notificationIds = notifications.map(n => n.id);
      localStorage.setItem('seenNotifications', JSON.stringify(notificationIds));
      setUnreadCount(0);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    navigate('/settings');
  };

  if (notifications.length === 0) return null;

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t('notifications.title')}</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {unreadCount} {t('notifications.new')}
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {t('notifications.noNotifications')}
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="flex flex-col items-start p-3 cursor-pointer"
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start gap-2 w-full">
                <div className={`mt-0.5 ${
                  notification.type === 'danger' ? 'text-destructive' : 'text-orange-500'
                }`}>
                  {notification.type === 'danger' ? '🚨' : '⚠️'}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{notification.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {notification.message}
                  </div>
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-center justify-center text-primary cursor-pointer"
          onClick={() => navigate('/settings')}
        >
          {t('notifications.viewPlans')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
