import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { Chapter } from "../src/data/curriculum.ts";
import { buildWorldAtlas } from "../src/data/worldAtlas.ts";

const { chapters } = JSON.parse(readFileSync("src/data/content.json", "utf8")) as { chapters: Chapter[] };

test("the overworld maps every chapter once in a connected ASCII region", () => {
  const atlas = buildWorldAtlas(chapters);
  assert.equal(atlas.markers.length, chapters.length);
  assert.equal(atlas.markers.length, 15);
  assert.equal(atlas.tiles.length, atlas.height);
  assert.equal(new Set(atlas.markers.map((m) => m.id)).size, 15);
  const biomestyles = new Set<string>();
  const route = new Set<string>();
  for (const row of atlas.tiles) {
    assert.equal(row.length, atlas.width);
    for (const tile of row) {
      assert.match(tile.glyph, /^[ -~]$/);
      if (tile.biome) biomestyles.add(tile.biome);
      if (tile.ink === "road") route.add(tile.glyph);
    }
  }
  assert.ok(biomestyles.size >= 10, "each region should have a distinct terrain identity");
  assert.ok(route.has("-") && route.has("|"), "the world path must connect regions horizontally and vertically");
  for (const marker of atlas.markers) {
    assert.ok(marker.x >= 0 && marker.x + 4 <= atlas.width);
    assert.ok(marker.y >= 0 && marker.y < atlas.height);
    assert.equal(atlas.tiles[marker.y].slice(marker.x, marker.x + 4).map((tile) => tile.glyph).join(""), marker.token);
    assert.equal(marker.token.length, 4);
  }
});

test("atlas generation is deterministic and does not rely on mutable browser state", () => {
  const one = buildWorldAtlas(chapters);
  const two = buildWorldAtlas(chapters);
  assert.deepEqual(one, two);
  assert.equal(one.markers[0].id, "first-programs");
  assert.equal(one.markers[14].id, "data-structures");
});
