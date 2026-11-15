import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, forwardRef, useId } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const descriptionId = `${inputId}-description`;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold uppercase tracking-wider text-[#4f654f]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3.5 flex items-center text-[#4f654f]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            aria-invalid={!!error || undefined}
            aria-describedby={error || helperText ? descriptionId : undefined}
            className={cn(
              "rb-ui-input flex h-12 w-full rounded-md px-3.5 py-2 text-sm transition-colors placeholder:text-[#83907c] disabled:opacity-60",
              leftIcon && "pl-10",
              rightIcon && "pr-12",
              error && "border-red-600",
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 flex items-center text-[#4f654f]">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p
            id={descriptionId}
            role="alert"
            className="text-xs font-medium text-[#a73d2b]"
          >
            {error}
          </p>
        ) : helperText ? (
          <p id={descriptionId} className="text-xs text-[#62716d]">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
