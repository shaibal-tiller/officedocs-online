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
      <div className={cn("flex items-center gap-2", className)}>
        <span className="text-foreground font-medium whitespace-nowrap">{label}:</span>
        <span className="bg-tiller-field px-3 py-1 min-w-[100px] flex-1">{value || "\u00A0"}</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      <span className="text-foreground font-medium">{label}</span>
      <div className="bg-tiller-field px-3 py-2">{value || "\u00A0"}</div>
    </div>
  );
}
