import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

export interface CustomField {
  id: string;
  field_name: string;
  field_type: 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'checkbox';
  field_options?: string[];
  is_required: boolean;
  order_number: number;
}

interface CustomFieldBuilderProps {
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
}

export const CustomFieldBuilder = ({ fields, onChange }: CustomFieldBuilderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newField, setNewField] = useState<Partial<CustomField>>({
    field_name: '',
    field_type: 'text',
    is_required: false,
    field_options: []
  });
  const [optionsText, setOptionsText] = useState('');

  const addField = () => {
    if (!newField.field_name) return;

    const field: CustomField = {
      id: Math.random().toString(36).substr(2, 9),
      field_name: newField.field_name,
      field_type: newField.field_type as CustomField['field_type'],
      is_required: newField.is_required || false,
      order_number: fields.length,
      field_options: newField.field_type === 'select' 
        ? optionsText.split('\n').filter(o => o.trim())
        : undefined
    };

    onChange([...fields, field]);
    setNewField({ field_name: '', field_type: 'text', is_required: false, field_options: [] });
    setOptionsText('');
    setIsOpen(false);
  };

  const removeField = (id: string) => {
    onChange(fields.filter(f => f.id !== id));
  };

  const fieldTypeLabels: Record<CustomField['field_type'], string> = {
    text: 'Texto Curto',
    email: 'E-mail',
    phone: 'Telefone',
    select: 'Seleção',
    textarea: 'Texto Longo',
    checkbox: 'Checkbox'
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Campos Personalizados</Label>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Campo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Campo Personalizado</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome do Campo</Label>
                <Input
                  value={newField.field_name}
                  onChange={(e) => setNewField({ ...newField, field_name: e.target.value })}
                  placeholder="Ex: Empresa, Cargo, etc."
                />
              </div>

              <div>
                <Label>Tipo de Campo</Label>
                <Select
                  value={newField.field_type}
                  onValueChange={(value) => setNewField({ ...newField, field_type: value as CustomField['field_type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Texto Curto</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="phone">Telefone</SelectItem>
                    <SelectItem value="select">Seleção</SelectItem>
                    <SelectItem value="textarea">Texto Longo</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newField.field_type === 'select' && (
                <div>
                  <Label>Opções (uma por linha)</Label>
                  <Textarea
                    value={optionsText}
                    onChange={(e) => setOptionsText(e.target.value)}
                    placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                    rows={4}
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  checked={newField.is_required}
                  onCheckedChange={(checked) => setNewField({ ...newField, is_required: checked })}
                />
                <Label>Campo obrigatório</Label>
              </div>

              <Button onClick={addField} className="w-full">
                Adicionar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {fields.length > 0 && (
        <div className="space-y-2">
          {fields.map((field) => (
            <Card key={field.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                  <div className="flex-1">
                    <p className="font-medium">{field.field_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {fieldTypeLabels[field.field_type]}
                      {field.is_required && ' • Obrigatório'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeField(field.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
