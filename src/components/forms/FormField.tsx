import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  value: string;
  className?: string;
  inline?: boolean;
}

export function FormField({ label, value, className, inline = false }: FormFieldProps) {
  if (inline) {
    return (
      <div className={cn("flex items-center gap-2", className)} style={{ alignItems: 'center' }}>
        <span className="text-foreground font-medium whitespace-nowrap" style={{ lineHeight: '1.5', verticalAlign: 'middle' }}>{label}:</span>
        <span className="bg-tiller-field px-3 py-1 min-w-[100px] flex-1" style={{ lineHeight: '1.5', verticalAlign: 'middle', display: 'inline-flex', alignItems: 'center', minHeight: '28px' }}>{value || "\u00A0"}</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      <span className="text-foreground font-medium" style={{ lineHeight: '1.5' }}>{label}</span>
      <div className="bg-tiller-field px-3 py-2" style={{ lineHeight: '1.5', minHeight: '36px', display: 'flex', alignItems: 'center' }}>{value || "\u00A0"}</div>
    </div>
  );
}
