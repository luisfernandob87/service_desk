export function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatDateShort(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function timeRemaining(deadline) {
  if (!deadline) return null;
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  if (diff <= 0) return { hours: 0, minutes: 0, expired: true };
  const totalMinutes = Math.floor(diff / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { hours, minutes, expired: false };
}

export function slaProgress(start, deadline) {
  if (!start || !deadline) return null;
  const s = new Date(start);
  const d = new Date(deadline);
  const now = new Date();
  if (isNaN(s.getTime()) || isNaN(d.getTime())) return null;
  const total = d.getTime() - s.getTime();
  const elapsed = now.getTime() - s.getTime();
  if (total <= 0) return 0;
  const pct = Math.min(100, Math.round((elapsed / total) * 100));
  return Math.max(0, pct);
}
