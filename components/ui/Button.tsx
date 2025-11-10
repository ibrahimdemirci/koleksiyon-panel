"use client";

import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", fullWidth = false, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-65";

    const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
      primary:
        "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 focus-visible:ring-indigo-500/30",
      secondary:
        "bg-white/90 text-slate-900 shadow-md shadow-slate-900/10 ring-1 ring-slate-200 hover:bg-white focus-visible:ring-indigo-500/20",
      ghost:
        "text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400/30",
    };

    const classes = [
      baseStyles,
      variants[variant],
      fullWidth ? "w-full" : "",
      className ?? "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        className={classes}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

