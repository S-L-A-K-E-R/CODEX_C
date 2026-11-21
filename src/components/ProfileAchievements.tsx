import { useState } from "react";
import { ArrowUpRight, LockKeyhole, Trophy } from "lucide-react";
import { getAchievements, type AchievementCategory } from "../data/achievements.ts";
import { useLanguage } from "../i18n/Language.tsx";
import { useProgress } from "../state/store.ts";

type Filter = "all" | AchievementCategory;
const filters: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All emblems" },
  { id: "journey", label: "The journey" },
  { id: "exploration", label: "Secret paths" },
  { id: "gold", label: "Gold & bosses" },
  { id: "craft", label: "Region masters" },
  { id: "projects", label: "Builders' guild" },
];

export function ProfileAchievements() {
  const { t, course: { chapters, exercises } } = useLanguage();
  const progress = useProgress();
  const [filter, setFilter] = useState<Filter>("all");
  const achievements = getAchievements(progress, chapters, exercises);
  const earned = achievements.filter((achievement) => achievement.goal > 0 && achievement.current >= achievement.goal);
  const visible = filter === "all"
    ? achievements
    : achievements.filter((achievement) => achievement.category === filter);
  const next = achievements.filter((achievement) => achievement.current < achievement.goal)
    .sort((a, b) => b.current / Math.max(b.goal, 1) - a.current / Math.max(a.goal, 1))[0];
  return (
    <section className="panel achievements-panel" aria-labelledby="achievements-heading">
      <div className="section-top achievements-heading">
        <div>
          <div className="eyebrow"><Trophy size={14} /> {t("THE ADVENTURER'S GUILD")}</div>
          <h2 id="achievements-heading">{t("Emblems of the journey")}</h2>
          <p>{t("A world of side quests, secret paths and chapter guardians. Earn emblems by learning, not by maintaining a streak.")}</p>
        </div>
        <span className="achievement-summary">{t("{earned} / {total} unlocked", {
          earned: earned.length, total: achievements.length,
        })}</span>
      </div>
      {next && (
        <a className="next-quest" href={next.href}>
          <div className="next-quest-icon"><next.icon size={22} /></div>
          <div>
            <small>{t("YOUR NEXT QUEST")}</small>
            <strong>{t(next.name)}</strong>
            <span>{t(next.description)} · {Math.min(next.current, next.goal)} / {next.goal}</span>
          </div>
          <ArrowUpRight size={19} />
        </a>
      )}
      <div className="achievement-filters" role="group" aria-label={t("Achievement categories")}>
        {filters.map((item) => (
          <button type="button" key={item.id} aria-pressed={filter === item.id}
            className={filter === item.id ? "active" : ""}
            onClick={() => setFilter(item.id)}>
            {t(item.label)}
          </button>
        ))}
      </div>
      <div className="achievement-collection">
        {visible.map((achievement) => {
          const unlocked = achievement.goal > 0 && achievement.current >= achievement.goal;
          const progressPercent = Math.min(100, (achievement.current / Math.max(achievement.goal, 1)) * 100);
          return (
            <a href={achievement.href} key={achievement.id}
              className={"quest-achievement" + (unlocked ? " unlocked" : "") + (achievement.category === "gold" ? " golden" : "")}>
              <span className="quest-achievement-icon">
                <achievement.icon size={26} strokeWidth={1.8} />
                {!unlocked && <LockKeyhole className="quest-lock" size={12} />}
              </span>
              <strong>{t(achievement.name)}</strong>
              <small>{t(achievement.description)}</small>
              <div className="quest-progress" role="progressbar"
                aria-label={t(achievement.name)} aria-valuenow={Math.min(achievement.current, achievement.goal)}
                aria-valuemin={0} aria-valuemax={achievement.goal}>
                <span style={{ width: progressPercent + "%" }} />
              </div>
              <span className="quest-status">
                {unlocked ? t("Unlocked") : t("{current} / {goal}", {
                  current: Math.min(achievement.current, achievement.goal),
                  goal: achievement.goal,
                })}
              </span>
            </a>
          );
        })}
      </div>
      <p className="small muted">{t("Achievements reflect the challenges and project milestones saved in this browser. Select one to continue its path.")}</p>
    </section>
  );
}
