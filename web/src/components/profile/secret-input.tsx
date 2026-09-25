"use client";

import { useState } from "react";
import { EyeClosedIcon, EyeOpenIcon } from "./icons";

export default function SecretInput({
  id,
  name,
  placeholder,
  autoComplete,
  minLength,
  maxLength,
  pattern,
  inputMode,
  required,
}: {
  id: string;
  name: string;
  placeholder: string;
  autoComplete?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  inputMode?: "numeric" | "text";
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        autoComplete={autoComplete}
        minLength={minLength}
        maxLength={maxLength}
        pattern={pattern}
        inputMode={inputMode}
        required={required}
        className="input w-full pr-10"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide value" : "Show value"}
        aria-pressed={visible}
        className="absolute top-1/2 right-3 -translate-y-1/2"
        style={{ color: "var(--color-text-muted)" }}
      >
        {visible ? <EyeClosedIcon /> : <EyeOpenIcon />}
      </button>
    </div>
  );
}
