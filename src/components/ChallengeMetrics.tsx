import { Award, Scissors, TrendingUp } from "lucide-react";
import { useLanguage } from "../i18n/Language.tsx";
import { earnedMedals, type ChallengeComparison } from "../analysis/metrics.ts";
import baseReferences from "../data/reference-metrics.json";
import extra1Metrics from "../data/expansion-1-metrics.json";
import extra2Metrics from "../data/expansion-2-metrics.json";
import extra3Metrics from "../data/expansion-3-metrics.json";
import extra4Metrics from "../data/expansion-4-metrics.json";
import extra5Metrics from "../data/expansion-5-metrics.json";
const references = {
  ...baseReferences,
  ...extra1Metrics,
  ...extra2Metrics,
  ...extra3Metrics,
  ...extra4Metrics,
  ...extra5Metrics,
};

export function TinyMedals({ id, stats }: { id: string; stats?: ChallengeComparison }) {
  const { t } = useLanguage();
  const reference = (references as Record<string, {sourceInstructions:number;workUnits:number}>)[id];
  const earned = earnedMedals(stats, reference);
  const options = [
    {kind:"work" as const, icon:TrendingUp, name:t("Optimizer")},
    {kind:"length" as const, icon:Scissors, name:t("Minimalist")}
  ];
  return <span className="tiny-medals">
    {options.map(({kind,icon:Icon,name}) => {
      const unlocked = earned.includes(kind);
      const tooltip = unlocked ? t("{name} medal earned",{name}) : stats
        ? t("{name} medal locked — improve your code or match the example",{name})
        : t("{name} medal locked — check the completed solution to evaluate it",{name});
      return <span className={"tiny-medal "+kind+(unlocked?" earned":" locked")} title={tooltip} aria-label={tooltip} key={kind}>
        <Icon size={11} aria-hidden="true"/>
      </span>;
    })}
  </span>;
}
function fmt(n:number) { return n>=1000 ? n.toLocaleString() : String(n); }
function MetricRow({label,value,first,reference,unit,description}: {label:string;value:number;first:number;reference?:number;unit:string;description:string}) {
  const high=Math.max(value,first,reference??0,1);
  const bars=[
    {label:"Your latest",value,kind:"self"},
    {label:"Your first",value:first,kind:"first"},
    ...(reference===undefined?[]:[{label:"Example solution",value:reference,kind:"reference"}]),
  ];
  const {t}=useLanguage();
  return <section className="metrics-row">
    <div className="metrics-row-heading"><b>{label}</b><strong>{unit==="ms"?value.toFixed(2):fmt(value)} {unit}</strong></div>
    <div className="metrics-bars">{bars.map(bar=><div className="metrics-bar-line" key={bar.kind}>
      <span>{t(bar.label)}</span><div className="metrics-bar-track"><span className={"metrics-bar-fill "+bar.kind} style={{width:Math.max(1,bar.value/high*100)+"%"}}/></div>
      <span>{unit==="ms"?bar.value.toFixed(2):fmt(bar.value)}</span>
    </div>)}</div>
    <small>{description}</small>
  </section>;
}
export function ChallengeMetrics({id,stats,onClose}: {id:string;stats:ChallengeComparison;onClose:()=>void}) {
  const {t}=useLanguage();
  const reference=(references as Record<string,{sourceInstructions:number;workUnits:number}>)[id];
  return <div className="metrics-dashboard">
    <p className="metrics-lead">{t("Three ways to compare your verified solution. Lower is better.")}</p>
    <div className="metrics-summary"><span><Award size={15}/>{t("{n} verified attempts",{n:stats.checks})}</span><TinyMedals id={id} stats={stats}/></div>
    <MetricRow label={t("Speed")} value={stats.latest.timeMs} first={stats.first.timeMs} unit="ms" description={t("Measured execution time per test (average); excludes compilation. Browser and device dependent.")}/>
    <MetricRow label={t("Algorithmic work (estimate)")} value={stats.latest.workUnits} first={stats.first.workUnits} reference={reference?.workUnits} unit={t("units")}
      description={t("Static loop-aware estimate, NOT a count of executed instructions. Dynamic loop bounds are approximated.")}/>
    <MetricRow label={t("Code length")} value={stats.latest.sourceInstructions} first={stats.first.sourceInstructions} reference={reference?.sourceInstructions} unit={t("statements")}
      description={t("Approximate written statements, not lines: a loop body is counted once, 100 manual assignments count separately.")}/>
    <div className="metrics-notes"><b>{t("Personal bests")}</b>
      <span>{t("Speed")}: {stats.fastest.toFixed(2)} ms · {t("Work")}: {fmt(stats.leastWork)} · {t("Length")}: {fmt(stats.shortest)}</span>
      {reference&&<small>{t("Example values come from a bundled solution, not student averages or proven optimal limits.")}</small>}
      <small>{t("Optimizer and Minimalist medals reward matching the example or improving on your first verified solution.")}</small>
    </div>
    <button className="btn primary" onClick={onClose}>{t("Continue coding")}</button>
  </div>;
}
