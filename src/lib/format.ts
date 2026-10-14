const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/** Formata um número como moeda brasileira, ex.: 1234.5 -> "R$ 1.234,50". */
export function formatCurrency(value: number): string {
  const negative = value < 0;
  const [int, dec] = Math.abs(value).toFixed(2).split('.');
  const withDots = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negative ? '-' : ''}R$ ${withDots},${dec}`;
}

/** Converte texto digitado pelo usuário ("1.234,50" ou "1234.5") em número. */
export function parseCurrency(text: string): number {
  const clean = text.replace(/[^\d,.-]/g, '');
  if (!clean) return NaN;
  // "1.234,50" e "1.500" usam ponto como separador de milhar.
  const thousandsOnly = /^\d{1,3}(\.\d{3})+$/.test(clean);
  const normalized = clean.includes(',') || thousandsOnly
    ? clean.replace(/\./g, '').replace(',', '.')
    : clean;
  return Number(normalized);
}

/** Valor numérico para preencher um campo de texto, ex.: 1500 -> "1500,00". */
export function currencyInput(value: number | undefined): string {
  return value === undefined || Number.isNaN(value) ? '' : value.toFixed(2).replace('.', ',');
}

/** "2026-10-05" -> "05/10/2026" */
export function formatDate(iso?: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** "05/10/2026" -> "2026-10-05" (ou undefined se inválida). */
export function parseDate(text: string): string | undefined {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text.trim());
  if (!match) return undefined;
  const [, d, m, y] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  if (
    date.getFullYear() !== Number(y) ||
    date.getMonth() !== Number(m) - 1 ||
    date.getDate() !== Number(d)
  ) {
    return undefined;
  }
  return `${y}-${m}-${d}`;
}

/** Aplica a máscara DD/MM/AAAA enquanto o usuário digita. */
export function maskDate(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Aplica máscara de telefone brasileiro: (11) 91234-5678. */
export function maskPhone(text: string): string {
  const d = text.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Aplica máscara de CPF (11 dígitos) ou CNPJ (14 dígitos). */
export function maskDocument(text: string): string {
  const d = text.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

/** "2026-10" -> "Outubro/2026" */
export function formatMonth(month: string): string {
  const [y, m] = month.split('-');
  return `${MONTHS[Number(m) - 1]}/${y}`;
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function today(): string {
  return toISODate(new Date());
}

export function currentMonth(): string {
  return today().slice(0, 7);
}

/** Soma `delta` meses a um mês AAAA-MM. */
export function addMonths(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const date = new Date(y, m - 1 + delta, 1);
  return toISODate(date).slice(0, 7);
}
