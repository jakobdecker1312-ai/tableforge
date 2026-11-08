import type { Role } from "@/liveblocks.config";
import { initials } from "@/lib/map";
import { CrownIcon } from "@/components/ui/Icons";

export default function Avatar({
  name,
  color,
  role,
  size = 32,
  className = "",
}: {
  name: string;
  color: string;
  role: Role;
  size?: number;
  className?: string;
}) {
  return (
    <span
      title={`${name || "Unbekannt"} (${role === "dm" ? "DM" : "Spieler"})`}
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full border-2 border-stone-900 font-bold text-white shadow ${className}`}
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.38 }}
    >
      {initials(name)}
      {role === "dm" && (
        <span className="absolute -right-1 -top-1.5 rounded-full bg-amber-400 p-0.5 text-stone-900">
          <CrownIcon className="h-2.5 w-2.5" />
        </span>
      )}
    </span>
  );
}
