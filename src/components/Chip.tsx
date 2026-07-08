import clsx from "clsx";

export function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "shrink-0 rounded-full border px-3 py-1.5 text-sm transition",
        selected
          ? "border-flame bg-flame/15 text-flame"
          : "border-border bg-surface-alt text-text-dim hover:border-flame/60",
      )}
    >
      {label}
    </button>
  );
}
