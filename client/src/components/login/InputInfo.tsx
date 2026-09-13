import { cn } from "../../utils/cn";

type InputInfoProps = {
  value: string;
  placeholder?: string;
  type: React.HTMLInputTypeAttribute;
  onChange: (value: string) => void;
  onErrorReset?: (reset: boolean) => void;
  error?: boolean;
  className?: string;
  maxLength?: number;
  numeric?: boolean;
};

export default function InputInfo({
  value,
  placeholder,
  type,
  onChange,
  onErrorReset,
  error = false,
  className,
  maxLength = 200,
  numeric = false,
}: InputInfoProps) {
  return (
    <input
      className={cn(
        "rounded-xl border-5 p-2 pl-4",
        "text-[20px] placeholder:font-semibold placeholder:text-black/50",
        "transition duration-200 ease-in-out focus:outline-0",

        !error && ["border-black"],

        error && ["border-red-500"],

        className,
      )}
      placeholder={placeholder}
      type={type}
      value={value}
      maxLength={maxLength}
      inputMode={numeric ? "decimal" : undefined}
      onFocus={() => onErrorReset && onErrorReset(true)}
      onBlur={() => onErrorReset && onErrorReset(false)}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
