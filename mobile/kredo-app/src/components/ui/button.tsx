import { Pressable, View } from "react-native";
import { cn } from "@/lib/utils";

export interface ButtonProps extends Omit<React.ComponentProps<typeof Pressable>, "children"> {
  children?: React.ReactNode;
  variant?: "solid" | "outline" | "ghost" | "slide";
  size?: "sm" | "md" | "lg";
}

export function Button({ variant = "solid", size = "md", className, disabled, children, ...props }: ButtonProps) {
  const base = "flex-row items-center justify-center border radius-pill font-bold disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<string, string> = {
    solid: "bg-ink text-white border-transparent",
    outline: "border-border text-ink border",
    ghost: "text-ink border-transparent",
    slide: "bg-gradient-to-r from-yellow-dark via-yellow-dark to-yellow-gold text-ink border-transparent shadow-lg shadow-yellow/20",
  };
  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-[12px]",
    md: "px-4 py-3 text-sm",
    lg: "px-6 py-4 text-base",
  };
  return (
    <Pressable {...props} disabled={disabled}>
      <View className={cn(base, variants[variant], sizes[size], className)}>{children}</View>
    </Pressable>
  );
}

export interface CardProps extends React.ComponentProps<typeof View> {
  children: React.ReactNode;
  padded?: boolean;
  raised?: boolean;
}

export function Card({ children, padded = true, raised = true, className, ...props }: CardProps) {
  return (
    <View
      {...props}
      className={cn(
        "bg-card border border-border radius-card",
        padded && "p-4",
        raised && "shadow-sm shadow-ink/10",
        className
      )}
    >
      {children}
    </View>
  );
}
