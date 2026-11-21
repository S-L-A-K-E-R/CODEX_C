import type { ReactNode } from "react";
import type { Chapter } from "../data/curriculum.ts";
import { buildWorldAtlas, type AtlasTile } from "../data/worldAtlas.ts";
import { useLanguage } from "../i18n/Language.tsx";
import { useProgress } from "../state/store.ts";

type RegionStatus = "available" | "in-progress" | "complete" | "mastered";
type Region = {
  chapter: Chapter;
  total: number;
  done: number;
  status: RegionStatus;
  selected: boolean;
};

function atlasRows(
  tiles: AtlasTile[][],
  regions: ReadonlyMap<string, Region>,
): ReactNode[] {
  return tiles.map((row, y) => {
    const parts: ReactNode[] = [];
    let x = 0;
    while (x < row.length) {
      const cell = row[x];
      if (cell.ink === "marker" && cell.chapterId) {
        const region = regions.get(cell.chapterId);
        if (region) {
          // All atlas markers are four characters wide, e.g. [01].
          const token = row.slice(x, x + 4).map((tile) => tile.glyph).join("");
          const text = region.chapter.title + " - " + region.done + "/" + region.total;
          parts.push(
            <a
              key={"region-" + x}
              href={"#path/" + region.chapter.id}
              title={text}
              aria-label={text}
              className={"world-atlas-marker " + region.status + (region.selected ? " selected" : "")}
              aria-current={region.selected ? "location" : undefined}
            >
              {token}
            </a>,
          );
          x += 4;
          continue;
        }
      }
      const biome = cell.biome || "";
      const styleKey = cell.ink + ":" + biome;
      const start = x;
      let text = "";
      while (x < row.length && row[x].ink !== "marker" &&
        (row[x].ink + ":" + (row[x].biome || "")) === styleKey) {
        text += row[x].glyph;
        x++;
      }
      parts.push(
        <span className={"world-atlas-tile " + cell.ink + (biome ? " biome-" + biome : "")} key={start} aria-hidden="true">
          {text}
        </span>,
      );
    }
    return <span className="ascii-map-row" key={y}>{parts}{"\n"}</span>;
  });
}

export function WorldOverview({
  chapters,
  selectedChapter,
}: {
  chapters: Chapter[];
  selectedChapter: string;
}) {
  const { t, course: { byChapter } } = useLanguage();
  const progress = useProgress();
  const atlas = buildWorldAtlas(chapters);
  const regions = chapters.map((chapter): Region => {
    const cores = byChapter(chapter.id).filter((exercise) => exercise.kind === "core");
    const done = cores.filter((exercise) => !!progress.completed[exercise.id]).length;
    const fullyComplete = cores.length > 0 && done === cores.length;
    const gold = fullyComplete && cores.every((exercise) =>
      byChapter(chapter.id).some((challenge) =>
        challenge.base === exercise.id && !!progress.completed[challenge.id],
      ),
    );
    return {
      chapter,
      total: cores.length,
      done,
      status: gold ? "mastered" : fullyComplete ? "complete" : done ? "in-progress" : "available",
      selected: chapter.id === selectedChapter,
    };
  });
  const lookup = new Map(regions.map((region) => [region.chapter.id, region]));

  return (
    <section className="world-overview" id="world-atlas" aria-labelledby="world-overview-title">
      <div className="world-overview-heading">
        <div>
          <div className="eyebrow">{t("15 regions, one C adventure")}</div>
          <h2 id="world-overview-title">{t("Explore the world")}</h2>
          <p>{t("Choose a region on the world map to zoom into its chapter and challenges.")}</p>
        </div>
        <div className="world-overview-legend" aria-label={t("Map legend")}>
          <span className="world-legend-dot open" /> {t("To explore")}
          <span className="world-legend-dot complete" /> {t("Completed")}
          <span className="world-legend-dot mastered" /> {t("Gold earned")}
        </div>
      </div>
      <div className="world-overview-scroll" role="region" aria-label={t("World map, 15 chapters")} tabIndex={0}>
        <nav className="world-overview-canvas" aria-label={t("Choose a chapter region")}>
          <pre className="world-atlas-grid">{atlasRows(atlas.tiles, lookup)}</pre>
        </nav>
      </div>
      <nav className="world-region-index" aria-label={t("World regions")}>
        {regions.map(({ chapter, done, total, status, selected }, index) => (
          <a
            key={chapter.id}
            href={"#path/" + chapter.id}
            className={"world-region-link " + status + (selected ? " selected" : "")}
            aria-current={selected ? "location" : undefined}
          >
            <span className="world-region-number">{String(index + 1).padStart(2, "0")}</span>
            <span className="world-region-label">{chapter.title}</span>
            <small>{done}/{total}</small>
          </a>
        ))}
      </nav>
    </section>
  );
}
