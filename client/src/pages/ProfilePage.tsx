import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Award, Footprints, Bike, Flame } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/shared/Button';
import Input from '../components/shared/Input';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { useAuth } from '../contexts/AuthContext';
import { updateMe } from '../api/auth';
import { getStats } from '../api/stats';
import dayjs from 'dayjs';

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [height, setHeight] = useState(String(user?.height || ''));
  const [weight, setWeight] = useState(String(user?.weight || ''));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  const [stats, setStats] = useState({ trainingDays: 0, runCount: 0, rideCount: 0, totalCal: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setHeight(String(user.height));
      setWeight(String(user.weight));
    }
  }, [user]);

  useEffect(() => {
    async function loadStats() {
      setStatsLoading(true);
      try {
        const s = await getStats();
        setStats(s);
      } catch { /* ignore */ }
      finally { setStatsLoading(false); }
    }
    loadStats();
  }, []);

  const handleSave = async () => {
    setError('');
    setSuccess('');
    const h = parseInt(height);
    const w = parseFloat(weight);
    if (h < 100 || h > 250) { setError('身高范围: 100-250 cm'); return; }
    if (w < 30 || w > 300) { setError('体重范围: 30-300 kg'); return; }
    setSaving(true);
    try {
      const res = await updateMe({ name, height: h, weight: w });
      updateUser(res.user);
      setSuccess('保存成功');
      setEditing(false);
    } catch (err: unknown) { setError((err as Error).message); }
    finally { setSaving(false); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  if (!user) return null;

  return (
    <PageContainer>
      <div className="bg-white rounded-xl p-5 border border-gray-100 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white text-xl font-bold">
            {user.name.charAt(0)}
          </div>
          <div>
            <p className="text-lg font-semibold">{user.name}</p>
            <p className="text-sm text-gray-400">@{user.username}</p>
          </div>
        </div>
        {!editing ? (
          <div className="space-y-2 mb-4">
            <InfoRow label="身高" value={`${user.height} cm`} />
            <InfoRow label="体重" value={`${user.weight} kg`} />
            <InfoRow label="加入时间" value={dayjs(user.created_at).format('YYYY-MM-DD')} />
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            <Input label="昵称" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="flex gap-3">
              <Input label="身高 (cm)" type="number" value={height} onChange={(e) => setHeight(e.target.value)} />
              <Input label="体重 (kg)" type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
            {error && <div className="bg-red-50 text-red-500 text-sm rounded-xl px-4 py-3 text-center">{error}</div>}
            {success && <div className="bg-green-50 text-green-600 text-sm rounded-xl px-4 py-3 text-center">{success}</div>}
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => { setEditing(false); setError(''); setSuccess(''); }}>取消</Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>{saving ? '保存中...' : '保存'}</Button>
            </div>
          </div>
        )}
        {!editing && (
          <Button variant="secondary" size="sm" className="w-full" onClick={() => setEditing(true)}>编辑资料</Button>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-3">运动统计</h3>
        {statsLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={<Award size={20} className="text-primary" />} label="训练天数" value={`${stats.trainingDays} 天`} />
            <ClickableStatCard
              icon={<Footprints size={20} className="text-green-500" />}
              label="跑步记录"
              value={`${stats.runCount} 次`}
              onClick={() => navigate('/run-detail')}
            />
            <ClickableStatCard
              icon={<Bike size={20} className="text-sky-500" />}
              label="骑行历史"
              value={`${stats.rideCount} 次`}
              onClick={() => navigate('/ride-detail')}
            />
            <StatCard icon={<Flame size={20} className="text-orange-400" />} label="总消耗" value={`${stats.totalCal} kcal`} />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <button onClick={() => setLogoutConfirm(true)} className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-100 rounded-xl hover:bg-red-50 transition-colors">
          <span className="text-red-500">退出登录</span>
          <LogOut size={16} className="text-red-400" />
        </button>
      </div>

      <p className="text-center text-gray-300 text-xs mt-8">随杰健身 v1.0</p>

      <ConfirmDialog open={logoutConfirm} onClose={() => setLogoutConfirm(false)} onConfirm={handleLogout} title="退出登录" message="确定要退出登录吗？" confirmText="退出" destructive />
    </PageContainer>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100">
      <div className="mb-2">{icon}</div>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

function ClickableStatCard({ icon, label, value, onClick }: { icon: React.ReactNode; label: string; value: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="bg-white rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-colors text-left">
      <div className="mb-2">{icon}</div>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </button>
  );
}
