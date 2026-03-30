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

        {/* ✅ Preview real — WYSIWYG */}
        {notifications.length > 0 && (
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Preview (ao vivo)</p>
            <SocialProofBlockPreview block={block as any} />
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Configure estilo, posição, intervalo e avatar no painel de propriedades →
        </p>
      </CardContent>
    </Card>
  );
};
