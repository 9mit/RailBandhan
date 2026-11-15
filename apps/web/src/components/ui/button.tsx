import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { type ButtonHTMLAttributes, forwardRef } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "royal"
  | "black"
  | "subtle"
  | "amber"
  | "glass"
  | "outline"
  | "ghost"
  | "danger"
  | "brass"
  | "maroon";

export type ButtonSize = "xs" | "sm" | "md" | "lg" | "icon";

const solid =
  "bg-[#24483f] text-[#fff9e9] hover:bg-[#163b31] border border-[#24483f]";
const outline =
  "bg-[#fffefa] text-[#24483f] hover:bg-[#e9eddf] border border-[#cbd2c2]";
const variants: Record<ButtonVariant, string> = {
  primary: solid,
  royal: solid,
  black: "bg-[#192c2d] text-white hover:bg-[#2c4240] border border-[#192c2d]",
  secondary: outline,
  subtle:
    "bg-[#f2e7d8] text-[#8c4328] hover:bg-[#ead8c0] border border-[#dfcdb3]",
  amber: solid,
  brass: solid,
  maroon: solid,
  glass: outline,
  outline,
  ghost: "text-[#425848] hover:bg-[#e7ecdd] border border-transparent",
  danger: "bg-[#a73d2b] text-white hover:bg-[#8b2d1f] border border-[#a73d2b]",
};

const sizes: Record<ButtonSize, string> = {
  xs: "h-7 px-2.5 text-xs rounded-lg gap-1.5",
  sm: "h-9 px-3.5 text-xs font-medium rounded-xl gap-2",
  md: "h-11 px-4 text-sm font-medium rounded-xl gap-2",
  lg: "h-12 px-6 text-base font-semibold rounded-xl gap-2.5",
  icon: "h-10 w-10 p-0 rounded-xl justify-center items-center",
};

export function buttonStyles(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(
    "rb-ui-button inline-flex items-center justify-center font-medium gap-2 transition-colors",
    variants[variant],
    sizes[size],
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "rb-ui-button inline-flex items-center justify-center font-medium select-none cursor-pointer",
          "transition-colors duration-150 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3155E7]/50 focus-visible:ring-offset-1 focus-visible:ring-offset-white",
          "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
        aria-busy={isLoading || undefined}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-current shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && (
          <span className="shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
