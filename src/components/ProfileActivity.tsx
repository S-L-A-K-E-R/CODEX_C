import { useState } from "react";
import { BarChart3, CheckCircle2, Sparkles } from "lucide-react";
import { useLanguage } from "../i18n/Language.tsx";
import { useProgress } from "../state/store.ts";
import {
  challengeXp, learningHistory, learningRanges,
  type LearningMetric, type LearningRange,
} from "../analysis/learning.ts";

const RANGE_LABELS: Record<LearningRange, string> = {
  "30d": "30 days",
  "90d": "90 days",
  "6m": "6 months",
  "12m": "1 year",
  "30m": "30 months",
};

export function ProfileActivity() {
  const {
    language, t,
    course: { exercises },
  } = useLanguage();
  const progress = useProgress();
  const [range, setRange] = useState<LearningRange>("30d");
  const [metric, setMetric] = useState<LearningMetric>("exercises");
  const [selected, setSelected] = useState<number | null>(null);
  const history = learningHistory(progress.completed, exercises, range, language);
  const exercisesInPeriod = history.reduce((sum, bucket) => sum + bucket.exercises, 0);
  const xpInPeriod = history.reduce((sum, bucket) => sum + bucket.xp, 0);
  const allTimeXp = exercises.reduce(
    (sum, exercise) => sum + (progress.completed[exercise.id] ? challengeXp(exercise) : 0), 0,
  );
  const nf = new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US");
  const left = 44;
  const right = 14;
  const top = 16;
  const bottom = 205;
  const width = 800;
  const plotWidth = width - left - right;
  const plotHeight = bottom - top;
  const peak = Math.max(1, ...history.map((bucket) => bucket[metric]));
  const chartPeak = peak < 5 ? peak : Math.ceil(peak / 5) * 5;
  const spacing = plotWidth / history.length;
  const barWidth = Math.max(4, spacing * 0.66);
  const selectedBucket = selected === null ? null : history[selected] ?? null;

  return (
    <section className="panel progress-insights" aria-labelledby="learning-insights-heading">
      <div className="section-top progress-insights-heading">
        <div>
          <div className="eyebrow"><BarChart3 size={14} /> {t("ADVENTURE LOG")}</div>
          <h2 id="learning-insights-heading">{t("Your journey, in numbers")}</h2>
          <p>{t("Real completed exercises and experience, not a daily streak.")}</p>
        </div>
        <div className="progress-insights-totals">
          <span><CheckCircle2 size={15} /> <strong>{nf.format(exercisesInPeriod)}</strong> {t("Exercises")}</span>
          <span><Sparkles size={15} /> <strong>{nf.format(xpInPeriod)}</strong> XP</span>
          <span className="muted">{nf.format(allTimeXp)} {t("XP all time")}</span>
        </div>
      </div>
      <div className="progress-chart-controls">
        <div className="progress-chart-switch" role="group" aria-label={t("Chart metric")}>
          {(["exercises", "xp"] as const).map((value) => (
            <button type="button" key={value} aria-pressed={metric === value}
              className={metric === value ? "active" : ""}
              onClick={() => { setMetric(value); setSelected(null); }}>
              {value === "exercises" ? t("Exercises") : "XP"}
            </button>
          ))}
        </div>
        <div className="progress-chart-switch range-switch" role="group" aria-label={t("Chart period")}>
          {learningRanges.map((value) => (
            <button type="button" key={value} aria-pressed={range === value}
              className={range === value ? "active" : ""}
              onClick={() => { setRange(value); setSelected(null); }}>
              {t(RANGE_LABELS[value])}
            </button>
          ))}
        </div>
      </div>
      <div className="learning-chart-scroll">
        <svg viewBox="0 0 800 252" className="learning-chart" role="img"
          aria-label={t("{total} {metric} in the selected period", {
            total: nf.format(metric === "xp" ? xpInPeriod : exercisesInPeriod),
            metric: metric === "xp" ? "XP" : t("completed exercises"),
          })}>
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const y = bottom - fraction * plotHeight;
            return (
              <g key={fraction}>
                <line className="learning-chart-grid" x1={left} x2={width - right} y1={y} y2={y} />
                <text className="learning-chart-axis" x={left - 9} y={y + 4} textAnchor="end">
                  {nf.format(Math.round(chartPeak * fraction))}
                </text>
              </g>
            );
          })}
          {history.map((bucket, i) => {
            const value = bucket[metric];
            const height = value === 0 ? 0 : Math.max(3, (value / chartPeak) * plotHeight);
            const x = left + (i + 0.5) * spacing;
            const isSelected = selected === i;
            return (
              <g key={bucket.key}>
                {value > 0 && (
                  <rect className={"learning-chart-bar" + (isSelected ? " selected" : "")}
                    x={x - barWidth / 2} y={bottom - height} width={barWidth} height={height} rx={Math.min(4, barWidth / 3)}
                    tabIndex={0} role="button"
                    aria-label={t("{date}: {count} exercises, {xp} XP", {
                      date: bucket.label, count: bucket.exercises, xp: bucket.xp,
                    })}
                    onClick={() => setSelected(i)}
                    onFocus={() => setSelected(i)}
                    onMouseEnter={() => setSelected(i)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelected(i);
                      }
                    }}>
                    <title>{bucket.label}: {bucket.exercises} {t("Exercises").toLowerCase()} · {bucket.xp} XP</title>
                  </rect>
                )}
                {(i === 0 || i === history.length - 1 || i % Math.max(1, Math.floor(history.length / 6)) === 0) && (
                  <text className="learning-chart-axis" textAnchor="middle" x={x} y={bottom + 22}>
                    {bucket.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {exercisesInPeriod === 0 && (
          <div className="learning-chart-empty">
            {t("No completed challenges in this period yet. Your first victory will appear here!")}
          </div>
        )}
      </div>
      <div className="learning-chart-footer">
        <span aria-live="polite">
          {selectedBucket
            ? t("{date}: {count} exercises, {xp} XP", {
                date: selectedBucket.label,
                count: selectedBucket.exercises,
                xp: selectedBucket.xp,
              })
            : t("Select a bar to inspect a day, week or month.")}
        </span>
        <small>{t("XP: core 100 · side quest 75 · gold 150 · chapter finale 200. Past completions count automatically.")}</small>
      </div>
    </section>
  );
}
