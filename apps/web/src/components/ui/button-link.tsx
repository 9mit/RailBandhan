import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { buttonStyles, type ButtonSize, type ButtonVariant } from "./button";
type Props = Omit<ComponentProps<typeof Link>, "className" | "children"> & {
  className?: string;
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  disabled?: boolean;
  isLoading?: boolean;
};
export function ButtonLink({
  className,
  children,
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  disabled,
  isLoading,
  ...props
}: Props) {
  const content = (
    <>
      {leftIcon}
      <span>{children}</span>
      {rightIcon}
    </>
  );
  if (disabled || isLoading)
    return (
      <span
        className={buttonStyles(variant, size, className)}
        aria-disabled="true"
      >
        {content}
      </span>
    );
  return (
    <Link {...props} className={buttonStyles(variant, size, className)}>
      {content}
    </Link>
  );
}
