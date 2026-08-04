/**
 * Live health status indicator: green = Healthy, red = Offline/Unhealthy.
 */
interface Props {
  online: boolean;
  /** Optional backend status string (e.g. "healthy"). */
  status?: string | null;
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export default function HealthDot({
  online,
  status,
  showLabel = true,
  size = "md",
  className = "",
}: Props) {
  const isHealthy =
    online &&
    (!status || status.toLowerCase() === "healthy" || status.toLowerCase() === "ok");

  const label = isHealthy ? "Healthy" : online ? "Unhealthy" : "Offline";

  const dotSize = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";

  return (
    <span
      className={`inline-flex items-center gap-2 transition-colors duration-300 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={`Backend status: ${label}`}
    >
      <span className="relative flex items-center justify-center">
        <span
          className={`absolute inline-flex ${dotSize} animate-ping rounded-full opacity-40 ${
            isHealthy ? "bg-green-400" : "bg-red-400"
          }`}
          style={{ animationDuration: "2s" }}
        />
        <span
          className={`relative inline-block ${dotSize} rounded-full transition-colors duration-300 ${
            isHealthy ? "bg-green-500 dark:bg-green-400" : "bg-red-500 dark:bg-red-400"
          }`}
        />
      </span>
      {showLabel && (
        <span
          className={`font-semibold transition-colors duration-300 ${
            size === "sm" ? "text-xs" : "text-sm"
          } ${
            isHealthy
              ? "text-green-700 dark:text-green-300"
              : "text-red-700 dark:text-red-300"
          }`}
        >
          {label}
        </span>
      )}
    </span>
  );
}
