import type { Chapter } from "../data/curriculum.ts";
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

export function WorldOverview({
  chapters,
  selectedChapter,
}: {
  chapters: Chapter[];
  selectedChapter: string;
}) {
  const { t, course: { byChapter } } = useLanguage();
  const progress = useProgress();
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

  return (
    <section className="world-overview" id="world-atlas" aria-labelledby="world-overview-title">
      <div className="world-overview-heading">
        <div>
          <div className="eyebrow">{t("15 regions, one C adventure")}</div>
          <h2 id="world-overview-title">{t("Explore the chapters")}</h2>
          <p>{t("Choose a chapter to discover its lessons and challenges.")}</p>
        </div>
        <div className="world-overview-legend" aria-label={t("Chapter status legend")}>
          <span className="world-legend-dot open" /> {t("To explore")}
          <span className="world-legend-dot complete" /> {t("Completed")}
          <span className="world-legend-dot mastered" /> {t("Gold earned")}
        </div>
      </div>
      <nav className="world-region-index" aria-label={t("All chapters")}>
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
