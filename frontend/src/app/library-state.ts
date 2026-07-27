import { Injectable, signal } from '@angular/core';
import { supabase } from './supabase';
import { User, Book, BookCopy, Loan, Reservation, Sanction, AuditLog } from './models';

export type { User, Book, BookCopy, Loan, Reservation, Sanction, AuditLog };

// --- Mapping helpers for Supabase real tables ---

const ROLE_MAP: Record<string, User['role']> = {
  'ADMINISTRADOR': 'ADMIN',
  'BIBLIOTECARIO': 'BIBL',
  'DOCENTE': 'DOC',
  'ESTUDIANTE': 'EST',
};
const ROLE_MAP_REVERSE: Record<string, string> = {
  'ADMIN': 'ADMINISTRADOR',
  'BIBL': 'BIBLIOTECARIO',
  'DOC': 'DOCENTE',
  'EST': 'ESTUDIANTE',
};

const LOAN_STATUS_MAP: Record<string, Loan['status']> = {
  'ACTIVO': 'Activo',
  'PENDIENTE_DEVOLUCION': 'Pendiente devolución',
  'DEVUELTO': 'Devuelto',
  'VENCIDO': 'Vencido',
  'RECHAZADO': 'Rechazado',
  'CANCELADO': 'Cancelado',
};
const LOAN_STATUS_MAP_REVERSE: Record<string, string> = {
  'Activo': 'ACTIVO',
  'Pendiente devolución': 'PENDIENTE_DEVOLUCION',
  'Devuelto': 'DEVUELTO',
  'Vencido': 'VENCIDO',
  'Rechazado': 'RECHAZADO',
  'Cancelado': 'CANCELADO',
};

const RES_STATUS_MAP: Record<string, Reservation['status']> = {
  'PENDIENTE': 'En cola',
  'ACTIVA': 'Listo para retirar',
  'ATENDIDA': 'Retirada',
  'CANCELADA': 'Cancelada',
  'EXPIRADA': 'Expirada',
};
const RES_STATUS_MAP_REVERSE: Record<string, string> = {
  'En cola': 'PENDIENTE',
  'Listo para retirar': 'ACTIVA',
  'Retirada': 'ATENDIDA',
  'Cancelada': 'CANCELADA',
  'Expirada': 'EXPIRADA',
};

const SANC_TYPE_MAP: Record<string, Sanction['type']> = {
  'DISCIPLINARIA': 'Disciplinaria',
  'ECONOMICA': 'Económica',
};
const SANC_TYPE_MAP_REVERSE: Record<string, string> = {
  'Disciplinaria': 'DISCIPLINARIA',
  'Económica': 'ECONOMICA',
  'Daño': 'ECONOMICA',
  'Pérdida': 'ECONOMICA',
};

const SANC_STATUS_MAP: Record<string, Sanction['status']> = {
  'ACTIVA': 'Activa',
  'CUMPLIDA': 'Pagada',
  'PAGADA': 'Pagada',
};
const SANC_STATUS_MAP_REVERSE: Record<string, string> = {
  'Activa': 'ACTIVA',
  'Pagada': 'PAGADA',
};

const EJEMPLAR_STATUS_MAP: Record<string, BookCopy['status']> = {
  'DISPONIBLE': 'Disponible',
  'PRESTADO': 'Prestado',
  'RESERVADO': 'En reserva',
  'DAÑADO': 'Dañado',
  'PERDIDO': 'Perdido',
};

