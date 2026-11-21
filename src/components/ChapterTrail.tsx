import {
  BookOpen,
  Check,
  Code2,
  Compass,
  LockKeyhole,
  Star,
} from "lucide-react";
import type { Chapter, Exercise } from "../data/curriculum.ts";
import { useLanguage } from "../i18n/Language.tsx";
import { TinyMedals } from "./ChallengeMetrics.tsx";
import { lockedBy } from "../state/path.ts";
import { useProgress } from "../state/store.ts";

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
  const [first, second] = items.filter((e) => e.kind === "core");
  const side = items.find((e) => e.kind === "optional")!;
  const read = !!progress.lessons[chapter.id];
  return (
    <div className="trail-frame">
      <nav
        className="chapter-trail"
        aria-label={t("Chapter path: {title}", { title: chapter.title })}
      >
        <svg
          className="trail-lines wide"
          viewBox="0 0 600 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M100 50 H300" />
          <path d="M300 50 H342 C397 50 390 0 450 0 H500" />
          <path
            className="side-track"
            d="M342 50 C397 50 390 100 450 100 H500"
          />
        </svg>
        <svg
          className="trail-lines narrow"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M25 0 H75" />
          <path d="M75 0 V25 C75 65 25 35 25 75 V100" />
          <path className="side-track" d="M75 25 V100" />
        </svg>
        <div className="trail-stop lesson-stop">
          <a
            className={"trail-node lesson " + (read ? "complete" : "available")}
            href={"#lesson/" + chapter.id}
          >
            <span className="trail-disc">
              {read ? <Check /> : <BookOpen />}
            </span>
            <b>{t("A quick introduction")}</b>
            <small>{t(read ? "Lesson read" : "Quick lesson")}</small>
          </a>
        </div>
        {[first, second, side].map((e, index) => {
          const prerequisite = lockedBy(e, items, progress);
          const done = !!progress.completed[e.id];
          const gold = goldFor(e.id)!;
          const mastered = !!progress.completed[gold.id];
          const state = mastered
            ? "mastered"
            : done
              ? "complete"
              : prerequisite
                ? "locked"
                : "available";
          const icons = {
            mastered: Star,
            complete: Check,
            locked: LockKeyhole,
            available: e.kind === "optional" ? Compass : Code2,
          };
          const Icon = icons[state];
          const status = t(
            {
              mastered: "Gold earned",
              complete: "Completed · Try gold",
              locked: "Locked",
              available: "Available",
            }[state],
          );
          const name = t(
            e.kind === "optional" ? "Side quest" : "Core challenge",
          );
          return (
            <div
              key={e.id}
              className={
                "trail-stop " +
                ["first-stop", "second-stop", "side-stop"][index]
              }
            >
              <a
                className={"trail-node " + state}
                href={
                  prerequisite
                    ? undefined
                    : "#workspace/" + e.id
                }
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
                  <span className="trail-disc">
                    <Icon />
                  </span>
                  {done && <TinyMedals id={e.id} stats={progress.comparisons[e.id]} />}
                </span>
                <b>{e.title}</b>
                <small>
                  {name} · {status}
                </small>
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
