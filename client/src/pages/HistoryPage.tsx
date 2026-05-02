import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Dumbbell, Footprints, Bike, Check, Minus } from 'lucide-react';
import dayjs from 'dayjs';
import PageContainer from '../components/layout/PageContainer';
import EmptyState from '../components/shared/EmptyState';
import Modal from '../components/shared/Modal';
import Button from '../components/shared/Button';
import { getHistory, type DailyRecord } from '../api/history';
import { formatDate, formatMonth, formatMinutes } from '../utils/format';
import { formatPace } from '../utils/calories';

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

export default function HistoryPage() {
  const now = dayjs();
  const [year, setYear] = useState(now.year());
  const [month, setMonth] = useState(now.month() + 1);
  const [days, setDays] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(year);

  const loadHistory = useCallback(async (y: number, m: number) => {
    setLoading(true);
    try {
      const res = await getHistory(y, m);
      setDays(res.days);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadHistory(year, month); }, [year, month, loadHistory]);

  const goPrev = () => {
    if (month === 1) { setYear(year - 1); setMonth(12); }
    else { setMonth(month - 1); }
  };
  const goNext = () => {
    if (month === 12) { setYear(year + 1); setMonth(1); }
    else { setMonth(month + 1); }
  };

  const openPicker = () => {
    setPickerYear(year);
    setPickerOpen(true);
  };

  const selectMonth = (m: number, y?: number) => {
    setYear(y ?? pickerYear);
    setMonth(m);
    setPickerOpen(false);
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-4">
        <button onClick={goPrev} className="p-2 rounded-full hover:bg-gray-100">
          <ChevronLeft size={20} className="text-gray-400" />
        </button>
        <button onClick={openPicker} className="text-lg font-semibold hover:text-primary transition-colors">
          {formatMonth(year, month)}
        </button>
        <button onClick={goNext} className="p-2 rounded-full hover:bg-gray-100" disabled={year === now.year() && month === now.month() + 1}>
          <ChevronRight size={20} className="text-gray-400" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : days.length === 0 ? (
        <EmptyState message="这个月还没有训练记录" />
      ) : (
        <div className="space-y-3">
          {days.map((day) => (
            <div key={day.date} className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-500">{formatDate(day.date)}</p>
                <div className="flex gap-2">
                  {day.hasTraining && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${day.trainingCompleted ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                      {day.trainingCompleted ? '全部完成' : `${day.completedCount}/${day.exerciseCount}项`}
                    </span>
                  )}
                  {day.runs.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
                      {day.totalDistance.toFixed(1)}km
                    </span>
                  )}
                </div>
              </div>

              {day.hasTraining && (
                <div className="mb-2">
                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-1.5">
                    <Dumbbell size={12} />
                    <span>训练</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {day.exercises.map((ex, i) => (
                      <span key={i} className={`inline-flex items-center gap-1 text-xs ${ex.completed ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                        {ex.completed
                          ? <Check size={12} className="text-green-500" />
                          : <Minus size={12} className="text-gray-300" />}
                        {ex.name} {ex.sets}×{ex.reps}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {day.runs.length > 0 && (
                <div className={day.hasTraining ? 'border-t border-gray-50 pt-2' : ''}>
                  {day.runs.map((run) => {
                    const isRide = run.type === 'ride';
                    return (
                      <div key={run.id} className="flex items-center gap-2 text-sm text-gray-500 py-0.5">
                        {isRide
                          ? <Bike size={14} className="text-sky-400" />
                          : <Footprints size={14} className="text-green-500" />}
                        <span className="text-xs text-gray-300">{isRide ? '骑行' : '跑步'}</span>
                        <span>{run.distance} km</span>
                        <span>·</span>
                        <span>{formatMinutes(run.minutes)}</span>
                        <span>·</span>
                        <span>{formatPace(run.pace)}/km</span>
                        <span>·</span>
                        <span className="text-orange-400">{run.calories} kcal</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Year/Month Picker Modal */}
      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title="选择月份">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            <button onClick={() => setPickerYear(pickerYear - 1)} disabled={pickerYear <= 2022} className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30">
              <ChevronLeft size={20} className="text-gray-400" />
            </button>
            <span className="text-xl font-bold">{pickerYear}年</span>
            <button onClick={() => setPickerYear(pickerYear + 1)} disabled={pickerYear >= now.year()} className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30">
              <ChevronRight size={20} className="text-gray-400" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {MONTHS.map((m, i) => {
              const mNum = i + 1;
              const isSelected = pickerYear === year && mNum === month;
              const tooEarly = pickerYear === 2022 && mNum < 2;
              const tooLate = pickerYear === now.year() && mNum > now.month() + 1;
              const disabled = tooEarly || tooLate;
              return (
                <button
                  key={m}
                  onClick={() => !disabled && selectMonth(mNum)}
                  className={`py-3 rounded-xl text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-primary text-white'
                      : disabled
                        ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
          <Button variant="secondary" className="w-full" onClick={() => selectMonth(now.month() + 1, now.year())}>回到本月</Button>
        </div>
      </Modal>
    </PageContainer>
  );
}
