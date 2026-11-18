export type Interval = [number, number];
export function mergeCoverage(ranges: Interval[], start: number, end: number): Interval[] {
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start) return ranges;
  const sorted: Interval[] = [...ranges, [start, end] as Interval].sort((a,b) => a[0]-b[0]);
  return sorted.reduce<Interval[]>((result, current) => {
    const previous = result[result.length - 1];
    if (previous && current[0] <= previous[1] + 0.25) previous[1] = Math.max(previous[1], current[1]);
    else result.push([...current]);
    return result;
  }, []);
}
export function coverageRatio(ranges: Interval[], duration: number) {
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  return Math.min(1, ranges.reduce((total,[a,b]) => total + Math.max(0, Math.min(b,duration)-Math.max(0,a)), 0)/duration);
}
export function acceptedPlaybackSegment(previous: {seconds:number; at:number; rate:number} | null, seconds:number, at:number, rate:number): Interval | null {
  if (!previous || ![seconds,at,rate].every(Number.isFinite)) return null;
  const wall = (at-previous.at)/1000;
  const delta = seconds-previous.seconds;
  if (wall <= 0 || wall > 3 || delta <= 0 || delta > wall * Math.max(rate,previous.rate) + 0.6) return null;
  return [previous.seconds,seconds];
}
