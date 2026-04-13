"use client";

import { type InputHTMLAttributes, type SelectHTMLAttributes } from "react";

interface BaseProps {
  label: string;
  error?: string;
}

interface InputProps
  extends BaseProps,
    InputHTMLAttributes<HTMLInputElement> {
  as?: "input";
  options?: never;
}

interface SelectProps
  extends BaseProps,
    Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  as: "select";
  options: { value: string; label: string }[];
}

type GlassInputProps = InputProps | SelectProps;

const fieldClasses =
  "w-full bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.15)] rounded-xl text-white px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent-teal placeholder:text-text-muted";

const errorClasses =
  "border-red-500/50 focus:border-red-500";

export default function GlassInput(props: GlassInputProps) {
  const { label, error, as = "input", className, ...rest } = props;

  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <label className="text-sm text-text-secondary font-medium">
        {label}
      </label>

      {as === "select" ? (
        <select
          className={`${fieldClasses} ${error ? errorClasses : ""}`}
          {...(rest as SelectHTMLAttributes<HTMLSelectElement>)}
        >
          <option value="" className="bg-[#0a1628]">
            Select...
          </option>
          {(props as SelectProps).options.map((o) => (
            <option key={o.value} value={o.value} className="bg-[#0a1628]">
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          className={`${fieldClasses} ${error ? errorClasses : ""}`}
          {...(rest as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}

      {error && (
        <span className="text-xs text-red-400">{error}</span>
      )}
    </div>
  );
}
