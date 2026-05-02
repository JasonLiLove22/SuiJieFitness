import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { register } from '../api/auth';
import Button from '../components/shared/Button';
import Input from '../components/shared/Input';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '', name: '', height: '', weight: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const height = parseInt(form.height);
    const weight = parseFloat(form.weight);

    if (form.password !== form.confirmPassword) {
      setError('两次密码不一致');
      return;
    }
    if (form.password.length < 6) {
      setError('密码至少6位');
      return;
    }
    if (height < 100 || height > 250) {
      setError('身高范围: 100-250 cm');
      return;
    }
    if (weight < 30 || weight > 300) {
      setError('体重范围: 30-300 kg');
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        username: form.username,
        password: form.password,
        name: form.name,
        height,
        weight,
      });
      auth.login(res.token, res.user);
      navigate('/');
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-8 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">随杰健身</h1>
          <p className="text-gray-400">创建你的健身账号</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="用户名" placeholder="用于登录" value={form.username} onChange={set('username')} autoComplete="username" />
          <Input label="昵称" placeholder="你的称呼" value={form.name} onChange={set('name')} autoComplete="name" />
          <div className="flex gap-3">
            <Input label="身高 (cm)" type="number" placeholder="170" value={form.height} onChange={set('height')} />
            <Input label="体重 (kg)" type="number" step="0.1" placeholder="65" value={form.weight} onChange={set('weight')} />
          </div>
          <Input label="密码" type="password" placeholder="至少6位" value={form.password} onChange={set('password')} autoComplete="new-password" />
          <Input label="确认密码" type="password" placeholder="再次输入密码" value={form.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password" />

          {error && (
            <div className="bg-red-50 text-red-500 text-sm rounded-xl px-4 py-3 text-center">
              {error}
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? '注册中...' : '注册并开始使用'}
          </Button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          已有账号？
          <Link to="/login" className="text-primary font-medium ml-1">去登录</Link>
        </p>
      </div>
    </div>
  );
}
