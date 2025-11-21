export function formatCNPJ(value: string) {
  const d = (value || '').replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return d.replace(/^(\d{2})(\d+)/, '$1.$2');
  if (d.length <= 8) return d.replace(/^(\d{2})(\d{3})(\d+)/, '$1.$2.$3');
  if (d.length <= 12) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d+)/, '$1.$2.$3/$4');
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, '$1.$2.$3/$4-$5');
}

export function formatTelefone(value: string) {
  const d = (value || '').replace(/\D/g, '').slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return '(' + d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function formatDate(value: string | number | Date) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function roleColor(value: string) {
  switch (value) {
    case 'ADMIN':
      return 'pink';
    case 'MANAGER':
      return 'blue';
    case 'ASSISTANT':
      return 'green';
    default:
      return 'grey';
  }
}

export function sectionColor(value: string) {
  switch (value) {
    case 'Almoxarifado':
      return 'blue';
    case 'Farmácia':
      return 'green';
    default:
      return 'grey';
  }
}

export function roleName(value: string) {
  switch (value) {
    case 'ADMIN':
      return 'ADMIN';
    case 'MANAGER':
      return 'Gerente';
    case 'ASSISTANT':
      return 'Assistente';
    default:
      return null;
  }
}

export function getInitials(name: string) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]?.[0]?.toUpperCase() || '';
  const first = parts[0]?.[0] || '';
  const last = parts[parts.length - 1]?.[0] || '';
  return (first + last).toUpperCase();
}

export function formatCurrency(value: number | string) {
  if (value === null || value === undefined || value === '') return 'R$ 0,00';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'R$ 0,00';
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function parseCurrency(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[R$\s.]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export default {
  formatCNPJ,
  formatTelefone,
  formatDate,
  roleColor,
  roleName,
  getInitials,
  formatCurrency,
  parseCurrency,
};
