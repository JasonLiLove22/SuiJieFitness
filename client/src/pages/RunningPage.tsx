import { useState, useEffect, useRef } from 'react';
import { Play, Square } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/shared/Button';
import { addRun } from '../api/running';
import { useAuth } from '../contexts/AuthContext';
import { calculatePace, calculateCalories, formatPace } from '../utils/calories';
import { getDistance, computeSplits, type GpsPoint, type SplitPace } from '../utils/gps';
import { todayStr } from '../utils/format';

type Phase = 'idle' | 'running' | 'finished';
type SportType = 'run' | 'ride';

export default function RunningPage() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>('idle');
  const [sportType, setSportType] = useState<SportType>('run');
  const [elapsed, setElapsed] = useState(0);
  const [curDist, setCurDist] = useState(0);
  const [curPace, setCurPace] = useState(0);
  const [saving, setSaving] = useState(false);
  const [gpsError, setGpsError] = useState('');

  const pointsRef = useRef<GpsPoint[]>([]);
  const distRef = useRef(0);
  const splitsRef = useRef<SplitPace[]>([]);
  const watchIdRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastKmRef = useRef(0);
  const kmStartTimeRef = useRef(0);
  const sportTypeRef = useRef<SportType>('run');

  const weight = user?.weight || 70;

  useEffect(() => () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    if (timerRef.current !== null) clearInterval(timerRef.current);
  }, []);

  const startRun = (type: SportType) => {
    sportTypeRef.current = type;
    setSportType(type);
    setGpsError('');
    pointsRef.current = [];
    distRef.current = 0;
    splitsRef.current = [];
    setCurDist(0);
    setCurPace(0);
    setElapsed(0);
    lastKmRef.current = 0;
    kmStartTimeRef.current = Date.now();
    startTimeRef.current = Date.now();

    if (!navigator.geolocation) {
      setGpsError('设备不支持GPS定位');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const p: GpsPoint = { lat: pos.coords.latitude, lng: pos.coords.longitude, timestamp: pos.timestamp || Date.now() };
        const prev = pointsRef.current;
        prev.push(p);
        if (prev.length >= 2) {
          const seg = getDistance(prev[prev.length - 2], p);
          distRef.current += seg;
          setCurDist(Math.round(distRef.current * 1000) / 1000);

          const cutoff = p.timestamp - 30000;
          const recent = prev.filter(x => x.timestamp >= cutoff);
          if (recent.length >= 2) {
            let recentDist = 0;
            for (let i = 1; i < recent.length; i++) recentDist += getDistance(recent[i - 1], recent[i]);
            const recentTime = (recent[recent.length - 1].timestamp - recent[0].timestamp) / 1000 / 60;
            if (recentDist > 0.01 && recentTime > 0) setCurPace(calculatePace(recentDist, recentTime));
          }

          const kmDone = Math.floor(distRef.current);
          if (kmDone > lastKmRef.current) {
            const splitTime = (p.timestamp - kmStartTimeRef.current) / 1000;
            splitsRef.current.push({ km: kmDone, pace: calculatePace(1, splitTime / 60), seconds: Math.round(splitTime) });
            lastKmRef.current = kmDone;
            kmStartTimeRef.current = p.timestamp;
          }
        }
      },
      () => { setGpsError('GPS信号弱，请到空旷处'); },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 30000 }
    );

    timerRef.current = setInterval(() => {
      setElapsed(Math.round((Date.now() - startTimeRef.current) / 1000));
    }, 200);

    setPhase('running');
  };

  const stopRun = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setElapsed(Math.round((Date.now() - startTimeRef.current) / 1000));
    setPhase('finished');
  };

  const handleSave = async () => {
    const distance = distRef.current;
    const minutes = (Date.now() - startTimeRef.current) / 1000 / 60;
    if (distance < 0.01 || minutes < 0.02) return;

    setSaving(true);
    try {
      const splits = computeSplits(pointsRef.current);
      await addRun({ date: todayStr(), distance: Math.round(distance * 100) / 100, minutes: Math.round(minutes * 100) / 100, splits, type: sportTypeRef.current });
      setPhase('idle');
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const handleDiscard = () => { setPhase('idle'); };

  const totalMin = elapsed / 60;
  const avgPace = curDist > 0 && totalMin > 0 ? calculatePace(curDist, totalMin) : 0;
  const calories = curDist > 0 && totalMin > 0 ? calculateCalories(weight, curDist, totalMin, sportType) : 0;
  const splits = splitsRef.current;

  const formatTimer = (sec: number): string => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // --- IDLE ---
  if (phase === 'idle') {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-between pt-6" style={{ minHeight: 'calc(100vh - 180px)' }}>
          {/* Run button */}
          <button
            onClick={() => startRun('run')}
            className="w-60 h-60 rounded-full bg-primary hover:bg-primary-dark active:scale-95 transition-all flex flex-col items-center justify-center shadow-lg shadow-primary/30"
          >
            <Play size={40} className="text-white ml-2" fill="white" />
            <span className="text-white text-lg font-bold mt-1">开始跑步</span>
          </button>

          {gpsError && (
            <div className="mt-4 bg-red-50 text-red-500 text-sm rounded-xl px-4 py-3 text-center">
              {gpsError}
            </div>
          )}

          {/* Ride button */}
          <button
            onClick={() => startRun('ride')}
            className="w-60 h-60 rounded-full bg-sky-500 hover:bg-sky-600 active:scale-95 transition-all flex flex-col items-center justify-center shadow-lg shadow-sky-500/30"
          >
            <Play size={40} className="text-white ml-2" fill="white" />
            <span className="text-white text-lg font-bold mt-1">开始骑行</span>
          </button>
        </div>
      </PageContainer>
    );
  }

  // --- RUNNING ---
  if (phase === 'running') {
    const isRide = sportType === 'ride';
    return (
      <PageContainer>
        <div className="flex flex-col items-center pt-8">
          <p className="text-sm text-gray-400 mb-2">{isRide ? '正在骑行' : '正在跑步'}</p>
          <p className="text-6xl font-mono font-bold text-gray-800 mb-2 tracking-tight">{formatTimer(elapsed)}</p>
          <p className="text-gray-400 text-sm mb-8">已用时间</p>
          <div className="text-center mb-4">
            <p className="text-4xl font-bold text-primary">{curDist.toFixed(2)}</p>
            <p className="text-gray-400 text-sm">公里</p>
          </div>
          <div className="flex gap-8 mb-8">
            <div className="text-center">
              <p className="text-xl font-bold text-gray-700">{curPace > 0 ? formatPace(curPace) : '--\''}</p>
              <p className="text-gray-400 text-sm">当前配速</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-orange-500">{calories}</p>
              <p className="text-gray-400 text-sm">kcal</p>
            </div>
          </div>

          {splits.length > 0 && (
            <div className="w-full bg-white rounded-xl border border-gray-100 p-3 mb-8">
              <p className="text-sm text-gray-400 mb-2">每公里配速</p>
              <div className="flex flex-wrap gap-2">
                {splits.map(s => (
                  <span key={s.km} className="text-xs bg-gray-50 px-2 py-1 rounded-full text-gray-600">
                    {s.km}km: {formatPace(s.pace)}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={stopRun}
            className="w-24 h-24 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 transition-all flex flex-col items-center justify-center shadow-lg shadow-red-500/30"
          >
            <Square size={32} className="text-white" fill="white" />
            <span className="text-white text-xs font-medium mt-0.5">结束</span>
          </button>
        </div>
      </PageContainer>
    );
  }

  // --- FINISHED ---
  return (
    <PageContainer>
      <div className="flex flex-col items-center pt-4">
        <div className="w-full bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-bold text-center mb-4">{sportType === 'ride' ? '骑行完成' : '跑步完成'}</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Stat label="距离" value={`${curDist.toFixed(2)} km`} />
            <Stat label="用时" value={formatTimer(elapsed)} />
            <Stat label="平均配速" value={avgPace > 0 ? `${formatPace(avgPace)}/km` : '--'} />
            <Stat label="消耗" value={`${calories} kcal`} color="text-orange-500" />
          </div>
          {splits.length > 0 && (
            <div className="border-t border-gray-100 pt-4 mb-4">
              <p className="text-sm text-gray-400 mb-2">每公里配速</p>
              <div className="space-y-1">
                {splits.map(s => (
                  <div key={s.km} className="flex justify-between text-sm">
                    <span className="text-gray-500">第{s.km}公里</span>
                    <span className="font-medium">{formatPace(s.pace)}/km</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={handleDiscard}>丢弃</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving || curDist < 0.01}>
              {saving ? '保存中...' : '保存记录'}
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function Stat({ label, value, color = 'text-gray-800' }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}
