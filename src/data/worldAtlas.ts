import type { Chapter } from "./curriculum.ts";
import { chapterMapFor } from "./chapterMaps.ts";

export type AtlasInk = "water" | "shore" | "grass" | "trees" | "stone" | "mountains" | "sand" | "buildings" | "road" | "marker";
export type AtlasTile = { glyph: string; ink: AtlasInk; chapterId?: string; biome?: string };
export type AtlasMarker = { id: string; title: string; token: string; x: number; y: number; index: number };
export type WorldAtlas = { width: number; height: number; tiles: AtlasTile[][]; markers: AtlasMarker[] };

const WIDTH = 112;
const HEIGHT = 39;

function center(index: number): { x: number; y: number } {
  const row = Math.floor(index / 5);
  const column = index % 5;
  return { x: 12 + (row % 2 ? 4 - column : column) * 22, y: 7 + row * 12 };
}
function texture(biome: string, hash: number): { glyph: string; ink: AtlasInk } {
  switch (biome) {
    case "river": case "island": case "harbor":
      return hash % 7 < 2 ? { glyph: "~", ink: "water" } : { glyph: hash % 11 === 0 ? "T" : ".", ink: hash % 11 === 0 ? "trees" : "grass" };
    case "mountain": case "cave": case "fortress":
      return hash % 5 < 3 ? { glyph: hash % 4 === 0 ? "#" : "^", ink: hash % 4 === 0 ? "stone" : "mountains" } : { glyph: ".", ink: "grass" };
    case "desert":
      return hash % 9 === 0 ? { glyph: "^", ink: "mountains" } : { glyph: hash % 4 === 0 ? ":" : ".", ink: "sand" };
    case "village": case "library": case "market": case "factory": case "temple":
      return hash % 7 < 3 ? { glyph: hash % 2 === 0 ? "#" : "+", ink: "buildings" } : { glyph: ".", ink: "grass" };
    default:
      return hash % 6 < 2 ? { glyph: "T", ink: "trees" } : { glyph: hash % 9 === 0 ? "o" : ".", ink: "grass" };
  }
}

/**
 * One connected, top-down ASCII world, with fifteen regions on a serpentine
 * journey. Each region uses the biome of its own hand-authored chapter map.
 * Hashing provides fixed detail without randomness or image downloads.
 */
export function buildWorldAtlas(chapters: readonly Chapter[]): WorldAtlas {
  const markers: AtlasMarker[] = chapters.map((chapter, index) => ({
    ...center(index),
    id: chapter.id,
    title: chapter.title,
    token: "[" + String(index + 1).padStart(2, "0") + "]",
    index,
  }));
  const tiles: AtlasTile[][] = Array.from({ length: HEIGHT }, (_, y) =>
    Array.from({ length: WIDTH }, (_, x) => {
      let nearest = -1;
      let nearestDistance = Infinity;
      for (let i = 0; i < markers.length; i++) {
        const point = markers[i];
        const dx = (x - point.x) / 13.3;
        const dy = (y - point.y) / 8.5;
        const dist = dx * dx + dy * dy;
        if (dist < nearestDistance) { nearestDistance = dist; nearest = i; }
      }
      const noise = Math.sin(x * 0.49 + y * 0.22) * .095 + Math.cos(y * .77 - x * .21) * .07;
      if (nearestDistance + noise > 1.17)
        return { glyph: "~", ink: "water" };
      const marker = markers[nearest];
      const biome = chapterMapFor(marker.id).biome;
      if (nearestDistance + noise > 1.02)
        return { glyph: ":", ink: "shore", chapterId: marker.id, biome };
      const hash = Math.abs(((x + 3) * 7919 + (y + 7) * 4273 + nearest * 541) % 97);
      const detail = texture(biome, hash);
      return { ...detail, chapterId: marker.id, biome };
    }),
  );

  // The main walking road joins successive regions, including row turns.
  for (let i = 1; i < markers.length; i++) {
    const from = markers[i - 1];
    const to = markers[i];
    let x = from.x + 2, y = from.y;
    const endX = to.x + 2, endY = to.y;
    const draw = (nextX: number, nextY: number, glyph: string) => {
      while (x !== nextX || y !== nextY) {
        if (tiles[y]?.[x]) tiles[y][x] = { glyph, ink: "road" };
        x += Math.sign(nextX - x);
        y += Math.sign(nextY - y);
      }
      if (tiles[y]?.[x]) tiles[y][x] = { glyph: "+", ink: "road" };
    };
    draw(endX, y, "-");
    draw(endX, endY, "|");
  }
  // Draw interactive map labels last so roads cannot cover them.
  for (const marker of markers)
    for (let n = 0; n < marker.token.length; n++)
      tiles[marker.y][marker.x + n] = { glyph: marker.token[n], ink: "marker", chapterId: marker.id };
  return { width: WIDTH, height: HEIGHT, tiles, markers };
}
