
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
  telefono?: string;
  zona?: string;
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
  verificarePagamento?: boolean;
  pagamentoVerificato?: boolean;
  noteAmministrazione: string;
  notizie?: string;
  nuove_notizie?: boolean;
  ultimo_mittente?: string; 
  created_at?: string;
}

export interface EmailConfig {
  operatore_email: string;
  provider: 'local' | 'smtp';
  from_name?: string;
  smtp_server?: string;
  smtp_port?: string;
  smtp_user?: string;
  smtp_pass?: string;
}

export const ADMIN_EMAIL = 'admin@example.com';
