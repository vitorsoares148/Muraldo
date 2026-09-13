import { cn } from "../../../utils/cn";

type InputDateProps = {
  value: string;
  placeholder?: string;
  type: React.HTMLInputTypeAttribute;
  onChange: (value: string) => void;
  onErrorReset: (reset: boolean) => void;
  error?: boolean;
  className?: string;
  maxLength?: number;
  numeric?: boolean;
  date?: boolean;
};

export default function InputDate({
  value,
  placeholder,
  type,
  onChange,
  onErrorReset,
  error = false,
  className,
  maxLength = 200,
  numeric = false,
  date = false,
}: InputDateProps) {
  const handleChange = (input: string) => {
    if (!date) {
      onChange(input);
      return;
    }

    const numbers = input.replace(/\D/g, "").slice(0, 8);

    let formatted = numbers;

    if (numbers.length > 2) {
      formatted = `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    }

    if (numbers.length > 4) {
      formatted = `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`;
    }

    onChange(formatted);
  };

  return (
    <input
      className={cn(
        "rounded-xl border-5 p-2 pl-4",
        "text-[20px] placeholder:font-semibold placeholder:text-black/50",
        "transition duration-200 ease-in-out focus:outline-0",
        !error && "border-black",
        error && "border-red-500",
        className,
      )}
      placeholder={placeholder}
      type={date ? "text" : type}
      value={value}
      maxLength={date ? 10 : maxLength}
      inputMode={date || numeric ? "numeric" : undefined}
      onFocus={() => onErrorReset(true)}
      onBlur={() => onErrorReset(false)}
      onChange={(event) => handleChange(event.target.value)}
    />
  );
}
