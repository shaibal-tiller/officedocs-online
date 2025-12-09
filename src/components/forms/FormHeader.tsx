import tillerLogo from "@/assets/tiller-logo.jpg";
import headerbg from "@/assets/header-bg.jpg";
interface FormHeaderProps {
  title: string;
  refNumber?: string;
}

export function FormHeader({ title, refNumber="................" }: FormHeaderProps) {
  return (
    <div className="bg-tiller-header py-4 px-6 border-b-4 border-tiller-green"
      style={{ backgroundImage: `url(${headerbg})` }}>
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start">
          <img src={tillerLogo} alt="Tiller Logo" className="h-16 w-auto" />
          {refNumber && (
            <p className="text-xs text-foreground mt-1 font-semibold">
              Ref: {refNumber}
            </p>
          )}
        </div>
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