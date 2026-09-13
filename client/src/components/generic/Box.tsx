import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

type BoxProps = {
  children: ReactNode;
  className?: string;
};

export default function Box({ children, className }: BoxProps) {
  return (
    <div
      className={cn(
        "relative z-1 flex flex-col -rotate-1",
        "rounded-sm border-5 border-black/25 p-7",
        "font-shadows text-black",
        "bg-[#FFF4DE]",
        className,
      )}
    >
      <div className="absolute top-1 -left-13 -rotate-47 h-12 w-40 border-5 border-black/12 bg-[#e3d77d]/80" />
      <div className="absolute top-2 -right-11 rotate-47 h-12 w-36 border-5 border-black/12 bg-[#e3d77d]/80" />
      {children}
      <div className="absolute bottom-0 left-0 h-5 w-full bg-black/12"></div>
    </div>
  );
}
