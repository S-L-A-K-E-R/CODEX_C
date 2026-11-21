import { Award, Gauge, Scissors, TrendingUp } from "lucide-react";
import { useLanguage } from "../i18n/Language.tsx";
import { earnedMedals, type ChallengeComparison } from "../analysis/metrics.ts";
import references from "../data/reference-metrics.json";

export function TinyMedals({ stats }: { stats?: ChallengeComparison }) {
  const { t } = useLanguage();
  const icons = { speed: Gauge, work: TrendingUp, length: Scissors };
  const labels = { speed: "Speedrunner", work: "Optimizer", length: "Minimalist" };
  return <span className="tiny-medals">{earnedMedals(stats).map(key => {
    const Icon = icons[key];
    return <span className={"tiny-medal "+key} title={t(labels[key])} aria-label={t(labels[key])} key={key}><Icon size={11}/></span>;
  })}</span>;
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
    <div className="metrics-summary"><span><Award size={15}/>{t("{n} verified attempts",{n:stats.checks})}</span><TinyMedals stats={stats}/></div>
    <MetricRow label={t("Speed")} value={stats.latest.timeMs} first={stats.first.timeMs} unit="ms" description={t("Measured execution time per test (average); excludes compilation. Browser and device dependent.")}/>
    <MetricRow label={t("Algorithmic work (estimate)")} value={stats.latest.workUnits} first={stats.first.workUnits} reference={reference?.workUnits} unit={t("units")}
      description={t("Static loop-aware estimate, NOT a count of executed instructions. Dynamic loop bounds are approximated.")}/>
    <MetricRow label={t("Code length")} value={stats.latest.sourceInstructions} first={stats.first.sourceInstructions} reference={reference?.sourceInstructions} unit={t("statements")}
      description={t("Approximate written statements, not lines: a loop body is counted once, 100 manual assignments count separately.")}/>
    <div className="metrics-notes"><b>{t("Personal bests")}</b>
      <span>{t("Speed")}: {stats.fastest.toFixed(2)} ms · {t("Work")}: {fmt(stats.leastWork)} · {t("Length")}: {fmt(stats.shortest)}</span>
      {reference&&<small>{t("Example values come from a bundled solution, not student averages or proven optimal limits.")}</small>}
      <small>{t("Medals reward improvement over your first verified solution. Retry to earn them.")}</small>
    </div>
    <button className="btn primary" onClick={onClose}>{t("Continue coding")}</button>
  </div>;
}
