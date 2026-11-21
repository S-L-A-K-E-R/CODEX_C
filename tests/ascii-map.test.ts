import test from "node:test";
import assert from "node:assert/strict";
import { CHAPTER_MAPS } from "../src/data/chapterMaps.ts";
import { buildAsciiWorld } from "../src/data/asciiMap.ts";
import { readFileSync } from "node:fs";

const curriculum = JSON.parse(readFileSync("src/data/content.json", "utf8"));
const finaleFile = JSON.parse(readFileSync("src/data/chapter-finales.json", "utf8"));
const expansions = [1, 2, 3, 4, 5].flatMap((index) =>
  JSON.parse(readFileSync("src/data/expansion-" + index + ".json", "utf8")),
);
const mapExtras = JSON.parse(readFileSync("src/data/map-extras.json", "utf8"));
const exercises = [...curriculum.exercises, ...expansions, ...finaleFile, ...mapExtras];

test("every chapter has distinct, legible, printable ASCII world artwork", () => {
  const chapters = curriculum.chapters.map((chapter: { id: string }) => chapter.id);
  assert.deepEqual(Object.keys(CHAPTER_MAPS).sort(), [...chapters].sort());
  const art = Object.values(CHAPTER_MAPS).map((map) => map.art);
  assert.equal(new Set(art).size, 15);
  for (const [chapterId, map] of Object.entries(CHAPTER_MAPS)) {
    assert.ok(map.name && map.nameFr && map.biome && map.art.length > 200, chapterId);
    assert.match(map.art, /^[\x20-\x7e\n]*$/, chapterId);
    assert.ok(map.cores.length >= 3 && map.sides.length >= 2, chapterId);
    assert.ok(map.turns.length >= 2, chapterId);
  }
});

test("all map markers are unique, connected, clickable positions within the text grid", () => {
  for (const chapter of curriculum.chapters) {
    const items = exercises.filter((e) => e.chapter === chapter.id && e.kind !== "gold");
    const cores = items.filter((e) => e.kind === "core" && !e.finale).map((e) => e.id);
    const sides = items.filter((e) => e.kind === "optional").map((e) => e.id);
    const final = items.find((e) => e.finale)?.id;
    const world = buildAsciiWorld(chapter.id, cores, sides, final);
    assert.equal(world.markers.length, items.length + 1);
    assert.equal(world.links.length, world.markers.length - 1);
    assert.equal(new Set(world.markers.map((m) => m.key)).size, world.markers.length);
    assert.equal(world.markers.filter((m) => m.kind === "final").length, 1);
    for (const row of world.tiles) assert.equal(row.length, world.width);
    const occupied = new Set<string>();
    for (const marker of world.markers) {
      assert.ok(marker.x >= 0 && marker.x + marker.token.length <= world.width);
      assert.ok(marker.y >= 1 && marker.y < world.height);
      for (let i = 0; i < marker.token.length; i++) {
        const coord = (marker.x + i) + ":" + marker.y;
        assert.ok(!occupied.has(coord), chapter.id + ": overlapping markers " + coord);
        occupied.add(coord);
        const tile = world.tiles[marker.y][marker.x + i];
        assert.equal(tile.markerKey, marker.key, chapter.id + ": missing anchor " + marker.key);
        assert.equal(tile.glyph, marker.token[i]);
      }
      assert.ok(world.links.some((link) => link.from === marker.key || link.to === marker.key),
        chapter.id + ": disconnected marker " + marker.key);
    }
    assert.ok(world.tiles.some((row) => row.some((cell) => cell.kind === "road")));
    assert.ok(world.tiles.some((row) => row.some((cell) => cell.kind === "side-road")));
    assert.match(world.tiles.map((row) => row.map((cell) => cell.glyph).join("")).join("\n"), /\\\^\/|\^/,
      chapter.id + ": missing ASCII finale crown");
  }
});

test("branch maps grow with more or fewer exercises without silently dropping markers", () => {
  const different = [
    buildAsciiWorld("loops", ["a", "b"], ["s1"], "f"),
    buildAsciiWorld("loops", ["a", "b", "c"], ["s1", "s2", "s3", "s4"], "f"),
    buildAsciiWorld("loops", ["a", "b", "c", "d"], ["s1", "s2", "s3", "s4", "s5"], "f"),
  ];
  for (const world of different) {
    assert.equal(world.markers.length, world.links.length + 1);
    assert.equal(world.markers.filter((node) => node.kind === "final").length, 1);
    assert.equal(new Set(world.markers.map((node) => node.key)).size, world.markers.length);
  }
});
