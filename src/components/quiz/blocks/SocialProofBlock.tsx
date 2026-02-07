import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SocialProofBlock as SocialProofBlockType } from "@/types/blocks";

interface SocialProofBlockProps {
  block: SocialProofBlockType;
  onChange: (block: SocialProofBlockType) => void;
}

export const SocialProofBlock = ({ block, onChange }: SocialProofBlockProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % block.notifications.length);
    }, block.interval * 1000);
    return () => clearInterval(interval);
  }, [block.notifications.length, block.interval]);

  const addNotification = () => {
    onChange({
      ...block,
      notifications: [
        ...block.notifications,
        { name: 'Nome do Cliente', action: 'acabou de comprar', time: 'agora' }
      ]
    });
  };

  const updateNotification = (index: number, field: keyof (typeof block.notifications)[0], value: string) => {
    const newNotifications = [...block.notifications];
    newNotifications[index] = { ...newNotifications[index], [field]: value };
    onChange({ ...block, notifications: newNotifications });
  };

  const removeNotification = (index: number) => {
    if (block.notifications.length <= 1) return;
    onChange({
      ...block,
      notifications: block.notifications.filter((_, i) => i !== index)
    });
  };

  const currentNotification = block.notifications[currentIndex];

  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <span>🔔 Bloco Social Proof Animado</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Estilo</Label>
            <Select
              value={block.style || 'toast'}
              onValueChange={(v) => onChange({ ...block, style: v as SocialProofBlockType['style'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toast">Toast (canto)</SelectItem>
                <SelectItem value="banner">Banner (topo)</SelectItem>
                <SelectItem value="floating">Flutuante</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Posição</Label>
            <Select
              value={block.position || 'bottom-left'}
              onValueChange={(v) => onChange({ ...block, position: v as SocialProofBlockType['position'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom-left">Inferior Esquerdo</SelectItem>
                <SelectItem value="bottom-right">Inferior Direito</SelectItem>
                <SelectItem value="top-left">Superior Esquerdo</SelectItem>
                <SelectItem value="top-right">Superior Direito</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Intervalo (segundos)</Label>
            <Input
              type="number"
              min={1}
              value={block.interval}
              onChange={(e) => onChange({ ...block, interval: Number(e.target.value) || 5 })}
            />
          </div>
          <div className="flex items-center gap-2 pt-0 sm:pt-6">
            <Switch
              checked={block.showAvatar ?? true}
              onCheckedChange={(checked) => onChange({ ...block, showAvatar: checked })}
            />
            <Label className="text-sm whitespace-nowrap">Mostrar avatar</Label>
          </div>
        </div>

        {/* Notifications Editor */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Notificações (editáveis)</Label>
            <Button variant="outline" size="sm" onClick={addNotification}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>

          {block.notifications.map((notification, index) => (
            <div key={index} className="p-3 border rounded-lg space-y-2 bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Notificação {index + 1}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeNotification(index)}
                  disabled={block.notifications.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                  value={notification.name}
                  onChange={(e) => updateNotification(index, 'name', e.target.value)}
                  placeholder="Nome"
                />
                <Input
                  value={notification.action}
                  onChange={(e) => updateNotification(index, 'action', e.target.value)}
                  placeholder="acabou de comprar"
                />
                <Input
                  value={notification.time}
                  onChange={(e) => updateNotification(index, 'time', e.target.value)}
                  placeholder="agora"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Preview */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Preview (rotaciona a cada {block.interval}s):</p>
          
          <div className="relative min-h-[80px] flex items-center justify-center">
            <div
              className={cn(
                "animate-fade-in transition-all duration-300",
                block.style === 'toast' && "bg-background border shadow-lg rounded-lg p-3 max-w-xs",
                block.style === 'banner' && "bg-primary text-primary-foreground px-4 py-2 rounded-md w-full text-center",
                block.style === 'floating' && "bg-background border-2 border-primary shadow-xl rounded-full px-4 py-2"
              )}
            >
              <div className="flex items-center gap-3">
                {block.showAvatar && (
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div className={block.style === 'banner' ? 'text-center' : ''}>
                  <p className={cn("text-sm", block.style !== 'banner' && "font-medium")}>
                    <span className="font-semibold">{currentNotification?.name}</span>{' '}
                    {currentNotification?.action}
                  </p>
                  <p className={cn("text-xs", block.style === 'banner' ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                    {currentNotification?.time}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};