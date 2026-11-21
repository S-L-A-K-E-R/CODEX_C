import {
  BookOpen,
  Check,
  Code2,
  Compass,
  Crown,
  LockKeyhole,
  Star,
} from "lucide-react";
import type { Chapter, Exercise } from "../data/curriculum.ts";
import { useLanguage } from "../i18n/Language.tsx";
import { TinyMedals } from "./ChallengeMetrics.tsx";
import { lockedBy } from "../state/path.ts";
import { useProgress } from "../state/store.ts";

type Point = { x: number; y: number };
const mainPositions: Point[] = [
  { x: 110, y: 327 },
  { x: 316, y: 187 },
  { x: 510, y: 325 },
  { x: 710, y: 189 },
  { x: 885, y: 327 },
];
const sidePositions: Point[] = [
  { x: 320, y: 494 },
  { x: 690, y: 493 },
];

function road(from: Point, to: Point) {
  const delta = (to.x - from.x) * 0.46;
  return "M " + from.x + " " + from.y +
    " C " + (from.x + delta) + " " + from.y +
    " " + (to.x - delta) + " " + to.y +
    " " + to.x + " " + to.y;
}

/** Deterministic text-map: no image downloads or random layout shifts. */
function terrainFor(chapterId: string) {
  const seed = [...chapterId].reduce((n, char) => n + char.charCodeAt(0), 0);
  const rows: string[] = [];
  for (let row = 0; row < 29; row++) {
    let line = "";
    for (let column = 0; column < 92; column++) {
      const x = (column - 45) / 47;
      const y = (row - 14) / 16;
      const contour = x * x + y * y * 1.08 +
        Math.sin(column * 0.19 + seed) * 0.13 +
        Math.cos(row * 0.42 + seed) * 0.11;
      const variant = (column * 37 + row * 43 + seed) % 41;
      line += contour > 1.09 ? "≈" :
        contour > 0.94 ? "·" :
        variant === 0 ? "♣" :
        variant === 4 ? "♠" :
        variant === 11 ? "^" :
        variant === 18 ? "+" :
        variant % 7 === 0 ? "." : " ";
    }
    rows.push(line);
  }
  return rows.join("\n");
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
    course: { goldFor },
  } = useLanguage();
  const progress = useProgress();
  const regularCores = items.filter((e) => e.kind === "core" && !e.finale);
  const finale = items.find((e) => e.finale);
  const sides = items.filter((e) => e.kind === "optional");
  const coreRoute = finale ? [...regularCores, finale] : regularCores;
  const read = !!progress.lessons[chapter.id];

  // The main road is lesson → core challenges → crowned chapter finale.
  const lessonPosition = mainPositions[0];
  const regularPositions = regularCores.map((_, i) =>
    mainPositions[Math.min(i + 1, 3)],
  );
  const finalePosition = mainPositions[4];
  const mainRoute = [
    lessonPosition,
    ...regularPositions,
    ...(finale ? [finalePosition] : []),
  ];
  const branches = sides.map((_, index) => ({
    from: regularPositions[Math.min(index === 0 ? 0 : 2, regularPositions.length - 1)] ?? lessonPosition,
    to: sidePositions[index % sidePositions.length],
  }));
  const places = new Map<string, Point>();
  regularCores.forEach((e, i) => places.set(e.id, regularPositions[i]));
  if (finale) places.set(finale.id, finalePosition);
  sides.forEach((e, i) => places.set(e.id, sidePositions[i % sidePositions.length]));
  const roads = mainRoute.slice(1).map((to, i) => road(mainRoute[i], to));

  return (
    <div className="trail-frame map-frame">
      <nav
        className="chapter-trail map-trail"
        aria-label={t("Chapter path: {title}", { title: chapter.title })}
      >
        <svg
          className="map-landscape"
          viewBox="0 0 1000 640"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path className="map-island-shadow" d="M91 246 Q145 80 301 96 Q382 37 526 115 Q702 42 811 140 Q949 137 945 286 Q991 418 887 506 Q770 598 624 559 Q481 625 376 548 Q192 603 113 477 Q40 379 91 246Z" />
          <path className="map-island" d="M91 232 Q145 66 301 83 Q382 24 526 102 Q702 29 811 127 Q949 124 945 273 Q991 405 887 493 Q770 585 624 546 Q481 612 376 535 Q192 590 113 464 Q40 366 91 232Z" />
          <path className="map-ridge" d="M143 219 Q205 117 293 135 L328 159 L288 232 L209 259Z M584 141 L681 103 L763 154 L751 221 L664 214Z" />
          <path className="map-pond" d="M460 460 Q493 422 539 450 T604 495 Q571 542 506 532 Q458 516 460 460Z" />
        </svg>
        <pre className="map-ascii" aria-hidden="true">{terrainFor(chapter.id)}</pre>
        <svg
          className="map-roads"
          viewBox="0 0 1000 640"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {roads.map((path, index) => (
            <g key={index}>
              <path className="map-road-outline" d={path} />
              <path className="map-road-core" d={path} />
            </g>
          ))}
          {branches.map(({ from, to }, index) => (
            <g className="map-side-road" key={index}>
              <path className="map-road-outline" d={road(from, to)} />
              <path className="map-road-core" d={road(from, to)} />
            </g>
          ))}
        </svg>
        <div
          className="trail-stop map-stop lesson-stop"
          style={{ left: lessonPosition.x / 10 + "%", top: lessonPosition.y / 640 * 100 + "%" }}
        >
          <a
            className={"trail-node lesson " + (read ? "complete" : "available")}
            href={"#lesson/" + chapter.id}
          >
            <span className="trail-disc">{read ? <Check /> : <BookOpen />}</span>
            <b>{t("A quick introduction")}</b>
            <small>{t(read ? "Lesson read" : "Quick lesson")}</small>
          </a>
        </div>
        {[...coreRoute, ...sides].map((e) => {
          const position = places.get(e.id);
          if (!position) return null;
          const prerequisite = lockedBy(e, items, progress);
          const done = !!progress.completed[e.id];
          const gold = goldFor(e.id);
          const mastered = !!gold && !!progress.completed[gold.id];
          const state = mastered ? "mastered" :
            done ? "complete" : prerequisite ? "locked" : "available";
          const icons = {
            mastered: e.finale ? Crown : Star,
            complete: e.finale ? Crown : Check,
            locked: e.finale ? Crown : LockKeyhole,
            available: e.finale ? Crown : e.kind === "optional" ? Compass : Code2,
          };
          const Icon = icons[state];
          const status = t({
            mastered: "Gold earned",
            complete: "Completed · Try gold",
            locked: "Locked",
            available: "Available",
          }[state]);
          const name = t(
            e.finale ? "Final challenge" :
              e.kind === "optional" ? "Side quest" : "Core challenge",
          );
          return (
            <div
              key={e.id}
              className={"trail-stop map-stop " + (e.finale ? "final-stop" : e.kind === "optional" ? "side-quest-stop" : "core-stop")}
              style={{ left: position.x / 10 + "%", top: position.y / 640 * 100 + "%" }}
            >
              <a
                className={"trail-node " + state}
                href={prerequisite ? undefined : "#workspace/" + e.id}
                role={prerequisite ? "link" : undefined}
                aria-disabled={prerequisite ? true : undefined}
                tabIndex={prerequisite ? 0 : undefined}
                aria-label={[
                  e.title,
                  name,
                  prerequisite
                    ? t("Unlock after {title}", { title: prerequisite.title })
                    : status,
                ].join(" · ")}
                title={
                  prerequisite
                    ? t("Unlock after {title}", { title: prerequisite.title })
                    : undefined
                }
              >
                <span className="trail-disc-wrap">
                  <span className="trail-disc"><Icon /></span>
                  {done && <TinyMedals id={e.id} stats={progress.comparisons[e.id]} />}
                </span>
                <b>{e.title}</b>
                <small>{name} · {status}</small>
              </a>
              {done && gold && (
                <a className="trail-gold-shortcut" href={"#workspace/" + gold.id}>
                  <Star size={12} aria-hidden="true" />
                  {t(mastered ? "Open gold" : "Try gold")}
                </a>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
