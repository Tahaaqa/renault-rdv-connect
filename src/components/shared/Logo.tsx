export function Logo({ size = 32, hideText = false }: { size?: number; hideText?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="grid place-items-center rounded-lg bg-yellow text-renault-black font-display font-extrabold yellow-glow"
        style={{ width: size, height: size, fontSize: size * 0.6 }}
      >
        R
      </div>
      {!hideText && (
        <div className="flex items-baseline gap-2">
          <span className="font-display font-semibold">Renault</span>
          <span className="h-3 w-px bg-yellow/40" />
          <span className="font-sans font-light text-muted-foreground">RDV</span>
        </div>
      )}
    </div>
  );
}
