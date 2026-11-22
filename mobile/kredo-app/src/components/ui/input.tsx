import { TextInput, type TextInputProps } from "react-native";
import { cn } from "@/lib/utils";
import { PresetText } from "./text";

export interface InputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string;
  className?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <>
      {label && <PresetText kind="captionMuted">{label}</PresetText>}
      <TextInput
        {...props}
        className={cn("bg-card border border-border radius-card p-4 text-ink font-sans", error && "border-red", className) as any}
      />
      {error && <PresetText kind="captionMuted" className="mt-1">{error}</PresetText>}
    </>
  );
}
