import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Footprints, Bike, Flame, Gauge, Clock, Route } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import EmptyState from '../components/shared/EmptyState';
import { getAllRuns, type RunningRecord, type AllRecordsResponse } from '../api/running';
import { formatPace } from '../utils/calories';
import { formatMinutes } from '../utils/format';
import dayjs from 'dayjs';

export default function RunDetailPage() {
  return <ActivityDetailPage type="run" />;
}

export function RideDetailPage() {
  return <ActivityDetailPage type="ride" />;
}

function ActivityDetailPage({ type }: { type: 'run' | 'ride' }) {
  const navigate = useNavigate();
  const [data, setData] = useState<AllRecordsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const isRun = type === 'run';
  const title = isRun ? '跑步记录' : '骑行历史';
  const color = isRun ? 'text-green-500' : 'text-sky-500';
  const bg = isRun ? 'bg-green-50' : 'bg-sky-50';

  useEffect(() => {
    getAllRuns(type).then((res) => {
      setData(res);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [type]);

  const visibleRuns = data?.runs.filter(r => !r.hidden) || [];

  return (
    <PageContainer>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/profile')} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} className="text-gray-400" />
        </button>
        <h2 className="text-lg font-bold">{title}</h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : !data ? (
        <EmptyState message="加载失败" />
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className={`${bg} rounded-xl p-4`}>
              <div className="flex items-center gap-2 mb-2">{isRun ? <Footprints size={18} className={color} /> : <Bike size={18} className={color} />}</div>
              <p className="text-lg font-bold">{visibleRuns.length}</p>
              <p className="text-xs text-gray-400">记录次数</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2"><Flame size={18} className="text-orange-400" /></div>
              <p className="text-lg font-bold">{data.totalCalories} kcal</p>
              <p className="text-xs text-gray-400">累计消耗</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2"><Route size={18} className="text-blue-400" /></div>
              <p className="text-lg font-bold">{data.totalDistance} km</p>
              <p className="text-xs text-gray-400">累计公里</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2"><Clock size={18} className="text-amber-500" /></div>
              <p className="text-lg font-bold">{Math.round(visibleRuns.reduce((s, r) => s + r.minutes, 0))} min</p>
              <p className="text-xs text-gray-400">累计时长</p>
            </div>
          </div>

          {/* Records */}
          {visibleRuns.length === 0 ? (
            <EmptyState message="暂无记录" />
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-500">历史记录</h3>
              {visibleRuns.map((run) => (
                <RunCard key={run.id} run={run} isRun={isRun} />
              ))}
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}

function RunCard({ run, isRun }: { run: RunningRecord; isRun: boolean }) {
  const color = isRun ? 'text-green-500' : 'text-sky-500';
  const bg = isRun ? 'bg-green-50' : 'bg-sky-50';

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{dayjs(run.date).format('YYYY-MM-DD')}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${bg} ${color}`}>
          {isRun ? '跑步' : '骑行'}
        </span>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span className="font-medium text-gray-700">{run.distance} km</span>
        <span className="text-gray-400">{formatMinutes(run.minutes)}</span>
        <span className="text-gray-400">
          <Gauge size={14} className="inline mr-0.5" />
          {formatPace(run.pace)}/km
        </span>
        <span className="text-orange-400 ml-auto">{run.calories} kcal</span>
      </div>
      {run.created_at && (
        <div className="mt-2 text-xs text-gray-300">
          {dayjs(run.created_at).format('HH:mm:ss')} 完成
        </div>
      )}
    </div>
  );
}
