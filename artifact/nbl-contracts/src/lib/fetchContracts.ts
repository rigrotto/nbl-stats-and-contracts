export interface PlayerSeason {
  team: string;
  detail: string;
}

export interface Player {
  name: string;
  status: string;
  position: string;
  seasons: Record<string, PlayerSeason>;
}

export interface TeamData {
  name: string;
  gid: string;
  players: Player[];
  seasonLabels: string[];
}

export const NBL_TEAMS = [
  { name: "Adelaide 36ers",         short: "Adelaide",    gid: "1980844410", emoji: "⛪", color: "#E31937", logo: "https://www.nblstore.com.au/cdn/shop/files/ADL.svg?v=1764817092&width=400" },
  { name: "Brisbane Bullets",       short: "Brisbane",    gid: "1313059740", emoji: "🔵", color: "#004B87", logo: "https://www.nblstore.com.au/cdn/shop/files/BBT.svg?v=1764817133&width=400" },
  { name: "Cairns Taipans",         short: "Cairns",      gid: "365176381",  emoji: "🐍", color: "#E87722", logo: "https://www.nblstore.com.au/cdn/shop/files/CNS.svg?v=1764821148&width=400" },
  { name: "Illawarra Hawks",        short: "Illawarra",   gid: "447546404",  emoji: "🦅", color: "#E31937", logo: "https://www.nblstore.com.au/cdn/shop/files/IHK.svg?v=1764821156&width=400" },
  { name: "Melbourne United",       short: "Melbourne",   gid: "1070766894", emoji: "🔵", color: "#003DA5", logo: "https://www.nblstore.com.au/cdn/shop/files/MUD.svg?v=1764821156&width=400" },
  { name: "NZ Breakers",            short: "New Zealand", gid: "1357324412", emoji: "🥝", color: "#00aadf", logo: "https://www.nblstore.com.au/cdn/shop/files/NZB.svg?v=1764821156&width=400" },
  { name: "Perth Wildcats",         short: "Perth",       gid: "1954342135", emoji: "😼", color: "#78BE20", logo: "https://www.nblstore.com.au/cdn/shop/files/PWK.svg?v=1764821156&width=400" },
  { name: "SE Melbourne Phoenix",   short: "SE Melbourne",gid: "2011473787", emoji: "🔥", color: "#E4592A", logo: "https://www.nblstore.com.au/cdn/shop/files/SEM.svg?v=1764821156&width=400" },
  { name: "Sydney Kings",           short: "Sydney",      gid: "953523587",  emoji: "👑", color: "#FFD700", logo: "https://www.nblstore.com.au/cdn/shop/files/SYK.svg?v=1764821156&width=400" },
  { name: "Tasmania JackJumpers",   short: "Tasmania",    gid: "240611479",  emoji: "🐜", color: "#231F20", logo: "https://www.nblstore.com.au/cdn/shop/files/TJJ.svg?v=1764821156&width=400" },
];

const SHEET_BASE =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFBKSjF0LkWHgCcIJ7maLvmAqsb-HeQLvOE4-qwj1QU6BLf2_PWpczhzyMgBnxiHbk9BkGnWeQu0io/pub?output=csv";

// Current & future seasons (column labels we want to display)
const CURRENT_SEASONS = ["2024-25", "2025-26", "2026-27", "2027-28"];

function parseCSV(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let current = "";
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (ch === '"') {
      if (inQuotes && csv[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      row.push(current.trim()); current = "";
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && csv[i + 1] === "\n") i++;
      row.push(current.trim()); rows.push(row); row = []; current = "";
    } else { current += ch; }
  }
  if (current || row.length > 0) { row.push(current.trim()); rows.push(row); }
  return rows;
}

function isContracted(player: Player): boolean {
  return CURRENT_SEASONS.some((s) => {
    const season = player.seasons[s];
    return season && (season.team.trim() !== "" || season.detail.trim() !== "");
  });
}

export async function fetchTeam(gid: string): Promise<{ players: Player[]; seasonLabels: string[] }> {
  const url = `${SHEET_BASE}&gid=${gid}`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const csv = await res.text();
  const allRows = parseCSV(csv).filter((r) => r.some((c) => c !== ""));

  if (allRows.length < 2) return { players: [], seasonLabels: CURRENT_SEASONS };

  const headers = allRows[0];
  // Build a map of column index → season label (filter out blank/old headers)
  const colToSeason: Record<number, string> = {};
  headers.forEach((h, i) => {
    const cleaned = h.trim();
    if (/\d{4}-\d{2}/.test(cleaned)) colToSeason[i] = cleaned;
  });

  const seasonLabels = CURRENT_SEASONS.filter((s) =>
    Object.values(colToSeason).includes(s)
  );

  const dataRows = allRows.slice(1);
  const players: Player[] = [];

  // Find the "UNCONTRACTED PLAYERS" separator row and only process rows above it
  const uncontractedIdx = dataRows.findIndex((r) =>
    r.some((c) => c.toLowerCase().includes("uncontracted"))
  );
  const contractedRows =
    uncontractedIdx >= 0 ? dataRows.slice(0, uncontractedIdx) : dataRows;

  let i = 0;
  while (i < contractedRows.length) {
    const teamRow = contractedRows[i];
    const detailRow =
      i + 1 < contractedRows.length && !contractedRows[i + 1][0]?.trim()
        ? contractedRows[i + 1]
        : null;

    const name = teamRow[0]?.trim() ?? "";
    if (!name) { i++; continue; }

    const status = teamRow[1]?.trim() ?? "";
    const position = teamRow[2]?.trim() ?? "";

    const seasons: Record<string, PlayerSeason> = {};
    Object.entries(colToSeason).forEach(([idxStr, label]) => {
      const idx = Number(idxStr);
      seasons[label] = {
        team: teamRow[idx]?.trim() ?? "",
        detail: detailRow?.[idx]?.trim() ?? "",
      };
    });

    players.push({ name, status, position, seasons });
    i += detailRow ? 2 : 1;
  }

  const contracted = players.filter(isContracted);
  return { players: contracted, seasonLabels };
}
