// Lightweight, deterministic classroom comparison — NOT a C interpreter or instruction profiler.
export interface SourceMetrics { sourceInstructions: number; workUnits: number }
export interface MetricSample extends SourceMetrics { timeMs: number; recordedAt: string }
export interface ChallengeComparison {
  first: MetricSample;
  latest: MetricSample;
  fastest: number;
  leastWork: number;
  shortest: number;
  checks: number;
}
export const analyzeSource: (files: Record<string, string>) => SourceMetrics = function analyze(files) {
  const sources=Object.entries(files).filter(([name])=>/\.(?:c|h)$/.test(name)).map(([,s])=>s);
  let sourceInstructions=0,workUnits=0;
  for (let source of sources) {
    source=source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,match=>match[0]==='"'||match[0]==="'" ? '""' : ' ');
    source=source.replace(/^\s*#.*$/gm," ");
    const tokens=source.match(/[A-Za-z_]\w*|\d+|<=|>=|==|!=|\+\+|--|[{}();<>+\-=!&|[\],]/g)||[];
    const factors=[1];let pending=1,parens=0;
    const current=()=>factors[factors.length-1];
    for(let i=0;i<tokens.length;i++){
      const t=tokens[i];
      if(t==="for"||t==="while"||t==="do"){
        sourceInstructions++;workUnits+=current();
        let repeat=12;
        if(t==="for"&&tokens[i+1]==="("){
          let depth=1,end=i+2;
          for(;end<tokens.length&&depth>0;end++){if(tokens[end]==="(")depth++;if(tokens[end]===")")depth--;}
          const head=tokens.slice(i+2,end-1).join(" ");
          const m=head.match(/\b([A-Za-z_]\w*)\s*=\s*(\d+)\s*;\s*\1\s*(<|<=|>|>=)\s*(\d+)/);
          if(m){const start=Number(m[2]),limit=Number(m[4]);repeat=Math.abs(limit-start)+(m[3].includes("=")?1:0);repeat=Math.min(1000,Math.max(1,repeat));}
        }
        pending=Math.min(1_000_000,pending*repeat);
      }else if(t==="if"||t==="switch"){
        sourceInstructions++;workUnits+=current();
      }
      if(t==="(")parens++;
      else if(t===")")parens=Math.max(0,parens-1);
      else if(t==="{"){factors.push(Math.min(1_000_000,current()*pending));pending=1;}
      else if(t==="}"){if(factors.length>1)factors.pop();pending=1;}
      else if(t===";"&&parens===0){sourceInstructions++;workUnits+=Math.min(1_000_000,current()*pending);pending=1;}
    }
  }
  return {sourceInstructions:Math.min(100000,sourceInstructions),workUnits:Math.min(100000000,Math.round(workUnits))};
};
export function earnedMedals(stats?: ChallengeComparison): ("speed" | "work" | "length")[] {
  if (!stats || stats.checks < 2) return [];
  const medals: ("speed" | "work" | "length")[] = [];
  if (stats.first.timeMs > 0.05 && stats.fastest < stats.first.timeMs * 0.8) medals.push("speed");
  if (stats.leastWork < stats.first.workUnits) medals.push("work");
  if (stats.shortest < stats.first.sourceInstructions) medals.push("length");
  return medals;
}
