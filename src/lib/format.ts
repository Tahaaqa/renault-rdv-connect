import { format, formatDistanceToNow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export const fmtDateLong = (iso: string) =>
  format(typeof iso === "string" ? parseISO(iso) : iso, "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr });

export const fmtDate = (iso: string) =>
  format(typeof iso === "string" ? parseISO(iso) : iso, "d MMMM yyyy", { locale: fr });

export const fmtDateShort = (iso: string) =>
  format(typeof iso === "string" ? parseISO(iso) : iso, "dd/MM/yy", { locale: fr });

export const fmtTime = (iso: string) =>
  format(typeof iso === "string" ? parseISO(iso) : iso, "HH'h'mm", { locale: fr });

export const fmtDayMonth = (iso: string) =>
  format(typeof iso === "string" ? parseISO(iso) : iso, "d MMM", { locale: fr });

export const fmtRelative = (iso: string) =>
  formatDistanceToNow(typeof iso === "string" ? parseISO(iso) : iso, { addSuffix: true, locale: fr });

export const fmtPhone = (raw: string) => {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("216") && digits.length >= 11) {
    const local = digits.slice(3);
    return `+216 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 8)}`;
  }
  return raw;
};

export const fmtPlate = (raw: string) => raw.toUpperCase().trim();

export const initialsOf = (nom?: string | null, prenom?: string | null) => {
  const a = (prenom?.[0] ?? "").toUpperCase();
  const b = (nom?.[0] ?? "").toUpperCase();
  return (a + b) || "?";
};
