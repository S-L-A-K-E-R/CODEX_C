import type { ReactNode } from "react";
import type { Chapter, Exercise } from "../data/curriculum.ts";
import {
  buildAsciiWorld,
  type MapMarker,
  type MapTile,
} from "../data/asciiMap.ts";
import { useLanguage } from "../i18n/Language.tsx";
import { TinyMedals } from "./ChallengeMetrics.tsx";
import { lockedBy } from "../state/path.ts";
import { useProgress } from "../state/store.ts";

type MarkerState = "available" | "locked" | "complete" | "mastered";
type MapEntry = {
  marker: MapMarker;
  title: string;
  category: string;
  state: MarkerState;
  status: string;
  href?: string;
  blockedBy?: string;
  goldId?: string;
  goldCompleted: boolean;
  completedId?: string;
};

const tileClass = (tile: MapTile) => "ascii-ink " + tile.kind;

/** Only one interactive text link is rendered for each [01] marker. */
function mapTextRows(
  tiles: MapTile[][],
  entries: ReadonlyMap<string, MapEntry>,
): ReactNode[] {
  return tiles.map((row, y) => {
    const pieces: ReactNode[] = [];
    let x = 0;
    while (x < row.length) {
      const current = row[x];
      if (current.markerKey) {
        const entry = entries.get(current.markerKey);
        const span = entry?.marker.token.length ?? 1;
        if (entry) {
          const label = [entry.title, entry.category, entry.blockedBy ?? entry.status].join(" - ");
          const attributes = {
            key: "m" + x,
            className: "ascii-marker " + entry.state + " " + entry.marker.kind,
            title: label,
            "aria-label": label,
          };
          pieces.push(
            entry.href ? (
              <a {...attributes} href={entry.href}>{entry.marker.token}</a>
            ) : (
              <span {...attributes} role="img">{entry.marker.token}</span>
            ),
          );
        }
        x += span;
        continue;
      }
      const kind = current.kind;
      let glyphs = "";
      const start = x;
      while (x < row.length && !row[x].markerKey && row[x].kind === kind) {
        glyphs += row[x].glyph;
        x++;
      }
      pieces.push(
        <span key={start} className={tileClass(current)} aria-hidden="true">
          {glyphs}
        </span>,
      );
    }
    return <span className="ascii-map-row" key={y}>{pieces}{"\n"}</span>;
  });
}

export function ChapterTrail({
  chapter,
  items,
}: {
  chapter: Chapter;
  items: Exercise[];
}) {
  const {
    t,
    language,
    course: { goldFor },
  } = useLanguage();
  const progress = useProgress();
  const core = items.filter((item) => item.kind === "core" && !item.finale);
  const sides = items.filter((item) => item.kind === "optional");
  const finale = items.find((item) => item.finale && item.kind === "core");
  const world = buildAsciiWorld(
    chapter.id,
    core.map((item) => item.id),
    sides.map((item) => item.id),
    finale?.id,
  );
  const exercises = new Map(items.map((item) => [item.id, item]));
  const entries = world.markers.map((marker): MapEntry => {
    if (marker.kind === "lesson") {
      const read = !!progress.lessons[chapter.id];
      return {
        marker,
        title: t("A quick introduction"),
        category: t("Quick lesson"),
        state: read ? "complete" : "available",
        status: t(read ? "Lesson read" : "Quick lesson"),
        href: "#lesson/" + chapter.id,
        goldCompleted: false,
      };
    }
    const exercise = exercises.get(marker.key)!;
    const prerequisite = lockedBy(exercise, items, progress);
    const done = !!progress.completed[exercise.id];
    const gold = goldFor(exercise.id);
    const goldCompleted = !!gold && !!progress.completed[gold.id];
    const state: MarkerState = goldCompleted ? "mastered" :
      done ? "complete" : prerequisite ? "locked" : "available";
    const category = t(marker.kind === "final" ? "Final challenge" :
      marker.kind === "optional" ? "Side quest" : "Core challenge");
    return {
      marker,
      title: exercise.title,
      category,
      state,
      status: t({
        mastered: "Gold earned",
        complete: "Completed · Try gold",
        locked: "Locked",
        available: "Available",
      }[state]),
      href: prerequisite ? undefined : "#workspace/" + exercise.id,
      blockedBy: prerequisite ? t("Unlock after {title}", { title: prerequisite.title }) : undefined,
      goldId: done ? gold?.id : undefined,
      goldCompleted,
      completedId: done ? exercise.id : undefined,
    };
  });
  const entriesByKey = new Map(entries.map((entry) => [entry.marker.key, entry]));
  const mainEntries = entries.filter((entry) => entry.marker.kind !== "optional");
  const sideEntries = entries.filter((entry) => entry.marker.kind === "optional");
  const zoneTitle = language === "fr" ? world.titleFr : world.title;

  function entryList(list: MapEntry[]) {
    return list.map((entry) => (
      <li className={"ascii-index-entry " + entry.state} key={entry.marker.key}>
        <span className={"ascii-index-token " + entry.state}>
          {entry.marker.token}
        </span>
        <span className="ascii-index-description">
          {entry.href
            ? <a href={entry.href}>{entry.title}</a>
            : <span>{entry.title}</span>}
          <small>{entry.category} - {entry.blockedBy ?? entry.status}</small>
          {entry.completedId && (
            <TinyMedals id={entry.completedId} stats={progress.comparisons[entry.completedId]} />
          )}
        </span>
        {entry.goldId && (
          <a className="ascii-gold-link" href={"#workspace/" + entry.goldId}>
            {t(entry.goldCompleted ? "Open gold" : "Try gold")}
          </a>
        )}
      </li>
    ));
  }

  return (
    <section className="ascii-chapter">
      <div className="ascii-map-header">
        <span className="ascii-zone-title">{"//"} {zoneTitle}</span>
        <span className="ascii-zone-key">
          {t("ASCII world")} / {t("Click a marker to explore")}
        </span>
      </div>
      <div className="ascii-map-scroll" role="region" aria-label={t("Chapter path: {title}", { title: chapter.title })} tabIndex={0}>
        <nav className="ascii-world" data-biome={world.biome} aria-label={t("Chapter path: {title}", { title: chapter.title })}>
          <pre className="ascii-map-grid">{mapTextRows(world.tiles, entriesByKey)}</pre>
        </nav>
      </div>
      <div className="ascii-map-key" aria-label={t("Map legend")}>
        <span><b>[@]</b> {t("Quick lesson")}</span>
        <span><b>[01]</b> {t("Core challenge")}</span>
        <span><b>[S1]</b> {t("Side quest")}</span>
        <span><b>[F!]</b> {t("Final challenge")}</span>
        <span className="ascii-key-mastered"><b>[**]</b> {t("Gold earned")}</span>
      </div>
      <div className="ascii-index">
        <div className="ascii-index-group">
          <h4>{t("Core path")}</h4>
          <ol>{entryList(mainEntries)}</ol>
        </div>
        <div className="ascii-index-group">
          <h4>{t("Side quests")}</h4>
          <ol>{entryList(sideEntries)}</ol>
        </div>
      </div>
    </section>
  );
}
