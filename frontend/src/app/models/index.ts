export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'BIBL' | 'DOC' | 'EST';
  status: 'Activo' | 'Inactivo';
  password?: string;
  phone?: string;
  address?: string;
}

export interface Book {
  isbn: string;
  title: string;
  author: string;
  description: string;
  copies: number;
  availableCopies: number;
  stockMinimo: number;
  coverUrl: string;
  status: 'Disponible' | 'No disponible';
  customCopyStatuses?: Record<number, 'Disponible' | 'Perdido' | 'Dañado'>;
  ejemplares?: { id: number; numero: number; codigo: string; estado: string }[];
}

export interface BookCopy {
  id: string;
  ejemplarId: number;
  number: number;
  codigo: string;
  status: 'Disponible' | 'Prestado' | 'En reserva' | 'Perdido' | 'Dañado';
  loanDetails?: {
    loanId: string;
    userId: string;
    userName: string;
    dueDate: string;
  };
  reservationDetails?: {
    reservationId: string;
    userId: string;
    userName: string;
  };
}

export interface Loan {
  id: string;
  userId: string;
  userName: string;
  bookIsbn: string;
  bookTitle: string;
  loanDate: string;
  dueDate: string;
  returnDate: string | null;
  status: 'Activo' | 'Pendiente devolución' | 'Devuelto' | 'Vencido' | 'Rechazado' | 'Cancelado';
  observaciones?: string | null;
  evaluadoPor?: string | null;
}

export interface Reservation {
  id: string;
  userId: string;
  userName: string;
  bookIsbn: string;
  bookTitle: string;
  reservationDate: string;
  queuePosition: number;
  status: 'En cola' | 'Listo para retirar' | 'Retirada' | 'Cancelada' | 'Expirada';
}

export interface Sanction {
  id: string;
  userId: string;
  userName: string;
  type: 'Disciplinaria' | 'Económica' | 'Daño' | 'Pérdida';
  fine: number;
  reason: string;
  date: string;
  status: 'Activa' | 'Pagada';
}
