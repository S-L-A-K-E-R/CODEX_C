import { chapterMapFor, type CellPoint } from "./chapterMaps.ts";

export type MapMarkerKind = "lesson" | "core" | "optional" | "final";
export type MapTileKind =
  | "plain" | "water" | "trees" | "mountains" | "stone" | "buildings"
  | "grass" | "sand" | "road" | "side-road" | "crown" | "marker";
export type MapTile = { glyph: string; kind: MapTileKind; markerKey?: string };
export type MapMarker = {
  key: string;
  kind: MapMarkerKind;
  x: number;
  y: number;
  token: string;
};
export type MapLink = { from: string; to: string; kind: "main" | "side" };
export type AsciiWorld = {
  title: string;
  titleFr: string;
  biome: string;
  width: number;
  height: number;
  tiles: MapTile[][];
  markers: MapMarker[];
  links: MapLink[];
};

/** This is actual fixed-width character art; no SVG, canvas, images or pixel overlays. */
function terrainKind(glyph: string): MapTileKind {
  if (glyph === "~") return "water";
  if (glyph === "T" || glyph === "o") return "trees";
  if (glyph === "^") return "mountains";
  if (glyph === "#") return "stone";
  if ("[]=|".includes(glyph)) return "buildings";
  if ("_/\\*".includes(glyph)) return "sand";
  if (glyph === "." || glyph === ",") return "grass";
  return "plain";
}
const at = (point: CellPoint): { x: number; y: number } =>
  ({ x: point[0], y: point[1] });

function drawRoute(
  tiles: MapTile[][],
  from: MapMarker,
  to: MapMarker,
  turn: "horizontal" | "vertical",
  kind: "main" | "side",
) {
  const start = { x: from.x + 2, y: from.y };
  const end = { x: to.x + 2, y: to.y };
  const bend = turn === "horizontal" ? { x: end.x, y: start.y } : { x: start.x, y: end.y };
  const draw = (a: typeof start, b: typeof start) => {
    const dx = Math.sign(b.x - a.x);
    const dy = Math.sign(b.y - a.y);
    const line = dx ? "-" : "|";
    let x = a.x, y = a.y;
    while (true) {
      const tile = tiles[y]?.[x];
      if (tile) {
        const crossing = tile.kind === "road" || tile.kind === "side-road";
        const glyph = kind === "side" ? ":" : line;
        tile.glyph = crossing && tile.glyph !== glyph ? "+" : glyph;
        tile.kind = crossing && tile.kind === "road" ? "road" : kind === "side" ? "side-road" : "road";
      }
      if (x === b.x && y === b.y) break;
      x += dx;
      y += dy;
    }
  };
  if (start.x !== bend.x || start.y !== bend.y) draw(start, bend);
  if (bend.x !== end.x || bend.y !== end.y) draw(bend, end);
  const corner = tiles[bend.y]?.[bend.x];
  if (corner && start.x !== end.x && start.y !== end.y) {
    corner.glyph = "+";
    corner.kind = kind === "side" ? "side-road" : "road";
  }
}

export function buildAsciiWorld(
  chapterId: string,
  regularCoreIds: readonly string[],
  sideQuestIds: readonly string[],
  finaleId?: string,
): AsciiWorld {
  const map = chapterMapFor(chapterId);
  const lesson: MapMarker = { key: "lesson:" + chapterId, kind: "lesson", token: "[@]", x: 5, y: 11 };
  const main: MapMarker[] = regularCoreIds.map((id, index) => {
    const fallback: CellPoint = [20 + (index % 4) * 13, 5 + (index % 3) * 5];
    const spot = at(map.cores[index] ?? fallback);
    return { key: id, kind: "core", token: "[" + String(index + 1).padStart(2, "0") + "]", ...spot };
  });
  const final: MapMarker | undefined = finaleId
    ? { key: finaleId, kind: "final", token: "[F!]", x: 65, y: 12 }
    : undefined;
  const sides: MapMarker[] = sideQuestIds.map((id, index) => {
    const fallback: CellPoint = [12 + (index % 5) * 13, 18 + Math.floor(index / 5) * 3];
    const spot = at(map.sides[index] ?? fallback);
    return { key: id, kind: "optional", token: "[S" + (index + 1) + "]", ...spot };
  });
  const markers: MapMarker[] = [lesson, ...main, ...(final ? [final] : []), ...sides];
  const art = map.art.replace(/^\n/, "").replace(/\n\s*$/, "").split("\n");
  const width = Math.max(76, ...art.map((s) => s.length), ...markers.map((m) => m.x + m.token.length + 2));
  const height = Math.max(23, art.length, ...markers.map((m) => m.y + 3));
  const tiles: MapTile[][] = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => {
      const glyph = art[y]?.[x] ?? " ";
      return { glyph, kind: terrainKind(glyph) };
    }),
  );
  const links: MapLink[] = [];
  const mainRoute = [lesson, ...main, ...(final ? [final] : [])];
  mainRoute.slice(1).forEach((target, index) => {
    const source = mainRoute[index];
    links.push({ from: source.key, to: target.key, kind: "main" });
    drawRoute(tiles, source, target, map.turns[index % map.turns.length] ?? "horizontal", "main");
  });
  sides.forEach((target, index) => {
    const source = main[Math.min(map.sideOrigins[index] ?? 0, main.length - 1)] ?? lesson;
    links.push({ from: source.key, to: target.key, kind: "side" });
    drawRoute(tiles, source, target, map.turns[(index + 1) % map.turns.length] ?? "vertical", "side");
  });
  // Stamp markers last, so every link meets its challenge without obscuring it.
  for (const marker of markers) {
    for (let i = 0; i < marker.token.length; i++) {
      tiles[marker.y][marker.x + i] = {
        glyph: marker.token[i],
        kind: "marker",
        markerKey: marker.key,
      };
    }
    if (marker.kind === "final") {
      const crown = "\\^/";
      const y = marker.y - 1;
      for (let i = 0; i < crown.length; i++)
        tiles[y][marker.x + i + 1] = { glyph: crown[i], kind: "crown" };
    }
  }
  return { title: map.name, titleFr: map.nameFr, biome: map.biome, width, height, tiles, markers, links };
}
