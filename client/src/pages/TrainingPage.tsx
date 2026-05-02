import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Check, Settings2, X } from 'lucide-react';
import dayjs from 'dayjs';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/shared/Button';
import Input from '../components/shared/Input';
import Modal from '../components/shared/Modal';
import EmptyState from '../components/shared/EmptyState';
import { getPlan, savePlan, toggleExercise, type TrainingExercise } from '../api/training';
import { todayStr, formatDate } from '../utils/format';

const DEFAULT_QUICK = ['俯卧撑', '臂屈伸', '引体向上', '深蹲', '卷腹', '平板支撑', '波比跳', '哑铃弯举', '卧推'];

function loadDefault<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

export default function TrainingPage() {
  const [date, setDate] = useState(todayStr());
  const [exercises, setExercises] = useState<TrainingExercise[]>([]);
  const [planId, setPlanId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Defaults from localStorage
  const [defSets, setDefSets] = useState(() => loadDefault('defaultSets', 4));
  const [defReps, setDefReps] = useState(() => loadDefault('defaultReps', 10));
  const [quickList, setQuickList] = useState(() => loadDefault('quickExercises', DEFAULT_QUICK));
  const [newEx, setNewEx] = useState({ name: '', sets: defSets, reps: defReps });

  // Settings draft
  const [draftSets, setDraftSets] = useState(defSets);
  const [draftReps, setDraftReps] = useState(defReps);
  const [draftQuick, setDraftQuick] = useState<string[]>(quickList);
  const [newQuickItem, setNewQuickItem] = useState('');

  const loadPlan = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const res = await getPlan(d);
      setExercises(res.exercises);
      setPlanId(res.plan?.id ?? null);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadPlan(date); }, [date, loadPlan]);
  useEffect(() => { setNewEx({ name: '', sets: defSets, reps: defReps }); }, [defSets, defReps]);

  const handleToggle = async (ex: TrainingExercise) => {
    try {
      await toggleExercise(date, ex.id);
      setExercises((prev) => prev.map((e) => (e.id === ex.id ? { ...e, completed: !e.completed } : e)));
    } catch { /* ignore */ }
  };

  const handleAddExercise = async () => {
    if (!newEx.name.trim()) return;
    const updated = [...exercises, { id: 0, name: newEx.name.trim(), sets: newEx.sets, reps: newEx.reps, completed: false, sort_order: exercises.length }];
    try {
      const res = await savePlan(date, updated);
      setExercises(res.exercises);
      setPlanId(res.plan?.id ?? null);
      setModalOpen(false);
      setNewEx({ name: '', sets: defSets, reps: defReps });
    } catch { /* ignore */ }
  };

  const handleDeleteExercise = async (index: number) => {
    const updated = exercises.filter((_, i) => i !== index);
    try {
      const res = await savePlan(date, updated);
      setExercises(res.exercises);
    } catch { /* ignore */ }
  };

  const handleQuickAdd = async (name: string) => {
    const updated = [...exercises, { id: 0, name, sets: defSets, reps: defReps, completed: false, sort_order: exercises.length }];
    try {
      const res = await savePlan(date, updated);
      setExercises(res.exercises);
      setPlanId(res.plan?.id ?? null);
      setModalOpen(false);
    } catch { /* ignore */ }
  };

  const openSettings = () => {
    setDraftSets(defSets);
    setDraftReps(defReps);
    setDraftQuick([...quickList]);
    setNewQuickItem('');
    setSettingsOpen(true);
  };

  const saveSettings = () => {
    if (draftSets < 0 || draftReps < 0) return;
    localStorage.setItem('defaultSets', JSON.stringify(draftSets));
    localStorage.setItem('defaultReps', JSON.stringify(draftReps));
    localStorage.setItem('quickExercises', JSON.stringify(draftQuick.filter(Boolean)));
    setDefSets(draftSets);
    setDefReps(draftReps);
    setQuickList(draftQuick.filter(Boolean));
    setSettingsOpen(false);
  };

  const addQuickItem = () => {
    const name = newQuickItem.trim();
    if (!name || draftQuick.includes(name)) return;
    setDraftQuick([...draftQuick, name]);
    setNewQuickItem('');
  };

  const removeQuickItem = (idx: number) => {
    setDraftQuick(draftQuick.filter((_, i) => i !== idx));
  };

  const isToday = date === todayStr();
  const maxDate = dayjs().add(7, 'day').format('YYYY-MM-DD');
  const atMaxDate = date >= maxDate;
  const [toast, setToast] = useState(false);
  const doneCount = exercises.filter((e) => e.completed).length;

  const showMaxToast = () => {
    if (!atMaxDate) return;
    setToast(true);
    setTimeout(() => setToast(false), 2200);
  };

  return (
    <PageContainer>
      {/* Date Navigator */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setDate(dayjs(date).subtract(1, 'day').format('YYYY-MM-DD'))} className="p-2 rounded-full hover:bg-gray-100">
          <ChevronLeft size={20} className="text-gray-400" />
        </button>
        <div className="text-center">
          <p className="text-lg font-semibold">{formatDate(date)}</p>
          {!isToday && (
            <button onClick={() => setDate(todayStr())} className="text-sm text-primary mt-0.5">回到今天</button>
          )}
        </div>
        <span onClick={showMaxToast} className={atMaxDate ? 'cursor-pointer' : ''}>
          <button onClick={() => setDate(dayjs(date).add(1, 'day').format('YYYY-MM-DD'))} disabled={atMaxDate} className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none">
            <ChevronRight size={20} className="text-gray-400" />
          </button>
        </span>
      </div>

      {/* Progress bar */}
      {exercises.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-500">完成进度</span>
            <span className="text-primary font-medium">{doneCount}/{exercises.length}</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${exercises.length > 0 ? (doneCount / exercises.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Exercise List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : exercises.length === 0 ? (
        <EmptyState
          message="今天还没有训练计划"
          action={
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={18} className="mr-1" /> 添加训练
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {exercises.map((ex, i) => (
            <div
              key={ex.id || i}
              className={`flex items-center gap-4 bg-white rounded-xl p-4 border transition-colors ${ex.completed ? 'border-primary/30 bg-green-50/50' : 'border-gray-100'}`}
            >
              <button
                onClick={() => handleToggle(ex)}
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${ex.completed ? 'bg-primary border-primary' : 'border-gray-300'}`}
              >
                {!!ex.completed && <Check size={16} className="text-white animate-checkmark" strokeWidth={3} />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${ex.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{ex.name}</p>
                <p className="text-sm text-gray-400">{ex.sets}组 × {ex.reps}次</p>
              </div>
              <button onClick={() => handleDeleteExercise(i)} className="p-2 rounded-full hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Buttons */}
      {exercises.length > 0 && (
        <div className="mt-4 space-y-2">
          <Button variant="secondary" className="w-full" onClick={() => setModalOpen(true)}>
            <Plus size={18} className="mr-1" /> 添加训练
          </Button>
          <Button variant="ghost" size="sm" className="w-full" onClick={openSettings}>
            <Settings2 size={16} className="mr-1" /> 更改默认
          </Button>
        </div>
      )}
      {exercises.length === 0 && (
        <div className="mt-4">
          <Button variant="ghost" size="sm" className="w-full" onClick={openSettings}>
            <Settings2 size={16} className="mr-1" /> 更改默认
          </Button>
        </div>
      )}

      {/* Add Exercise Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="添加训练项目">
        <div className="space-y-4">
          <Input label="训练名称" placeholder="例如: 俯卧撑" value={newEx.name} onChange={(e) => setNewEx({ ...newEx, name: e.target.value })} />
          <div className="flex gap-3">
            <Input label="组数" type="number" value={newEx.sets} onChange={(e) => setNewEx({ ...newEx, sets: parseInt(e.target.value) || 0 })} />
            <Input label="每组次数" type="number" value={newEx.reps} onChange={(e) => setNewEx({ ...newEx, reps: parseInt(e.target.value) || 0 })} />
          </div>
          <Button className="w-full" onClick={handleAddExercise} disabled={!newEx.name.trim()}>添加</Button>
          <div className="pt-2">
            <p className="text-sm text-gray-400 mb-3">快速选择</p>
            <div className="flex flex-wrap gap-2">
              {quickList.map((name) => (
                <button key={name} onClick={() => handleQuickAdd(name)} className="px-3 py-1.5 text-sm bg-gray-100 rounded-full text-gray-600 hover:bg-primary/10 hover:text-primary transition-colors">
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="更改默认设置">
        <div className="space-y-4">
          <div className="flex gap-3">
            <Input label="默认组数" type="number" value={draftSets} onChange={(e) => setDraftSets(parseInt(e.target.value) || 0)} />
            <Input label="默认每组次数" type="number" value={draftReps} onChange={(e) => setDraftReps(parseInt(e.target.value) || 0)} />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">快速选择词条</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {draftQuick.map((name, i) => (
                <span key={`${name}-${i}`} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 rounded-full text-gray-600">
                  {name}
                  <button onClick={() => removeQuickItem(i)} className="text-gray-300 hover:text-red-400">
                    <X size={14} />
                  </button>
                </span>
              ))}
              {draftQuick.length === 0 && <p className="text-sm text-gray-300">暂无词条</p>}
            </div>
            <div className="flex gap-2">
              <Input placeholder="新增词条" value={newQuickItem} onChange={(e) => setNewQuickItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addQuickItem()} />
              <Button variant="secondary" size="sm" onClick={addQuickItem} disabled={!newQuickItem.trim()}>添加</Button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setSettingsOpen(false)}>取消</Button>
            <Button className="flex-1" onClick={saveSettings}>保存</Button>
          </div>
        </div>
      </Modal>

      {/* Max date toast */}
      {toast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-gray-900/80 text-white px-6 py-3 rounded-full text-sm font-medium animate-[fadeAway_2.2s_ease-out_forwards]">
            脚踏实地！最多只能制定未来7天的计划
          </div>
        </div>
      )}
    </PageContainer>
  );
}
