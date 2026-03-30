import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import type { SocialProofBlock as SocialProofBlockType } from "@/types/blocks";
import { SocialProofBlockPreview } from "../preview/InteractiveBlockPreviews";

interface SocialProofBlockProps {
  block: SocialProofBlockType;
  onChange: (block: SocialProofBlockType) => void;
}

export const SocialProofBlock = ({ block, onChange }: SocialProofBlockProps) => {
  const notifications = block.notifications || [];


  const addNotification = () => {
    onChange({ ...block, notifications: [...notifications, { name: 'Nome do Cliente', action: 'acabou de comprar', time: 'agora' }] });
  };

  const updateNotification = (index: number, field: keyof (typeof notifications)[0], value: string) => {
    const newNotifications = [...notifications];
    newNotifications[index] = { ...newNotifications[index], [field]: value };
    onChange({ ...block, notifications: newNotifications });
  };

  const removeNotification = (index: number) => {
    if (notifications.length <= 1) return;
    onChange({ ...block, notifications: notifications.filter((_, i) => i !== index) });
  };

  

  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span>🔔 Bloco Social Proof Animado</span>
        </div>

        {/* Content: Notifications editor */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Notificações</Label>
            <Button variant="outline" size="sm" onClick={addNotification}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>

          {notifications.map((notification, index) => (
            <div key={index} className="p-3 border rounded-lg space-y-2 bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Notificação {index + 1}</span>
                <Button variant="ghost" size="sm" onClick={() => removeNotification(index)} disabled={notifications.length <= 1}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input value={notification.name} onChange={(e) => updateNotification(index, 'name', e.target.value)} placeholder="Nome" />
                <Input value={notification.action} onChange={(e) => updateNotification(index, 'action', e.target.value)} placeholder="acabou de comprar" />
                <Input value={notification.time} onChange={(e) => updateNotification(index, 'time', e.target.value)} placeholder="agora" />
              </div>
            </div>
          ))}
        </div>

        {/* Preview */}
        {notifications.length > 0 && currentNotification && (
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Preview ({interval}s):</p>
            <div className="flex items-center justify-center">
              <div className={cn(
                "animate-fade-in transition-all duration-300",
                block.style === 'toast' && "bg-background border shadow-lg rounded-lg p-3 max-w-xs",
                block.style === 'banner' && "bg-primary text-primary-foreground px-4 py-2 rounded-md w-full text-center",
                block.style === 'floating' && "bg-background border-2 border-primary shadow-xl rounded-full px-4 py-2"
              )}>
                <div className="flex items-center gap-3">
                  {block.showAvatar && (
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm"><span className="font-semibold">{currentNotification.name}</span> {currentNotification.action}</p>
                    <p className="text-xs text-muted-foreground">{currentNotification.time}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Configure estilo, posição, intervalo e avatar no painel de propriedades →
        </p>
      </CardContent>
    </Card>
  );
};
