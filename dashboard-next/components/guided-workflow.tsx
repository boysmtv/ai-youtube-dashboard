import Link from "next/link";
import type { OperatorWorkflowStep } from "../lib/operator-workflow";
import { operatorStatusLabel, operatorStatusTone } from "../lib/operator-workflow";

export function GuidedWorkflow({
  eyebrow,
  title,
  description,
  steps,
  summaryLabel = "Langkah berikutnya",
  summaryAction,
  summaryLink,
}: Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  steps: OperatorWorkflowStep[];
  summaryLabel?: string;
  summaryAction?: string;
  summaryLink?: string;
}>) {
  const currentStep = steps.find((step) => step.status === "current") || steps.find((step) => step.status === "blocked") || steps[0];
  const nextAction = summaryAction || currentStep?.recommendedAction;
  const nextLink = summaryLink || currentStep?.targetLink;

  return (
    <section className="ta-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="ta-label text-brand-600">{eyebrow}</p>
          <h3 className="mt-2 text-xl font-semibold text-gray-900">{title}</h3>
          <p className="mt-2 max-w-3xl text-sm text-gray-500">{description}</p>
        </div>
        {nextAction && nextLink ? (
          <div className="rounded-2xl border border-brand-100 bg-brand-25 px-4 py-3 text-sm">
            <p className="ta-label text-brand-600">{summaryLabel}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <strong className="text-gray-900">{nextAction}</strong>
              <Link className="ta-button" href={nextLink}>
                Lanjut
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        {steps.map((step) => (
          <article key={step.key} className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gray-100 text-sm font-bold text-gray-700">{step.number}</div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-base font-semibold text-gray-900">{step.label}</h4>
                    <span className={`ta-status ${operatorStatusTone(step.status)}`}>{operatorStatusLabel(step.status)}</span>
                    {step.count !== undefined && step.count !== null ? <span className="ta-status bg-gray-100 text-gray-700">{step.count}</span> : null}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{step.explanation}</p>
                </div>
              </div>
            </div>
            {step.blockerReason ? <p className="mt-3 rounded-xl border border-warning-200 bg-warning-50 px-3 py-2 text-sm text-warning-900">{step.blockerReason}</p> : null}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-sm text-gray-500">{step.recommendedAction}</span>
              <Link className="rounded-lg border border-brand-100 bg-brand-25 px-3 py-2 text-sm font-semibold text-brand-700 hover:border-brand-200" href={step.targetLink}>
                Buka
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
