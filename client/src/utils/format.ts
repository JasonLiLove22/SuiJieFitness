import dayjs from 'dayjs';

export function todayStr(): string {
  return dayjs().format('YYYY-MM-DD');
}

export function formatDate(date: string): string {
  const d = dayjs(date);
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${d.month() + 1}月${d.date()}日 ${weekDays[d.day()]}`;
}

export function formatMonth(year: number, month: number): string {
  return `${year}年${month}月`;
}

export function formatMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h > 0) {
    return `${h}小时${m}分钟`;
  }
  return `${m}分钟`;
}

export function formatTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:00`;
  }
  return `${m}:00`;
}

export function parseTimeInput(str: string): number {
  const parts = str.split(':');
  if (parts.length === 2) {
    return parseInt(parts[0]) + parseInt(parts[1]) / 60;
  }
  return 0;
}
