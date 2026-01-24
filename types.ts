
export interface Operatore {
  id: string;
  nome: string;
  email: string;
  password?: string;
  role: 'admin' | 'agent';
}

export interface Agente {
  id: string;
  nome: string;
  email: string;
  operatoreEmail: string;
}

export interface Vendita {
  id: string;
  data: string;
  cliente: string;
  importo: number;
  metodoPagamento: string;
  sconto: string;
  agente: string;
  operatoreEmail: string;
  incassato: boolean;
  noteAmministrazione: string;
}

export const ADMIN_EMAIL = 'admin@example.com';
