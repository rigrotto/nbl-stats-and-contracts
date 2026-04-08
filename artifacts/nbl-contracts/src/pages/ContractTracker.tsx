import { useState, useEffect, useMemo, useCallback } from "react";
import { fetchTeam, NBL_TEAMS, Player } from "@/lib/fetchContracts";
import PlayerModal from "@/components/PlayerModal";
import {
  Search,
  RefreshCw,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Filter,
  X,
  Users,
} from "lucide-react";

const CURRENT_SEASONS = ["2024-25", "2025-26", "2026-27", "2027-28"];

function StatusBadge({ value }: { value: string }) {
  if (!value) return null;
  const lower = value.toLowerCase();
  let cls = "bg-secondary/60 text-secondary-foreground border border-border";
  if (lower === "local" || lower.startsWith("local"))
    cls = "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
  else if (lower === "import")
    cls = "bg-purple-500/15 text-purple-400 border border-purple-500/30";
  else if (lower.includes("next star"))
    cls = "bg-orange-500/15 text-orange-400 border border-orange-500/30";
  else if (lower.includes("srp"))
    cls = "bg-sky-500/15 text-sky-400 border border-sky-500/30";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {value}
    </span>
  );
}

function ContractCell({ team, detail }: { team: string; detail: string }) {
  if (!team && !detail)
    return <span className="text-muted-foreground/40 text-xs">—</span>;

  const lower = (team + " " + detail).toLowerCase();
  const isFA =
    lower.includes("fa") ||
    lower.includes("free agent") ||
    lower.includes("ufa") ||
    lower.includes("rfa");
  const isOption = lower.includes("opt");

  let teamCls = "text-foreground font-medium";
  let detailCls = "text-muted-foreground";
  let dotCls = "bg-green-400";
  if (isFA) { dotCls = "bg-amber-400"; }
  else if (isOption) { dotCls = "bg-blue-400"; }
  else if (!team && detail) { dotCls = "bg-muted-foreground/40"; }

  return (
    <div className="flex flex-col gap-0.5 min-w-[90px]">
      {team && (
        <span className={`flex items-center gap-1.5 text-xs ${teamCls}`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotCls}`} />
          {team}
        </span>
      )}
      {detail && (
        <span className={`text-xs leading-tight pl-3 ${detailCls}`}>{detail}</span>
      )}
    </div>
  );
}

type SortDir = "asc" | "desc" | null;
interface SortState { col: string; dir: SortDir }

function SortIcon({ col, sort }: { col: string; sort: SortState }) {
  if (sort.col !== col) return <ChevronsUpDown className="w-3 h-3 opacity-30" />;
  if (sort.dir === "asc") return <ChevronUp className="w-3 h-3 text-primary" />;
  return <ChevronDown className="w-3 h-3 text-primary" />;
}

type CacheEntry = { players: Player[]; seasonLabels: string[]; loadedAt: Date };
const cache = new Map<string, CacheEntry>();

export default function ContractTracker() {
  const [activeTeamIdx, setActiveTeamIdx] = useState(0);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [teamCache, setTeamCache] = useState<Map<string, CacheEntry>>(new Map(cache));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sort, setSort] = useState<SortState>({ col: "", dir: null });
  const [showFilters, setShowFilters] = useState(false);

  const activeTeam = NBL_TEAMS[activeTeamIdx];
  const cached = teamCache.get(activeTeam.gid);

  const loadTeam = useCallback(
    async (gid: string, force = false) => {
      if (!force && cache.has(gid)) {
        setTeamCache(new Map(cache));
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const result = await fetchTeam(gid);
        const entry: CacheEntry = { ...result, loadedAt: new Date() };
        cache.set(gid, entry);
        setTeamCache(new Map(cache));
      } catch {
        setError("Failed to load roster data. Check your connection and try again.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadTeam(activeTeam.gid);
    setSearch("");
    setStatusFilter("All");
    setSort({ col: "", dir: null });
  }, [activeTeamIdx, loadTeam, activeTeam.gid]);

  const players = cached?.players ?? [];
  const seasonLabels = cached?.seasonLabels ?? CURRENT_SEASONS;

  const statusOptions = useMemo(() => {
    const vals = Array.from(new Set(players.map((p) => p.status).filter(Boolean))).sort();
    return ["All", ...vals];
  }, [players]);

  const filtered = useMemo(() => {
    let rows = players;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.status.toLowerCase().includes(q) ||
          p.position.toLowerCase().includes(q) ||
          Object.values(p.seasons).some(
            (s) =>
              s.team.toLowerCase().includes(q) ||
              s.detail.toLowerCase().includes(q)
          )
      );
    }
    if (statusFilter !== "All") {
      rows = rows.filter((p) => p.status === statusFilter);
    }
    if (sort.col && sort.dir) {
      rows = [...rows].sort((a, b) => {
        let av = "", bv = "";
        if (sort.col === "name") { av = a.name; bv = b.name; }
        else if (sort.col === "position") { av = a.position; bv = b.position; }
        else if (sort.col === "status") { av = a.status; bv = b.status; }
        else {
          av = a.seasons[sort.col]?.team ?? "";
          bv = b.seasons[sort.col]?.team ?? "";
        }
        return sort.dir === "asc"
          ? av.toLowerCase().localeCompare(bv.toLowerCase())
          : bv.toLowerCase().localeCompare(av.toLowerCase());
      });
    }
    return rows;
  }, [players, search, statusFilter, sort]);

  const handleSort = (col: string) => {
    setSort((prev) => {
      if (prev.col !== col) return { col, dir: "asc" };
      if (prev.dir === "asc") return { col, dir: "desc" };
      return { col: "", dir: null };
    });
  };

  const hasFilters = search.trim() !== "" || statusFilter !== "All";
  const clearFilters = () => { setSearch(""); setStatusFilter("All"); };

  // Counts by status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    players.forEach((p) => {
      const s = p.status || "Other";
      counts[s] = (counts[s] ?? 0) + 1;
    });
    return counts;
  }, [players]);

  return (
    <div className="min-h-screen bg-background" data-testid="contract-tracker">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-primary/80 mb-1.5 block">
                Australian Basketball
              </span>
              <h1
                className="text-3xl sm:text-4xl font-black tracking-tight text-foreground"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                data-testid="page-title"
              >
                NBL CONTRACT<span className="text-primary"> TRACKER</span>
              </h1>
              <p className="mt-1 text-muted-foreground text-sm">
                Current &amp; future contracted players per club. Live data.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {cached?.loadedAt && (
                <span className="text-xs text-muted-foreground hidden sm:block">
                  Updated {cached.loadedAt.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={() => loadTeam(activeTeam.gid, true)}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-accent border border-border text-foreground text-sm font-medium transition-colors disabled:opacity-50"
                data-testid="button-refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Loading…" : "Refresh"}
              </button>
            </div>
          </div>

          {/* Team tabs */}
          <div className="flex overflow-x-auto gap-0 pb-0 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 scrollbar-none"
            style={{ scrollbarWidth: "none" }}>
            {NBL_TEAMS.map((team, idx) => {
              const isActive = idx === activeTeamIdx;
              const isCached = cache.has(team.gid);
              return (
                <button
                  key={team.gid}
                  onClick={() => setActiveTeamIdx(idx)}
                  className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 shrink-0 ${
                    isActive
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                  data-testid={`tab-${team.short.toLowerCase().replace(/ /g, "-")}`}
                >
                  <img
                    src={team.logo}
                    alt={team.short}
                    className={`w-6 h-6 object-contain shrink-0 transition-opacity ${isActive ? "opacity-100" : "opacity-50"}`}
                  />
                  <span>{team.short}</span>
                  {isCached && !isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* Team header + stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={activeTeam.logo}
              alt={activeTeam.short}
              className="w-12 h-12 object-contain shrink-0"
            />
            <div>
              <h2
                className="text-xl font-bold text-foreground"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                data-testid="team-name"
              >
                {activeTeam.name}
              </h2>
              {!loading && cached && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {players.length} contracted player{players.length !== 1 ? "s" : ""}
                  {Object.entries(statusCounts).length > 0 && (
                    <span className="text-muted-foreground/60">
                      —{" "}
                      {Object.entries(statusCounts)
                        .map(([k, v]) => `${v} ${k}`)
                        .join(", ")}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              placeholder="Search players, contracts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              data-testid="input-search"
            />
          </div>
          <button
            onClick={() => setShowFilters((p) => !p)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              showFilters
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-foreground hover:bg-accent"
            }`}
            data-testid="button-filter-toggle"
          >
            <Filter className="w-4 h-4" />
            Filter
            {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
          </button>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 text-sm font-medium hover:bg-destructive/20 transition-colors"
              data-testid="button-clear-filters"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="p-4 bg-card border border-border rounded-xl" data-testid="filter-panel">
            <label className="text-xs text-muted-foreground font-medium mb-1.5 block">
              Player Type
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-64 px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              data-testid="select-status"
            >
              {statusOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive" data-testid="error-message">
            <span className="text-sm">{error}</span>
            <button onClick={() => loadTeam(activeTeam.gid, true)} className="ml-auto text-xs underline">
              Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="rounded-xl border border-border bg-card overflow-hidden" data-testid="loading-skeleton">
            <div className="p-4 border-b border-border bg-muted/20">
              <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
            </div>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex gap-6 px-6 py-3.5 border-b border-border/40">
                {Array.from({ length: 6 }).map((__, j) => (
                  <div
                    key={j}
                    className="h-3.5 bg-muted rounded animate-pulse"
                    style={{
                      width: `${[140, 70, 60, 90, 90, 90][j]}px`,
                      animationDelay: `${(i * 6 + j) * 25}ms`,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        {!loading && cached && (
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-lg" data-testid="contracts-table">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    {[
                      { key: "name", label: "Player" },
                      { key: "status", label: "Type" },
                      { key: "position", label: "Pos" },
                      ...seasonLabels.map((s) => ({ key: s, label: s })),
                    ].map(({ key, label }) => (
                      <th
                        key={key}
                        onClick={() => handleSort(key)}
                        className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:text-foreground transition-colors"
                        data-testid={`th-${key}`}
                      >
                        <span className="flex items-center gap-1.5">
                          {label}
                          <SortIcon col={key} sort={sort} />
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3 + seasonLabels.length}
                        className="text-center py-16 text-muted-foreground"
                        data-testid="no-results"
                      >
                        No contracted players match your search.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((player, i) => (
                      <tr
                        key={`${player.name}-${i}`}
                        className="hover:bg-accent/25 transition-colors"
                        data-testid={`row-player-${i}`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap" data-testid={`text-name-${i}`}>
                          <button
                            onClick={() => setSelectedPlayer(player)}
                            className="font-semibold text-foreground hover:text-primary transition-colors text-left underline-offset-2 hover:underline"
                          >
                            {player.name}
                          </button>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" data-testid={`text-status-${i}`}>
                          <StatusBadge value={player.status} />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap" data-testid={`text-pos-${i}`}>
                          {player.position || "—"}
                        </td>
                        {seasonLabels.map((label) => (
                          <td key={label} className="px-4 py-3" data-testid={`text-${label}-${i}`}>
                            <ContractCell
                              team={player.seasons[label]?.team ?? ""}
                              detail={player.seasons[label]?.detail ?? ""}
                            />
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 border-t border-border bg-muted/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                Showing{" "}
                <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">{players.length}</span>{" "}
                contracted players
              </span>
              <a
                href="https://spatialjam.com/contracttracker"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-source"
              >
                Data: SpatialJam <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Legend */}
        {!loading && cached && (
          <div className="p-4 rounded-xl bg-card border border-border" data-testid="legend">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Legend</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1.5">Player Type</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "Local", cls: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" },
                    { label: "Import", cls: "bg-purple-500/15 text-purple-400 border border-purple-500/30" },
                    { label: "Next Star", cls: "bg-orange-500/15 text-orange-400 border border-orange-500/30" },
                    { label: "SRP", cls: "bg-sky-500/15 text-sky-400 border border-sky-500/30" },
                  ].map(({ label, cls }) => (
                    <span key={label} className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1.5">Contract Status</p>
                <div className="flex flex-wrap gap-3">
                  {[
                    { dot: "bg-green-400", label: "Signed / Active" },
                    { dot: "bg-amber-400", label: "Free Agent (FA/UFA/RFA)" },
                    { dot: "bg-blue-400", label: "Option Year" },
                  ].map(({ dot, label }) => (
                    <span key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className={`w-2 h-2 rounded-full ${dot}`} />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          teamName={activeTeam.name}
          teamLogo={activeTeam.logo}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
