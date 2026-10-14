export type PropertyType = 'apartamento' | 'casa' | 'comercial' | 'terreno' | 'outro';

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'outro', label: 'Outro' },
];

export interface Property {
  id: string;
  name: string;
  address: string;
  type: PropertyType;
  rent: number;
  bedrooms?: number;
  area?: number;
  notes?: string;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  document?: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
}

export interface Contract {
  id: string;
  propertyId: string;
  tenantId: string;
  rent: number;
  /** Dia do mês em que o aluguel vence (1-31; em meses mais curtos, vence no último dia). */
  dueDay: number;
  /** Datas ISO (AAAA-MM-DD). */
  startDate: string;
  endDate?: string;
  deposit?: number;
  active: boolean;
  notes?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  contractId: string;
  /** Mês de referência no formato AAAA-MM. */
  month: string;
  amount: number;
  dueDate: string;
  paidAt?: string;
}

export type ExpenseCategory = 'iptu' | 'condominio' | 'manutencao' | 'seguro' | 'outro';

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'iptu', label: 'IPTU' },
  { value: 'condominio', label: 'Condomínio' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'seguro', label: 'Seguro' },
  { value: 'outro', label: 'Outro' },
];

export interface Expense {
  id: string;
  propertyId: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
}

export interface AppData {
  properties: Property[];
  tenants: Tenant[];
  contracts: Contract[];
  payments: Payment[];
  expenses: Expense[];
}

export const EMPTY_DATA: AppData = {
  properties: [],
  tenants: [],
  contracts: [],
  payments: [],
  expenses: [],
};

export type PaymentStatus = 'pago' | 'pendente' | 'atrasado';