function dateOnly(iso: string | null): string {
  if (!iso) return '';
  return iso.substring(0, 10);
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayISO(): string {
  return new Date().toISOString();
}

function timeOnly(iso: string | null): string {
  if (!iso) return '';
  const t = iso.indexOf('T');
  if (t === -1) return '';
  return iso.substring(t + 1, t + 9);
}

@Injectable({
  providedIn: 'root',
})
export class LibraryState {
  users = signal<User[]>([]);
  books = signal<Book[]>([]);
  loans = signal<Loan[]>([]);
  reservations = signal<Reservation[]>([]);
  sanctions = signal<Sanction[]>([]);
  auditLogs = signal<AuditLog[]>([]);

  supabaseConnected = signal<boolean>(false);
  supabaseConnecting = signal<boolean>(false);
  supabaseError = signal<string | null>(null);

  currentUser = signal<User | null>(null);
  activeView = signal<string>('login');

  notifications = signal<{ id: string; title: string; desc: string; date: string; read: boolean }[]>([]);
  pendingReturns = signal<Loan[]>([]);
  pendingSearch = signal<string>('');
  private realtimeChannel: any = null;

  constructor() {
    this.loadInitialData();
    this.initSupabase();
  }

  private loadInitialData() {
    this.users.set([]);
    this.books.set([]);
    this.loans.set([]);
    this.reservations.set([]);
    this.sanctions.set([]);
    this.auditLogs.set([]);
    this.currentUser.set(null);
    this.activeView.set('login');
    this.notifications.set([]);
  }

  async initSupabase() {
    if (typeof window === 'undefined') return;
    this.supabaseConnecting.set(true);
    this.supabaseError.set(null);
    try {
      const [
        usuariosRes,
        librosRes,
        ejemplaresRes,
        prestamosRes,
        reservasRes,
        sancionesRes,
        auditRes,
      ] = await Promise.all([
        supabase.from('usuarios').select('id, nombre_completo, correo_electronico, contrasena, rol, activo'),
        supabase.from('libros').select('id, titulo, autor, editorial, anio_publicacion, isbn, estado_general'),
        supabase.from('ejemplares').select('id, libro_id, codigo_ejemplar, estado'),
        supabase.from('prestamos').select('id, usuario_id, ejemplar_id, fecha_prestamo, fecha_limite_devolucion, fecha_real_devolucion, estado'),
        supabase.from('reservas').select('id, usuario_id, libro_id, fecha_reserva, posicion_cola, estado'),
        supabase.from('sanciones').select('id, usuario_id, tipo, motivo, valor_economico, estado, fecha_creacion'),
        supabase.from('bitacora_auditoria').select('id, usuario_id, operacion, tabla_afectada, direccion_ip, fecha_operacion, detalles'),
      ]);

      if (usuariosRes.error) throw usuariosRes.error;
      if (librosRes.error) throw librosRes.error;
      if (ejemplaresRes.error) throw ejemplaresRes.error;
      if (prestamosRes.error) throw prestamosRes.error;
      if (reservasRes.error) throw reservasRes.error;
      if (sancionesRes.error) throw sancionesRes.error;
      if (auditRes.error) throw auditRes.error;

      const dbUsuarios = usuariosRes.data;
      const dbLibros = librosRes.data;
      const dbEjemplares = ejemplaresRes.data;
      const dbPrestamos = prestamosRes.data;
      const dbReservas = reservasRes.data;
      const dbSanciones = sancionesRes.data;
      const dbAudit = auditRes.data;

      const mappedUsers: User[] = (dbUsuarios || []).map((u: any) => ({
        id: String(u.id),
        name: u.nombre_completo,
        email: u.correo_electronico || '',
        role: ROLE_MAP[u.rol] || 'EST',
        status: u.activo ? 'Activo' as const : 'Inactivo' as const,
        password: u.contrasena || undefined,
      }));
      this.users.set(mappedUsers);

      const ejByLibro = new Map<number, any[]>();
      for (const ej of (dbEjemplares || [])) {
        const list = ejByLibro.get(ej.libro_id) || [];
        list.push(ej);
        ejByLibro.set(ej.libro_id, list);
      }

      const mappedBooks: Book[] = (dbLibros || []).map((libro: any) => {
        const ejemplares = ejByLibro.get(libro.id) || [];
        const totalCopies = ejemplares.length;
        const availableCopies = ejemplares.filter((e: any) => e.estado === 'DISPONIBLE').length;
        const customStatuses: Record<number, 'Disponible' | 'Perdido' | 'Dañado'> = {};
        ejemplares.forEach((ej: any, idx: number) => {
          if (ej.estado === 'PERDIDO') customStatuses[idx + 1] = 'Perdido';
          else if (ej.estado === 'DAÑADO') customStatuses[idx + 1] = 'Dañado';
        });
        return {
          isbn: libro.isbn,
          title: libro.titulo,
          author: libro.autor,
          description: `${libro.editorial || ''}, ${libro.anio_publicacion || ''}`.trim(),
          copies: totalCopies,
          availableCopies,
          coverUrl: `https://picsum.photos/seed/${encodeURIComponent(libro.isbn)}/200/300`,
          status: availableCopies > 0 ? 'Disponible' as const : 'No disponible' as const,
          customCopyStatuses: Object.keys(customStatuses).length > 0 ? customStatuses : undefined,
        };
      });
      this.books.set(mappedBooks);

      const ejIdToLibro = new Map<number, { isbn: string; titulo: string }>();
      for (const ej of (dbEjemplares || [])) {
        const libro = (dbLibros || []).find((l: any) => l.id === ej.libro_id);
        if (libro) ejIdToLibro.set(ej.id, { isbn: libro.isbn, titulo: libro.titulo });
      }

      const mappedLoans: Loan[] = (dbPrestamos || []).map((p: any) => {
        const identificacion = this.findIdentificacion(p.usuario_id);
        const userName = mappedUsers.find((u) => u.id === identificacion)?.name || 'Desconocido';
        const libroInfo = ejIdToLibro.get(p.ejemplar_id);
        return {
          id: String(p.id),
          userId: identificacion,
          userName,
          bookIsbn: libroInfo?.isbn || '',
          bookTitle: libroInfo?.titulo || '',
          loanDate: dateOnly(p.fecha_prestamo),
          dueDate: dateOnly(p.fecha_limite_devolucion),
          returnDate: p.fecha_real_devolucion ? dateOnly(p.fecha_real_devolucion) : null,
          status: LOAN_STATUS_MAP[p.estado] || 'Activo',
        };
      });
      this.loans.set(mappedLoans);

      const libroIdToIsbn = new Map<number, { isbn: string; titulo: string }>();
      for (const l of (dbLibros || [])) {
        libroIdToIsbn.set(l.id, { isbn: l.isbn, titulo: l.titulo });
      }

      const mappedReservations: Reservation[] = (dbReservas || []).map((r: any) => {
        const identificacion = this.findIdentificacion(r.usuario_id);
        const userName = mappedUsers.find((u) => u.id === identificacion)?.name || 'Desconocido';
        const libroInfo = libroIdToIsbn.get(r.libro_id);
        return {
          id: String(r.id),
          userId: identificacion,
          userName,
          bookIsbn: libroInfo?.isbn || '',
          bookTitle: libroInfo?.titulo || '',
          reservationDate: dateOnly(r.fecha_reserva),
          queuePosition: r.posicion_cola || 1,
          status: RES_STATUS_MAP[r.estado] || 'En cola',
        };
      });
      this.reservations.set(mappedReservations);

      const mappedSanctions: Sanction[] = (dbSanciones || []).map((s: any) => {
        const identificacion = this.findIdentificacion(s.usuario_id);
        const userName = mappedUsers.find((u) => u.id === identificacion)?.name || 'Desconocido';
        return {
          id: String(s.id),
          userId: identificacion,
          userName,
          type: SANC_TYPE_MAP[s.tipo] || 'Disciplinaria',
          fine: s.valor_economico || 0,
          reason: s.motivo || '',
          date: dateOnly(s.fecha_creacion),
          status: SANC_STATUS_MAP[s.estado] || 'Activa',
        };
      });
      this.sanctions.set(mappedSanctions);

      const mappedAudit: AuditLog[] = (dbAudit || []).map((a: any) => {
        const identificacion = this.findIdentificacion(a.usuario_id);
        const userName = mappedUsers.find((u) => u.id === identificacion)?.name || 'Sistema';
        const detail = typeof a.detalles === 'object' ? JSON.stringify(a.detalles) : (a.detalles || '');
        return {
          id: String(a.id),
          date: dateOnly(a.fecha_operacion),
          time: timeOnly(a.fecha_operacion),
          userId: identificacion,
          userName,
          operation: a.operacion || '',
          ip: a.direccion_ip || '',
          detail,
        };
      });
      this.auditLogs.set(mappedAudit);

      this.supabaseConnected.set(true);
      this.supabaseError.set(null);

      await this.cancelarReservasVencidas();
      await this.fetchNotifications();
      await this.fetchPendingReturns();
      this.initRealtime();
    } catch (err: unknown) {
      console.error("Supabase init failed:", err);
      this.supabaseConnected.set(false);
      const msg = err && typeof err === 'object' && 'message' in err ? String(err.message) : String(err);
      this.supabaseError.set(msg);
    } finally {
      this.supabaseConnecting.set(false);
    }
  }

  private findIdentificacion(usuarioId: number): string {
    return String(usuarioId);
  }

  private findUsuarioId(identificacion: string): number | null {
    const num = parseInt(identificacion, 10);
    return isNaN(num) ? null : num;
  }

  async syncLocalToSupabase(): Promise<boolean> {
    this.supabaseConnecting.set(true);
    this.supabaseError.set(null);
    try {
      // Upsert users
      for (const u of this.users()) {
        const usuarioId = this.findUsuarioId(u.id);
        const payload: any = {
          nombre_completo: u.name,
          correo_electronico: u.email,
          rol: ROLE_MAP_REVERSE[u.role] || 'ESTUDIANTE',
          activo: u.status === 'Activo',
        };
        if (usuarioId) payload.id = usuarioId;
        const { error } = await supabase.from('usuarios').upsert(payload, { onConflict: 'id' });
        if (error) console.error('Error syncing user:', error);
      }

      // Upsert books + ejemplares
      for (const b of this.books()) {
        const { error } = await supabase.from('libros').upsert({
          isbn: b.isbn,
          titulo: b.title,
          autor: b.author,
          estado_general: 'ACTIVO',
        }, { onConflict: 'isbn' });
        if (error) console.error('Error syncing book:', error);
      }

      // Upsert loans
      for (const l of this.loans()) {
        const usuarioId = this.findUsuarioId(l.userId);
        if (!usuarioId) continue;
        const { error } = await supabase.from('prestamos').upsert({
          id: parseInt(l.id) || undefined,
          usuario_id: usuarioId,
          fecha_prestamo: l.loanDate,
          fecha_limite_devolucion: l.dueDate,
          fecha_real_devolucion: l.returnDate,
          estado: LOAN_STATUS_MAP_REVERSE[l.status] || 'ACTIVO',
        });
        if (error) console.error('Error syncing loan:', error);
      }

      // Upsert reservations
      for (const r of this.reservations()) {
        const usuarioId = this.findUsuarioId(r.userId);
        if (!usuarioId) continue;
        const libro = this.books().find((b) => b.isbn === r.bookIsbn);
        const { error } = await supabase.from('reservas').upsert({
          id: parseInt(r.id) || undefined,
          usuario_id: usuarioId,
          fecha_reserva: r.reservationDate,
          posicion_cola: r.queuePosition,
          estado: RES_STATUS_MAP_REVERSE[r.status] || 'PENDIENTE',
        });
        if (error) console.error('Error syncing reservation:', error);
      }

      // Upsert sanctions
      for (const s of this.sanctions()) {
        const usuarioId = this.findUsuarioId(s.userId);
        if (!usuarioId) continue;
        const { error } = await supabase.from('sanciones').upsert({
          id: parseInt(s.id) || undefined,
          usuario_id: usuarioId,
          tipo: SANC_TYPE_MAP_REVERSE[s.type] || 'DISCIPLINARIA',
          motivo: s.reason,
          valor_economico: s.fine,
          estado: SANC_STATUS_MAP_REVERSE[s.status] || 'ACTIVA',
        });
        if (error) console.error('Error syncing sanction:', error);
      }

      this.supabaseConnected.set(true);
      this.supabaseError.set(null);
      return true;
    } catch (err: unknown) {
      console.error("Manual sync to Supabase failed:", err);
      const msg = err && typeof err === 'object' && 'message' in err ? String(err.message) : String(err);
      this.supabaseError.set(msg);
      return false;
    } finally {
      this.supabaseConnecting.set(false);
    }
  }

  async syncToSupabase(table: string, data: unknown, idField?: string, idVal?: unknown, operation: 'upsert' | 'delete' = 'upsert') {
    if (!this.supabaseConnected()) return;
    try {
      if (operation === 'delete') {
        // Handle deletes per table
        if (table === 'usuarios' && idField === 'id' && idVal) {
          const usuarioId = this.findUsuarioId(String(idVal));
          if (usuarioId) {
            const { error } = await supabase.from('usuarios').delete().eq('id', usuarioId);
            if (error) console.error('Error deleting usuario:', error);
          }
        } else if (table === 'libros' && idField === 'isbn' && idVal) {
          const { error } = await supabase.from('libros').delete().eq('isbn', idVal);
          if (error) console.error('Error deleting libro:', error);
        } else if (table === 'prestamos' && idField === 'id' && idVal) {
          const { error } = await supabase.from('prestamos').delete().eq('id', parseInt(String(idVal)));
          if (error) console.error('Error deleting prestamo:', error);
        } else if (table === 'reservas' && idField === 'id' && idVal) {
          const { error } = await supabase.from('reservas').delete().eq('id', parseInt(String(idVal)));
          if (error) console.error('Error deleting reserva:', error);
        } else if (table === 'sanciones' && idField === 'id' && idVal) {
          const { error } = await supabase.from('sanciones').delete().eq('id', parseInt(String(idVal)));
          if (error) console.error('Error deleting sancion:', error);
        }
        return;
      }

      // Handle upserts per table
      if (table === 'usuarios' && data) {
        const u = data as User;
        const usuarioId = this.findUsuarioId(u.id);
        const payload: any = {
          nombre_completo: u.name,
          correo_electronico: u.email,
          rol: ROLE_MAP_REVERSE[u.role] || 'ESTUDIANTE',
          activo: u.status === 'Activo',
        };
        if (u.password) payload.contrasena = u.password;
        if (usuarioId) payload.id = usuarioId;
        const { error } = await supabase.from('usuarios').upsert(payload, { onConflict: 'id' });
        if (error) console.error('Error upserting usuario:', error);
      } else if (table === 'libros' && data) {
        const b = data as Book;
        const { error } = await supabase.from('libros').upsert({
          isbn: b.isbn,
          titulo: b.title,
          autor: b.author,
          estado_general: 'ACTIVO',
        }, { onConflict: 'isbn' });
        if (error) console.error('Error upserting libro:', error);
      } else if (table === 'prestamos' && data) {
        const l = data as Loan;
        const usuarioId = this.findUsuarioId(l.userId);
        if (!usuarioId) return;
        const { data: libro } = await supabase.from('libros').select('id').eq('isbn', l.bookIsbn).single();
        if (!libro) { console.error('Book not found for ISBN:', l.bookIsbn); return; }
        const { data: ejemplar } = await supabase.from('ejemplares').select('id').eq('libro_id', libro.id).eq('estado', 'DISPONIBLE').limit(1).single();
        if (!ejemplar) { console.error('No available ejemplar for book:', l.bookIsbn); return; }
        const { error } = await supabase.from('prestamos').upsert({
          id: parseInt(l.id) || undefined,
          usuario_id: usuarioId,
          ejemplar_id: ejemplar.id,
          fecha_prestamo: l.loanDate,
          fecha_limite_devolucion: l.dueDate,
          fecha_real_devolucion: l.returnDate,
          estado: LOAN_STATUS_MAP_REVERSE[l.status] || 'ACTIVO',
        });
        if (error) console.error('Error upserting prestamo:', error);
      } else if (table === 'reservas' && data) {
        const r = data as Reservation;
        const usuarioId = this.findUsuarioId(r.userId);
        if (!usuarioId) return;
        const { data: libroRes } = await supabase.from('libros').select('id').eq('isbn', r.bookIsbn).single();
        if (!libroRes) { console.error('Book not found for reservation ISBN:', r.bookIsbn); return; }
        const { error } = await supabase.from('reservas').upsert({
          id: parseInt(r.id) || undefined,
          usuario_id: usuarioId,
          libro_id: libroRes.id,
          fecha_reserva: r.reservationDate,
          posicion_cola: r.queuePosition,
          estado: RES_STATUS_MAP_REVERSE[r.status] || 'PENDIENTE',
        });
        if (error) console.error('Error upserting reserva:', error);
      } else if (table === 'sanciones' && data) {
        const s = data as Sanction;
        const usuarioId = this.findUsuarioId(s.userId);
        if (!usuarioId) return;
        const { error } = await supabase.from('sanciones').upsert({
          id: parseInt(s.id) || undefined,
          usuario_id: usuarioId,
          tipo: SANC_TYPE_MAP_REVERSE[s.type] || 'DISCIPLINARIA',
          motivo: s.reason,
          valor_economico: s.fine,
          estado: SANC_STATUS_MAP_REVERSE[s.status] || 'ACTIVA',
        });
        if (error) console.error('Error upserting sancion:', error);
      } else if (table === 'bitacora_auditoria' && data) {
        const a = data as AuditLog;
        const usuarioId = this.findUsuarioId(a.userId);
        const { error } = await supabase.from('bitacora_auditoria').upsert({
          id: parseInt(a.id) || undefined,
          usuario_id: usuarioId,
          operacion: a.operation,
          tabla_afectada: 'general',
          direccion_ip: a.ip,
          fecha_operacion: `${a.date}T${a.time}`,
          detalles: { detalle: a.detail },
        });
        if (error) console.error('Error upserting bitacora:', error);
      }
    } catch (err) {
      console.error(`Supabase sync error on ${table}:`, err);
    }
  }

  updateVencidos() {
    const today = new Date(todayStr());

    let updated = false;
    const currentLoans = this.loans().map((loan) => {
      if (loan.status === 'Activo' && new Date(loan.dueDate) < today) {
        updated = true;
        return { ...loan, status: 'Vencido' as const };
      }
      return loan;
    });

    if (updated) {
      this.loans.set(currentLoans);
      this.addSystemAudit('UPDATE_LOAN', 'Detección automática de préstamos vencidos.');
    }
  }

  login(email: string, pass: string): boolean {
    const user = this.users().find((u) => u.email === email);
    if (!user) return false;

    const builtInPass =
      user.role === 'ADMIN'
        ? 'admin123'
        : user.role === 'BIBL'
        ? 'biblio123'
        : user.role === 'DOC'
        ? 'docente123'
        : 'estudiante123';

    const expectedPass = user.password || builtInPass;
    if (pass !== expectedPass) return false;
    if (user.status !== 'Activo') return false;

    this.currentUser.set(user);
    this.activeView.set('home');
    this.addAudit(user.id, user.name, 'LOGIN', 'Inicio de sesión exitoso en la plataforma.');
    this.fetchNotifications();
    return true;
  }

  logout() {
    const user = this.currentUser();
    if (user) {
      this.addAudit(user.id, user.name, 'LOGOUT', 'Cierre de sesión de la plataforma.');
    }
    this.currentUser.set(null);
    this.activeView.set('login');
  }

  addAudit(userId: string, userName: string, operation: string, detail: string) {
    const now = new Date();
    const date = todayStr();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const newLog: AuditLog = {
      id: 'A' + (this.auditLogs().length + 1).toString().padStart(3, '0'),
      date,
      time,
      userId,
      userName,
      operation,
      ip: '192.168.1.' + Math.floor(Math.random() * 254 + 1),
      detail,
    };
    this.auditLogs.update((logs) => [newLog, ...logs]);
    this.syncToSupabase('bitacora_auditoria', newLog);
  }

  addSystemAudit(operation: string, detail: string) {
    this.addAudit('SYSTEM', 'Sistema Autónomo', operation, detail);
  }

  // CRUD USUARIOS
  addUser(u: Omit<User, 'status'>) {
    const newUser: User = {
      ...u,
      status: 'Activo',
    };
    this.users.update((us) => [...us, newUser]);
    this.syncToSupabase('usuarios', newUser);
    const current = this.currentUser();
    if (current) {
      this.addAudit(current.id, current.name, 'INSERT_USER', `Usuario creado: ${newUser.name} (${newUser.role})`);
    }
  }

  updateUser(id: string, updated: Partial<User>) {
    this.users.update((us) =>
      us.map((u) => (u.id === id ? { ...u, ...updated } : u))
    );
    const target = this.users().find((u) => u.id === id);
    if (target) {
      this.syncToSupabase('usuarios', target);
    }
    const current = this.currentUser();
    if (current && target) {
      this.addAudit(current.id, current.name, 'UPDATE_USER', `Usuario actualizado: ${target.name}`);
    }
  }

  deleteUser(id: string) {
    const target = this.users().find((u) => u.id === id);
    this.users.update((us) => us.filter((u) => u.id !== id));
    this.syncToSupabase('usuarios', null, 'id', id, 'delete');
    const current = this.currentUser();
    if (current && target) {
      this.addAudit(current.id, current.name, 'DELETE_USER', `Usuario eliminado: ${target.name}`);
    }
  }

  // CRUD LIBROS
  addBook(b: Omit<Book, 'availableCopies' | 'status'>) {
    const newBook: Book = {
      ...b,
      availableCopies: b.copies,
      status: b.copies > 0 ? 'Disponible' : 'No disponible',
    };
    this.books.update((bs) => [...bs, newBook]);
    this.syncToSupabase('libros', newBook);
    const current = this.currentUser();
    if (current) {
      this.addAudit(current.id, current.name, 'INSERT_BOOK', `Libro registrado: ${newBook.title} por ${newBook.author}`);
    }
  }

  updateBook(isbn: string, updated: Partial<Book>) {
    this.books.update((bs) =>
      bs.map((b) => {
        if (b.isbn === isbn) {
          const merged = { ...b, ...updated };
          if (updated.copies !== undefined) {
            const diff = updated.copies - b.copies;
            merged.availableCopies = Math.max(0, b.availableCopies + diff);
          }
          merged.status = merged.availableCopies > 0 ? 'Disponible' : 'No disponible';
          return merged;
        }
        return b;
      })
    );
    const target = this.books().find((b) => b.isbn === isbn);
    if (target) {
      this.syncToSupabase('libros', target);
    }
    const current = this.currentUser();
    if (current && target) {
      this.addAudit(current.id, current.name, 'UPDATE_BOOK', `Libro actualizado: ${target.title}`);
    }
  }

  updateCopyStatus(isbn: string, copyNumber: number, newStatus: 'Disponible' | 'Perdido' | 'Dañado') {
    const book = this.books().find((b) => b.isbn === isbn);
    if (!book) return 'Libro no encontrado.';

    const oldStatuses = book.customCopyStatuses || {};
    const oldStatus = oldStatuses[copyNumber] || 'Disponible';

    if (oldStatus === newStatus) return null;

    const newStatuses = { ...oldStatuses, [copyNumber]: newStatus };

    let diff = 0;
    if (oldStatus === 'Disponible' && (newStatus === 'Perdido' || newStatus === 'Dañado')) {
      diff = -1;
    } else if ((oldStatus === 'Perdido' || oldStatus === 'Dañado') && newStatus === 'Disponible') {
      diff = 1;
    }

    this.updateBook(isbn, {
      customCopyStatuses: newStatuses,
      availableCopies: Math.max(0, book.availableCopies + diff)
    });

    const current = this.currentUser();
    if (current) {
      this.addAudit(
        current.id,
        current.name,
        'UPDATE_COPY',
        `Ejemplar #${copyNumber} de "${book.title}" cambiado de ${oldStatus} a ${newStatus}`
      );
    }
    return null;
  }

  deleteBook(isbn: string) {
    const target = this.books().find((b) => b.isbn === isbn);
    this.books.update((bs) => bs.filter((b) => b.isbn !== isbn));
    this.syncToSupabase('libros', null, 'isbn', isbn, 'delete');
    const current = this.currentUser();
    if (current && target) {
      this.addAudit(current.id, current.name, 'DELETE_BOOK', `Libro eliminado: ${target.title}`);
    }
  }

  // LOANS MANAGEMENT
  async createLoan(userId: string, bookIsbn: string): Promise<string | null> {
    const user = this.users().find((u) => u.id === userId);
    if (!user) return 'Usuario no encontrado.';

    const hasActiveLoan = this.loans().some(
      (l) => l.userId === userId && (l.status === 'Activo' || l.status === 'Pendiente devolución' || l.status === 'Vencido')
    );
    if (hasActiveLoan) return 'El usuario ya tiene un préstamo activo. El límite es de 1 préstamo activo a la vez.';

    await this.refreshSanctions();
    const hasActiveSanction = this.sanctions().some((s) => s.userId === userId && s.status === 'Activa');
    if (hasActiveSanction) return 'El usuario tiene sanciones activas pendientes. Debe saldarlas antes de solicitar un préstamo.';

    const book = this.books().find((b) => b.isbn === bookIsbn);
    if (!book) return 'Libro no encontrado.';
    if (book.availableCopies <= 0) return 'No hay ejemplares disponibles de este libro en este momento.';

    const loanDate = todayStr();
    const due = new Date(loanDate);
    due.setDate(due.getDate() + 15);
    const dueDate = due.toISOString().split('T')[0];

    const newLoan: Loan = {
      id: 'P' + (this.loans().length + 1).toString().padStart(3, '0'),
      userId,
      userName: user.name,
      bookIsbn,
      bookTitle: book.title,
      loanDate,
      dueDate,
      returnDate: null,
      status: 'Activo',
    };

    this.updateBook(bookIsbn, { availableCopies: book.availableCopies - 1 });

    this.loans.update((ls) => [...ls, newLoan]);
    this.syncToSupabase('prestamos', newLoan);

    const current = this.currentUser();
    if (current) {
      this.addAudit(current.id, current.name, 'CREATE_LOAN', `Préstamo registrado para ${user.name}: "${book.title}"`);
    }

    return null;
  }

  returnLoan(loanId: string): string | null {
    const loanIndex = this.loans().findIndex((l) => l.id === loanId);
    if (loanIndex === -1) return 'Préstamo no encontrado.';

    const loan = this.loans()[loanIndex];
    if (loan.status === 'Devuelto') return 'Este préstamo ya fue devuelto.';
    if (loan.status === 'Pendiente devolución') return 'Este préstamo ya está pendiente de evaluación.';

    const today = todayStr();

    this.loans.update((ls) =>
      ls.map((l) => (l.id === loanId ? { ...l, status: 'Pendiente devolución' as const } : l))
    );
    const updatedLoan = this.loans().find((l) => l.id === loanId);
    if (updatedLoan) {
      this.syncToSupabase('prestamos', updatedLoan);
    }

    const current = this.currentUser();
    const actionBy = current ? current.name : 'Sistema';
    this.addAudit(current?.id || 'SYSTEM', actionBy, 'REQUEST_RETURN', `Devolución solicitada por ${loan.userName}: "${loan.bookTitle}"`);

    this.createNotification(
      parseInt(loan.userId, 10),
      `Tu devolución del préstamo #${loanId} está pendiente de evaluación por el bibliotecario.`,
      'PRESTAMO'
    );

    const allBiblioUsers = this.users().filter(u => u.role === 'BIBL' || u.role === 'ADMIN');
    for (const biblio of allBiblioUsers) {
      this.createNotification(
        parseInt(biblio.id, 10),
        `${loan.userName} solicitó devolver el libro "${loan.bookTitle}". Evaluá el estado del ejemplar.`,
        'PRESTAMO'
      );
    }

    return null;
  }

  async confirmReturn(
    loanId: string,
    ejemplarEstado: 'DISPONIBLE' | 'DAÑADO' | 'PERDIDO',
    observaciones: string | null,
    valorMulta: number,
    tipoSancion: 'DISCIPLINARIA' | 'ECONOMICA' | null
  ): Promise<string | null> {
    const loan = this.loans().find((l) => l.id === loanId);
    if (!loan) return 'Préstamo no encontrado.';
    if (loan.status !== 'Pendiente devolución') return 'Este préstamo no está pendiente de devolución.';

    const current = this.currentUser();
    const prestamoId = parseInt(loanId, 10);
    if (isNaN(prestamoId)) return 'ID de préstamo inválido.';

    try {
      const { data, error } = await supabase.rpc('confirmar_devolucion', {
        p_prestamo_id: prestamoId,
        p_estado_ejemplar: ejemplarEstado,
        p_observaciones: observaciones,
        p_valor_multa: valorMulta,
        p_tipo_sancion: tipoSancion,
        p_bibliotecario_id: current ? parseInt(current.id, 10) : null,
      });

      if (error) throw error;
      if (data && !data.success) return data.error || 'Error al confirmar devolución.';

      this.loans.update((ls) =>
        ls.map((l) => (l.id === loanId ? { ...l, status: 'Devuelto' as const, returnDate: todayStr() } : l))
      );

      if (ejemplarEstado === 'DISPONIBLE') {
        const book = this.books().find((b) => b.isbn === loan.bookIsbn);
        if (book) {
          this.updateBook(loan.bookIsbn, { availableCopies: book.availableCopies + 1 });
        }
      }

      await this.refreshData();

      return null;
    } catch (err: any) {
      return err.message || 'Error al confirmar devolución.';
    }
  }

  processReservationQueue(bookIsbn: string, bookTitle: string) {
    const queue = this.reservations()
      .filter((r) => r.bookIsbn === bookIsbn && r.status === 'En cola')
      .sort((a, b) => a.queuePosition - b.queuePosition);

    if (queue.length > 0) {
      const nextRes = queue[0];
      this.reservations.update((rs) =>
        rs.map((r) => (r.id === nextRes.id ? { ...r, status: 'Listo para retirar' as const } : r))
      );
      const updatedRes = this.reservations().find((r) => r.id === nextRes.id);
      if (updatedRes) {
        this.syncToSupabase('reservas', updatedRes);
      }

      const nextUserId = parseInt(nextRes.userId, 10);
      if (!isNaN(nextUserId)) {
        this.createNotification(
          nextUserId,
          `¡Tu reserva del libro "${bookTitle}" está lista para retirar! Tienes 24 horas para recogerla.`,
          'RESERVA'
        );
      }

      this.addSystemAudit('UPDATE_RESERVATION', `Reserva ${nextRes.id} lista para entrega a ${nextRes.userName}.`);
    }
  }

  // RESERVATION ACTIONS
  async createReservation(userId: string, bookIsbn: string): Promise<string | null> {
    const user = this.users().find((u) => u.id === userId);
    if (!user) return 'Usuario no encontrado.';

    const book = this.books().find((b) => b.isbn === bookIsbn);
    if (!book) return 'Libro no encontrado.';

    const alreadyReserved = this.reservations().some(
      (r) => r.userId === userId && r.bookIsbn === bookIsbn && (r.status === 'En cola' || r.status === 'Listo para retirar')
    );
    if (alreadyReserved) return 'Ya tienes una reserva activa para este mismo libro.';

    await this.refreshSanctions();
    const hasActiveSanction = this.sanctions().some((s) => s.userId === userId && s.status === 'Activa');
    if (hasActiveSanction) return 'No puedes realizar reservas si posees sanciones activas pendientes.';

    const currentQueue = this.reservations().filter(
      (r) => r.bookIsbn === bookIsbn && r.status === 'En cola'
    ).length;

    const isAvailableNow = book.availableCopies > 0;
    const status = isAvailableNow && currentQueue === 0 ? 'Listo para retirar' : 'En cola';

    if (status === 'Listo para retirar') {
      this.updateBook(bookIsbn, { availableCopies: book.availableCopies - 1 });
    }

    const newRes: Reservation = {
      id: 'R' + (this.reservations().length + 1).toString().padStart(3, '0'),
      userId,
      userName: user.name,
      bookIsbn,
      bookTitle: book.title,
      reservationDate: todayStr(),
      queuePosition: currentQueue + 1,
      status,
    };

    this.reservations.update((rs) => [...rs, newRes]);
    this.syncToSupabase('reservas', newRes);

    this.addAudit(userId, user.name, 'CREATE_RESERVATION', `Reserva realizada para "${book.title}" (Estado: ${status})`);

    return null;
  }

  cancelReservation(resId: string): string | null {
    const res = this.reservations().find((r) => r.id === resId);
    if (!res) return 'Reserva no encontrada.';

    this.reservations.update((rs) =>
      rs.map((r) => (r.id === resId ? { ...r, status: 'Cancelada' as const } : r))
    );
    const updatedRes = this.reservations().find((r) => r.id === resId);
    if (updatedRes) {
      this.syncToSupabase('reservas', updatedRes);
    }

    if (res.status === 'Listo para retirar') {
      const book = this.books().find((b) => b.isbn === res.bookIsbn);
      if (book) {
        this.updateBook(res.bookIsbn, { availableCopies: book.availableCopies + 1 });
      }
    }

    this.addAudit(res.userId, res.userName, 'CANCEL_RESERVATION', `Reserva cancelada para "${res.bookTitle}".`);

    this.recalculateQueuePositions(res.bookIsbn);

    return null;
  }

  recalculateQueuePositions(bookIsbn: string) {
    let position = 1;
    this.reservations.update((rs) =>
      rs.map((r) => {
        if (r.bookIsbn === bookIsbn && r.status === 'En cola') {
          const updated = { ...r, queuePosition: position++ };
          this.syncToSupabase('reservas', updated);
          return updated;
        }
        return r;
      })
    );
  }

  // SANCTIONS ACTIONS
  createSanction(userId: string, type: Sanction['type'], fine: number, reason: string): string | null {
    const user = this.users().find((u) => u.id === userId);
    if (!user) return 'Usuario no encontrado.';

    const newSanction: Sanction = {
      id: 'S' + (this.sanctions().length + 1).toString().padStart(3, '0'),
      userId,
      userName: user.name,
      type,
      fine,
      reason,
      date: todayStr(),
      status: 'Activa',
    };

    this.sanctions.update((scs) => [...scs, newSanction]);
    this.syncToSupabase('sanciones', newSanction);

    const current = this.currentUser();
    if (current) {
      this.addAudit(current.id, current.name, 'CREATE_SANCTION', `Sanción manual registrada para ${user.name}: ${type} (${fine > 0 ? '$' + fine : 'Disciplinaria'})`);
    }

    const notifMsg = `Se le ha registrado una sanción ${type}: ${reason}${fine > 0 ? `. Multa: $${fine}` : ''}.`;
    this.createNotification(parseInt(userId, 10), notifMsg, 'SANCION');

    return null;
  }

  paySanction(sanctionId: string): string | null {
    const sanction = this.sanctions().find((s) => s.id === sanctionId);
    if (!sanction) return 'Sanción no encontrada.';

    this.sanctions.update((scs) =>
      scs.map((s) => (s.id === sanctionId ? { ...s, status: 'Pagada' as const } : s))
    );
    const updatedSanc = this.sanctions().find((s) => s.id === sanctionId);
    if (updatedSanc) {
      this.syncToSupabase('sanciones', updatedSanc);
    }

    const current = this.currentUser();
    const actionBy = current ? current.name : 'Sistema';
    this.addAudit(current?.id || 'SYSTEM', actionBy, 'PAY_SANCTION', `Sanción liquidada / levantada para ${sanction.userName}.`);

    this.createNotification(parseInt(sanction.userId, 10), `Su sanción ${sanctionId} (${sanction.type}) ha sido levantada. Ya puede realizar operaciones normales.`, 'SANCION');

    return null;
  }

  // Dashboard calculations
  getDashboardStats() {
    const totalB = this.books().reduce((sum, b) => sum + b.copies, 0);
    const dispB = this.books().reduce((sum, b) => sum + b.availableCopies, 0);
    const activeL = this.loans().filter((l) => l.status === 'Activo' || l.status === 'Pendiente devolución' || l.status === 'Vencido').length;
    const pendingReturns = this.loans().filter((l) => l.status === 'Pendiente devolución').length;
    const totalLoans = this.loans().length;
    const activeR = this.reservations().filter((r) => r.status === 'En cola' || r.status === 'Listo para retirar').length;
    const activeS = this.sanctions().filter((s) => s.status === 'Activa').length;
    const totalFines = this.sanctions()
      .filter((s) => s.status === 'Activa')
      .reduce((sum, s) => sum + s.fine, 0);
    const activeUsers = this.users().filter((u) => u.status === 'Activo').length;

    return {
      totalBooks: totalB,
      availableBooks: dispB,
      activeLoans: activeL,
      pendingReturns,
      totalLoans,
      activeReservations: activeR,
      activeSanctions: activeS,
      totalFines,
      activeUsers,
    };
  }

  markAllNotificationsRead() {
    this.notifications.update((notes) => notes.map((n) => ({ ...n, read: true })));
    const current = this.currentUser();
    if (current) {
      supabase.from('notificaciones').update({ leida: true }).eq('usuario_id', parseInt(current.id, 10)).eq('leida', false);
    }
  }

  async createNotification(usuarioId: number, mensaje: string, tipo: string = 'SISTEMA') {
    const { error } = await supabase.from('notificaciones').insert({
      usuario_id: usuarioId,
      mensaje,
      tipo,
      leida: false,
    });
    if (error) console.error('Error creating notification:', error);
  }

  async fetchNotifications() {
    const current = this.currentUser();
    if (!current) return;
    const { data, error } = await supabase
      .from('notificaciones')
      .select('id, mensaje, tipo, leida, fecha_creacion')
      .eq('usuario_id', parseInt(current.id, 10))
      .order('fecha_creacion', { ascending: false })
      .limit(50);
    if (error) { console.error(error); return; }
    const mapped = (data || []).map((n: any) => ({
      id: String(n.id),
      title: n.tipo || 'Sistema',
      desc: n.mensaje,
      date: n.fecha_creacion ? n.fecha_creacion.substring(0, 10) : '',
      read: n.leida,
    }));
    this.notifications.set(mapped);
  }

  async fetchPendingReturns() {
    const { data, error } = await supabase
      .from('prestamos')
      .select('id, usuario_id, ejemplar_id, fecha_prestamo, fecha_limite_devolucion, fecha_real_devolucion, estado, fecha_checkin, motivo_rechazo')
      .eq('estado', 'PENDIENTE_DEVOLUCION');
    if (error) { console.error(error); return; }

    const usuariosRes = await supabase.from('usuarios').select('id, nombre_completo');
    const ejemplaresRes = await supabase.from('ejemplares').select('id, libro_id, codigo_ejemplar');
    const librosRes = await supabase.from('libros').select('id, isbn, titulo');

    const usuarios = usuariosRes.data || [];
    const ejemplares = ejemplaresRes.data || [];
    const libros = librosRes.data || [];

    const ejMap = new Map(ejemplares.map((e: any) => [e.id, e]));
    const libMap = new Map(libros.map((l: any) => [l.id, l]));
    const usrMap = new Map(usuarios.map((u: any) => [u.id, u]));

    const pending: Loan[] = (data || []).map((p: any) => {
      const ej = ejMap.get(p.ejemplar_id);
      const lib = ej ? libMap.get(ej.libro_id) : null;
      const usr = usrMap.get(p.usuario_id);
      return {
        id: String(p.id),
        userId: String(p.usuario_id),
        userName: usr?.nombre_completo || 'Desconocido',
        bookIsbn: lib?.isbn || '',
        bookTitle: lib?.titulo || '',
        loanDate: p.fecha_prestamo ? p.fecha_prestamo.substring(0, 10) : '',
        dueDate: p.fecha_limite_devolucion ? p.fecha_limite_devolucion.substring(0, 10) : '',
        returnDate: p.fecha_real_devolucion ? p.fecha_real_devolucion.substring(0, 10) : null,
        status: 'Pendiente devolución' as const,
        checkoutDate: p.fecha_checkin,
        rejectionReason: p.motivo_rechazo,
      };
    });
    this.pendingReturns.set(pending);
  }

  async cancelarReservasVencidas() {
    const { error } = await supabase.rpc('cancelar_reservas_vencidas');
    if (error) console.error('Error canceling expired reservations:', error);
  }

  async initRealtime() {
    if (this.realtimeChannel) return;
    this.realtimeChannel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prestamos' }, (payload: any) => {
        this.handleRealtimePrestamo(payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas' }, (payload: any) => {
        this.handleRealtimeReserva(payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notificaciones' }, (payload: any) => {
        this.handleRealtimeNotificacion(payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ejemplares' }, (payload: any) => {
        this.handleRealtimeEjemplar(payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sanciones' }, (payload: any) => {
        this.handleRealtimeSanction(payload);
      })
      .subscribe();
  }

  private async handleRealtimePrestamo(payload: any) {
    const { eventType, new: newRow, old: oldRow } = payload;
    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      await this.refreshLoans();
      await this.fetchPendingReturns();
    } else if (eventType === 'DELETE') {
      await this.refreshLoans();
    }
  }

  private async handleRealtimeReserva(payload: any) {
    await this.refreshReservations();
  }

  private async handleRealtimeNotificacion(payload: any) {
    const { eventType, new: newRow } = payload;
    const current = this.currentUser();
    if (!current) return;
    if (newRow && newRow.usuario_id === parseInt(current.id, 10)) {
      await this.fetchNotifications();
    }
  }

  private async handleRealtimeEjemplar(payload: any) {
    await this.refreshEjemplares();
  }

  private async handleRealtimeSanction(payload: any) {
    await this.refreshSanctions();
  }

  async refreshData() {
    await Promise.all([
      this.refreshLoans(),
      this.refreshReservations(),
      this.refreshEjemplares(),
      this.refreshSanctions(),
      this.fetchNotifications(),
      this.fetchPendingReturns(),
    ]);
  }

  private async refreshLoans() {
    const { data, error } = await supabase
      .from('prestamos')
      .select('id, usuario_id, ejemplar_id, fecha_prestamo, fecha_limite_devolucion, fecha_real_devolucion, estado, fecha_checkin, motivo_rechazo');
    if (error) { console.error(error); return; }

    const usuariosRes = await supabase.from('usuarios').select('id, nombre_completo');
    const ejemplaresRes = await supabase.from('ejemplares').select('id, libro_id');
    const librosRes = await supabase.from('libros').select('id, isbn, titulo');

    const usuarios = usuariosRes.data || [];
    const ejemplares = ejemplaresRes.data || [];
    const libros = librosRes.data || [];

    const ejMap = new Map(ejemplares.map((e: any) => [e.id, e]));
    const libMap = new Map(libros.map((l: any) => [l.id, l]));
    const usrMap = new Map(usuarios.map((u: any) => [u.id, u]));

    const mapped: Loan[] = (data || []).map((p: any) => {
      const ej = ejMap.get(p.ejemplar_id);
      const lib = ej ? libMap.get(ej.libro_id) : null;
      const usr = usrMap.get(p.usuario_id);
      return {
        id: String(p.id),
        userId: String(p.usuario_id),
        userName: usr?.nombre_completo || 'Desconocido',
        bookIsbn: lib?.isbn || '',
        bookTitle: lib?.titulo || '',
        loanDate: p.fecha_prestamo ? p.fecha_prestamo.substring(0, 10) : '',
        dueDate: p.fecha_limite_devolucion ? p.fecha_limite_devolucion.substring(0, 10) : '',
        returnDate: p.fecha_real_devolucion ? p.fecha_real_devolucion.substring(0, 10) : null,
        status: LOAN_STATUS_MAP[p.estado] || 'Activo',
        checkoutDate: p.fecha_checkin,
        rejectionReason: p.motivo_rechazo,
      };
    });
    this.loans.set(mapped);
  }

  private async refreshReservations() {
    const { data, error } = await supabase
      .from('reservas')
      .select('id, usuario_id, libro_id, fecha_reserva, posicion_cola, estado');
    if (error) { console.error(error); return; }

    const usuariosRes = await supabase.from('usuarios').select('id, nombre_completo');
    const librosRes = await supabase.from('libros').select('id, isbn, titulo');

    const usuarios = usuariosRes.data || [];
    const libros = librosRes.data || [];
    const usrMap = new Map(usuarios.map((u: any) => [u.id, u]));
    const libMap = new Map(libros.map((l: any) => [l.id, l]));

    const mapped: Reservation[] = (data || []).map((r: any) => {
      const usr = usrMap.get(r.usuario_id);
      const lib = libMap.get(r.libro_id);
      return {
        id: String(r.id),
        userId: String(r.usuario_id),
        userName: usr?.nombre_completo || 'Desconocido',
        bookIsbn: lib?.isbn || '',
        bookTitle: lib?.titulo || '',
        reservationDate: r.fecha_reserva ? r.fecha_reserva.substring(0, 10) : '',
        queuePosition: r.posicion_cola || 1,
        status: RES_STATUS_MAP[r.estado] || 'En cola',
      };
    });
    this.reservations.set(mapped);
  }

  private async refreshEjemplares() {
    const { data: ejemplaresRes, error: ejErr } = await supabase
      .from('ejemplares')
      .select('id, libro_id, estado');
    if (ejErr) { console.error(ejErr); return; }

    const { data: librosRes } = await supabase.from('libros').select('id, isbn');
    const libros = librosRes || [];
    const libMap = new Map(libros.map((l: any) => [l.id, l]));

    this.books.update(currentBooks =>
      currentBooks.map(book => {
        const bookDb = libros.find((l: any) => l.isbn === book.isbn);
        if (!bookDb) return book;
        const ejemplares = (ejemplaresRes || []).filter((e: any) => e.libro_id === bookDb.id);
        const availableCopies = ejemplares.filter((e: any) => e.estado === 'DISPONIBLE').length;
        return { ...book, copies: ejemplares.length, availableCopies, status: availableCopies > 0 ? 'Disponible' as const : 'No disponible' as const };
      })
    );
  }

  private async refreshSanctions() {
    const { data, error } = await supabase
      .from('sanciones')
      .select('id, usuario_id, tipo, motivo, valor_economico, estado, fecha_creacion');
    if (error) { console.error(error); return; }

    const usuariosRes = await supabase.from('usuarios').select('id, nombre_completo');
    const usuarios = usuariosRes.data || [];
    const usrMap = new Map(usuarios.map((u: any) => [u.id, u]));

    const mapped: Sanction[] = (data || []).map((s: any) => {
      const usr = usrMap.get(s.usuario_id);
      return {
        id: String(s.id),
        userId: String(s.usuario_id),
        userName: usr?.nombre_completo || 'Desconocido',
        type: SANC_TYPE_MAP[s.tipo] || 'Disciplinaria',
        fine: s.valor_economico || 0,
        reason: s.motivo || '',
        date: s.fecha_creacion ? s.fecha_creacion.substring(0, 10) : '',
        status: SANC_STATUS_MAP[s.estado] || 'Activa',
      };
    });
    this.sanctions.set(mapped);
  }
}
