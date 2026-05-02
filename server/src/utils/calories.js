const RUN_MET_TABLE = [
  { maxPace: 4.5, met: 12.0 },
  { maxPace: 5.5, met: 10.0 },
  { maxPace: 6.5, met: 9.0 },
  { maxPace: 8.0, met: 8.0 },
  { maxPace: Infinity, met: 7.0 },
];

// Cycling MET based on speed (km/h)
const RIDE_MET_TABLE = [
  { maxSpeed: 16, met: 4.0 },
  { maxSpeed: 20, met: 6.5 },
  { maxSpeed: 24, met: 8.0 },
  { maxSpeed: Infinity, met: 10.0 },
];

export function calculatePace(distanceKm, minutes) {
  if (minutes <= 0) return 0;
  return Math.round((minutes / distanceKm) * 100) / 100;
}

export function calculateCalories(weightKg, distanceKm, minutes, type = 'run') {
  if (minutes <= 0) return 0;
  const hours = minutes / 60;
  let met;

  if (type === 'ride') {
    const speed = distanceKm / hours;
    met = RIDE_MET_TABLE.find(m => speed < m.maxSpeed).met;
  } else {
    const pace = calculatePace(distanceKm, minutes);
    met = RUN_MET_TABLE.find(m => pace < m.maxPace).met;
  }

  return Math.round(met * weightKg * hours);
}
