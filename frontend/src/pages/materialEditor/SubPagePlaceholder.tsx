import type { ComponentType } from "react";

interface SubPagePlaceholderProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

export function SubPagePlaceholder({
  icon: Icon,
  title,
  description,
}: SubPagePlaceholderProps) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-ink-50 p-6">
      <div className="card max-w-md rounded-xl px-6 py-16 text-center">
        <Icon className="mx-auto h-12 w-12 text-ink-300" />
        <h2 className="mt-4 text-base font-semibold text-ink-900">{title}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
          {description}
        </p>
      </div>
    </div>
  );
}
