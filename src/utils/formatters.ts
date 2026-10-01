export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrencyFull(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDateBR(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return new Date(dateStr).toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

export function formatDateTimeBR(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return dateStr;
  }
}

export function getRelativeDateLabel(dateStr: string): { label: string; isOverdue: boolean; isToday: boolean } {
  if (!dateStr) return { label: '', isOverdue: false, isToday: false };

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const targetParts = dateStr.split('T')[0].split('-');
  const targetYear = parseInt(targetParts[0], 10);
  const targetMonth = parseInt(targetParts[1], 10) - 1;
  const targetDay = parseInt(targetParts[2], 10);

  const targetDate = new Date(targetYear, targetMonth, targetDay);
  const curDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const diffTime = targetDate.getTime() - curDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { label: 'Hoje', isOverdue: false, isToday: true };
  } else if (diffDays === 1) {
    return { label: 'Amanhã', isOverdue: false, isToday: false };
  } else if (diffDays === -1) {
    return { label: 'Ontem (Atrasada)', isOverdue: true, isToday: false };
  } else if (diffDays < -1) {
    return { label: `${Math.abs(diffDays)} dias atrás (Atrasada)`, isOverdue: true, isToday: false };
  } else {
    return { label: `Em ${diffDays} dias (${formatDateBR(dateStr)})`, isOverdue: false, isToday: false };
  }
}

export function getInitials(name: string): string {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function cleanPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('55')) return digits;
  return `55${digits}`;
}
