export function VehiclePlate({ value, size = "md" }: { value: string; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border border-yellow/40 bg-renault-black text-yellow font-mono font-bold tracking-wider ${cls}`}
      style={{ letterSpacing: "0.06em" }}
    >
      {value}
    </span>
  );
}
