import { cn } from "@/lib/utils";

type BizzBitLogoProps = {
  className?: string;
  textSizeClassName?: string;
  onClick?: () => void;
};

export default function BizzBitLogo({
  className,
  textSizeClassName = "text-2xl",
  onClick,
}: BizzBitLogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <div
        className={cn("flex h-auto leading-none font-extrabold", textSizeClassName, onClick ? "cursor-pointer" : "")}
        onClick={onClick}
      >
        <div className="flex items-start text-foreground">Bizz</div>
        <div className="flex items-start text-[#3B82F6]" style={{ marginTop: "0.2em" }}>
          Bit
        </div>
      </div>
    </div>
  );
}
