"use client";

import * as React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;

    return (
      <div className={["flex flex-col gap-1", className ?? ""].join(" ").trim()}>
        {label ? (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        ) : null}
        <input
          id={inputId}
          ref={ref}
          className="w-full rounded-xl border border-slate-200/70 bg-white/90 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm shadow-slate-900/5 transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-100/80"
          {...props}
        />
        {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      </div>
    );
  },
);

Input.displayName = "Input";

