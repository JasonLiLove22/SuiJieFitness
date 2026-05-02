export interface GpsPoint {
  lat: number;
  lng: number;
  timestamp: number;
}

/** Haversine distance between two GPS points (returns km) */
export function getDistance(p1: GpsPoint, p2: GpsPoint): number {
  const R = 6371;
  const dLat = toRad(p2.lat - p1.lat);
  const dLng = toRad(p2.lng - p1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(p1.lat)) * Math.cos(toRad(p2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export interface SplitPace {
  km: number;
  pace: number;
  seconds: number;
}

/** Given recorded GPS points, compute per-km splits */
export function computeSplits(points: GpsPoint[]): SplitPace[] {
  if (points.length < 2) return [];
  const splits: SplitPace[] = [];
  let totalDistance = 0;
  let kmStartIdx = 0;
  let kmStartDist = 0;

  for (let i = 1; i < points.length; i++) {
    const d = getDistance(points[i - 1], points[i]);
    totalDistance += d;
    const kmDistance = totalDistance - kmStartDist;

    if (kmDistance >= 1) {
      const timeSec = (points[i].timestamp - points[kmStartIdx].timestamp) / 1000;
      const paceMinPerKm = timeSec / 60 / kmDistance;
      splits.push({
        km: splits.length + 1,
        pace: Math.round(paceMinPerKm * 100) / 100,
        seconds: Math.round(timeSec),
      });
      kmStartIdx = i;
      kmStartDist = totalDistance;
    }
  }

  return splits;
}
