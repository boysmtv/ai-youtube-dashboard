"use client";

import { useFormStatus } from "react-dom";

type Tone = "primary" | "warning" | "danger" | "success" | "muted";

const toneClasses: Record<Tone, string> = {
  primary: "bg-brand-500 text-white hover:bg-brand-600",
  warning: "bg-warning-50 text-warning-700 hover:bg-warning-50/70",
  danger: "bg-error-50 text-error-700 hover:bg-error-50/70",
  success: "bg-success-50 text-success-700 hover:bg-success-50/70",
  muted: "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
};

export function ConfirmSubmitButton({
  children,
  message,
  tone = "primary",
  className = "",
  pendingText = "Processing...",
}: Readonly<{
  children: React.ReactNode;
  message: string;
  tone?: Tone;
  className?: string;
  pendingText?: string;
}>) {
  const { pending } = useFormStatus();

  return (
    <button
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${toneClasses[tone]} ${className}`}
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!pending && !window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      {pending ? pendingText : children}
    </button>
  );
}
