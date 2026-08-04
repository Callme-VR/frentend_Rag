/**
 * Consistent yellow highlight for the selected AI / embedding model name.
 * Works in both light and dark themes.
 */
interface Props {
  model: string | null | undefined;
  className?: string;
  size?: "sm" | "md";
}

export default function ModelBadge({
  model,
  className = "",
  size = "md",
}: Props) {
  const label = model?.trim() || "—";

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-xs"
      : "px-2.5 py-1 text-sm";

  return (
    <span
      className={`inline-flex max-w-full items-center truncate rounded-full bg-yellow-300 font-bold text-yellow-950 shadow-sm ring-1 ring-yellow-500/40 transition-colors dark:bg-yellow-400 dark:text-yellow-950 dark:ring-yellow-300/50 ${sizeClasses} ${className}`}
      title={label}
    >
      {label}
    </span>
  );
}
