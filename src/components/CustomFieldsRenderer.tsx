import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CustomField } from '@/hooks/useCustomFields';

interface CustomFieldsRendererProps {
  fields: CustomField[];
  values: Record<string, string>;
  onChange: (fieldId: string, value: string) => void;
}

export function CustomFieldsRenderer({ fields, values, onChange }: CustomFieldsRendererProps) {
  if (fields.length === 0) return null;

  return (
    <>
      {fields.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label>
            {field.name}
            {field.is_required && <span className="text-destructive ml-1">*</span>}
          </Label>

          {field.field_type === 'text' && (
            <Input
              value={values[field.id] || ''}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder={field.name}
              required={field.is_required}
            />
          )}

          {field.field_type === 'textarea' && (
            <Textarea
              value={values[field.id] || ''}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder={field.name}
              rows={3}
              required={field.is_required}
            />
          )}

          {field.field_type === 'number' && (
            <Input
              type="number"
              value={values[field.id] || ''}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder={field.name}
              required={field.is_required}
            />
          )}

          {field.field_type === 'date' && (
            <Input
              type="date"
              value={values[field.id] || ''}
              onChange={(e) => onChange(field.id, e.target.value)}
              required={field.is_required}
            />
          )}

          {field.field_type === 'select' && field.options && (
            <Select
              value={values[field.id] || ''}
              onValueChange={(v) => onChange(field.id, v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Selecione ${field.name}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {field.field_type === 'checkbox' && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={values[field.id] === 'true'}
                onCheckedChange={(checked) => onChange(field.id, String(checked))}
              />
              <span className="text-sm text-muted-foreground">{field.name}</span>
            </div>
          )}
        </div>
      ))}
    </>
  );
}
