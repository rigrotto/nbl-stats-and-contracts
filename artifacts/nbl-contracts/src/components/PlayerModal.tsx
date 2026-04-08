import { useEffect, useRef } from "react";
import { X, User } from "lucide-react";
import { Player } from "@/lib/fetchContracts";

interface Props {
  player: Player;
  teamName: string;
  teamLogo: string;
  onClose: () => void;
}

function seasonYear(label: string) {
  return parseInt(label.slice(0, 4), 10);
}

function DotColor({ team, detail }: { team: string; detail: string }) {
  const lower = (team + " " + detail).toLowerCase();
  if (lower.includes("fa") || lower.includes("free agent") || lower.includes("ufa") || lower.includes("rfa"))
    return "bg-amber-400";
  if (lower.includes("opt")) return "bg-blue-400";
  if (!team && detail) return "bg-muted-foreground/40";
  return "bg-green-400";
}

export default function PlayerModal({ player, teamName, teamLogo, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const allSeasons = Object.keys(player.seasons).sort(
    (a, b) => seasonYear(a) - seasonYear(b)
  );

  const currentSeasons = ["2024-25", "2025-26", "2026-27", "2027-28"];
  const historicalSeasons = allSeasons.filter((s) => !currentSeasons.includes(s));
  const futureCurrentSeasons = allSeasons.filter((s) => currentSeasons.includes(s));

  const hasHistory = historicalSeasons.some(
    (s) => player.seasons[s].team || player.seasons[s].detail
  );

  function StatusBadge({ value }: { value: string }) {
    if (!value) return null;
    const lower = value.toLowerCase();
    let cls = "bg-secondary/60 text-secondary-foreground border border-border";
    if (lower.startsWith("local")) cls = "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
    else if (lower === "import") cls = "bg-purple-500/15 text-purple-400 border border-purple-500/30";
    else if (lower.includes("next star")) cls = "bg-orange-500/15 text-orange-400 border border-orange-500/30";
    else if (lower.includes("srp")) cls = "bg-sky-500/15 text-sky-400 border border-sky-500/30";
    return <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>{value}</span>;
  }

  function SeasonRow({ label, isCurrent }: { label: string; isCurrent: boolean }) {
    const s = player.seasons[label];
    if (!s) return null;
    const empty = !s.team && !s.detail;
    if (!isCurrent && empty) return null;
    const dotCls = DotColor(s);
    return (
      <div className={`flex items-start gap-3 py-2.5 px-3 rounded-lg ${isCurrent ? "bg-primary/5 border border-primary/15" : "hover:bg-accent/30"} transition-colors`}>
        <span className={`text-xs font-mono font-semibold w-14 shrink-0 mt-0.5 ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>
          {label}
        </span>
        {empty ? (
          <span className="text-xs text-muted-foreground/40 italic mt-0.5">—</span>
        ) : (
          <div className="flex flex-col gap-0.5 min-w-0">
            {s.team && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotCls}`} />
                {s.team}
              </span>
            )}
            {s.detail && (
              <span className="text-xs text-muted-foreground pl-3">{s.detail}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-start gap-3 p-5 border-b border-border">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h2
              className="text-lg font-bold text-foreground leading-tight truncate"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {player.name}
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <StatusBadge value={player.status} />
              {player.position && (
                <span className="text-xs text-muted-foreground">{player.position}</span>
              )}
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <img src={teamLogo} alt={teamName} className="w-4 h-4 object-contain opacity-70" />
                {teamName}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Seasons */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 px-1">
              Current &amp; Future
            </p>
            <div className="space-y-1">
              {futureCurrentSeasons.map((s) => (
                <SeasonRow key={s} label={s} isCurrent />
              ))}
            </div>
          </div>

          {hasHistory && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                Career History
              </p>
              <div className="space-y-0.5">
                {[...historicalSeasons].reverse().map((s) => (
                  <SeasonRow key={s} label={s} isCurrent={false} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
