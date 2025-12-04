import tillerLogo from "@/assets/tiller-logo.jpg";

interface FormHeaderProps {
  title: string;
}

export function FormHeader({ title }: FormHeaderProps) {
  return (
    <div className="bg-tiller-header py-4 px-6 border-b-4 border-tiller-green">
      <div className="flex items-center justify-between">
        <img src={tillerLogo} alt="Tiller Logo" className="h-16 w-auto" />
        <h1 className="text-xl md:text-2xl font-bold text-tiller-green uppercase tracking-wide">
          {title}
        </h1>
        <div className="text-right">
          <p className="text-lg font-semibold text-tiller-green tracking-widest">Tiller</p>
          <p className="text-xs text-muted-foreground italic">easing spatial solution</p>
        </div>
      </div>
    </div>
  );
}
