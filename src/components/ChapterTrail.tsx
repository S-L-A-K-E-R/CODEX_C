import type { ReactNode } from "react";
import { BookOpen, Check, Code2, Compass, Crown, LockKeyhole, Star } from "lucide-react";
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

/** Keep the underlying characters, including ASCII roads, but let real circles
 * replace [01] markers. The row length never changes: overlays line up exactly. */
function terrainRows(tiles: MapTile[][]): ReactNode[] {
  return tiles.map((row, y) => {
    const parts: ReactNode[] = [];
    let x = 0;
    while (x < row.length) {
      const initial = row[x];
      const kind = initial.markerKey ? "plain" : initial.kind;
      let content = "";
      const start = x;
      while (x < row.length &&
        (row[x].markerKey ? "plain" : row[x].kind) === kind) {
        content += row[x].markerKey ? " " : row[x].glyph;
        x++;
      }
      parts.push(
        <span className={"ascii-ink " + kind} key={start} aria-hidden="true">
          {content}
        </span>,
      );
    }
    return <span className="ascii-map-row" key={y}>{parts}{"\n"}</span>;
  });
}

function CircleMarker({ entry }: { entry: MapEntry }) {
  const { marker } = entry;
  const Icon = marker.kind === "final" ? Crown :
    entry.state === "mastered" ? Star :
    entry.state === "complete" ? Check :
    entry.state === "locked" ? LockKeyhole :
    marker.kind === "lesson" ? BookOpen :
    marker.kind === "optional" ? Compass : Code2;
  const label = [entry.title, entry.category, entry.blockedBy ?? entry.status].join(" - ");
  const content = (
    <>
      <span className="chapter-map-disc"><Icon aria-hidden="true" size={25} strokeWidth={2.4} /></span>
      <span className="chapter-map-disc-label" aria-hidden="true">
        {marker.kind === "lesson" ? "START" :
          marker.kind === "final" ? "FINAL" : marker.token.slice(1, -1)}
      </span>
    </>
  );
  const common = {
    className: "chapter-map-node " + entry.state + " " + marker.kind,
    style: {
      left: (marker.x + marker.token.length / 2) + "ch",
      top: (marker.y + .5) * 18 + "px",
    },
    title: label,
    "aria-label": label,
  };
  return entry.href
    ? <a {...common} href={entry.href}>{content}</a>
    : <span {...common} aria-disabled="true" tabIndex={0}>{content}</span>;
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
    <section className="ascii-chapter" aria-label={t("Zoomed chapter region")}>
      <div className="ascii-map-header">
        <span className="ascii-zone-title">{"//"} {t("Zoomed chapter region")} / {zoneTitle}</span>
        <button type="button" className="ascii-back-to-world"
          onClick={() => document.getElementById("world-atlas")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
          {"↑"} {t("Back to world map")}
        </button>
      </div>
      <div className="ascii-map-scroll chapter-map-scroll" role="region"
        aria-label={t("Chapter path: {title}", { title: chapter.title })} tabIndex={0}>
        <nav className="ascii-world chapter-zoom-world" data-biome={world.biome}
          aria-label={t("Chapter path: {title}", { title: chapter.title })}>
          <div className="chapter-map-board" style={{ width: world.width + "ch", height: (world.height * 18) + "px" }}>
            <pre className="ascii-map-grid" aria-hidden="true">{terrainRows(world.tiles)}</pre>
            {entries.map((entry) => <CircleMarker key={entry.marker.key} entry={entry} />)}
          </div>
        </nav>
      </div>
      <div className="ascii-map-key" aria-label={t("Map legend")}>
        <span><i className="chapter-map-key-disc available" /> {t("Available")}</span>
        <span><i className="chapter-map-key-disc locked" /> {t("Locked")}</span>
        <span><i className="chapter-map-key-disc complete" /> {t("Completed")}</span>
        <span><i className="chapter-map-key-disc mastered" /> {t("Gold earned")}</span>
        <span><Crown size={15} aria-hidden="true" /> {t("Final challenge")}</span>
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
