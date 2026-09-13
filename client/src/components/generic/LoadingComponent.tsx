import { cn } from "../../utils/cn";

export default function LoadingComponent({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("flex h-full items-center justify-center", className)}>
      <div className="flex flex-col items-center gap-6 pt-8">
        <div className="mt-5 flex items-end gap-2">
          <div className="h-4 w-4 animate-pulse rounded-full bg-black" />
          <div className="h-4 w-4 animate-pulse rounded-full bg-black [animation-delay:150ms]" />
          <div className="h-4 w-4 animate-pulse rounded-full bg-black [animation-delay:300ms]" />
        </div>

        <p className="font-shadows text-2xl font-bold">Carregando...</p>
      </div>
    </div>
  );
}
