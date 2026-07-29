import { Injectable, signal } from '@angular/core';
import { supabase } from './supabase';
import { User, Book, BookCopy, Loan, Reservation, Sanction } from './models';

export type { User, Book, BookCopy, Loan, Reservation, Sanction };

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

export function normalizeText(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
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
  supabaseConnected = signal<boolean>(false);
  supabaseConnecting = signal<boolean>(false);
  supabaseError = signal<string | null>(null);

  currentUser = signal<User | null>(null);
  activeView = signal<string>('login');

  notifications = signal<{ id: string; title: string; desc: string; date: string; read: boolean; view: string; viewLabel: string }[]>([]);
  pendingReturns = signal<Loan[]>([]);
  pendingSearch = signal<string>('');
  private realtimeChannel: any = null;
  private lastNotifiedStock = new Map<string, number>();
  private expirationInterval: ReturnType<typeof setInterval> | null = null;

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
      ] = await Promise.all([
        supabase.from('usuarios').select('id, nombre_completo, correo_electronico, contrasena, rol, activo, telefono, direccion, identificacion'),
        supabase.from('libros').select('id, titulo, autor, editorial, anio_publicacion, isbn, estado_general, stock_minimo, portada_url'),
        supabase.from('ejemplares').select('id, libro_id, codigo_ejemplar, estado'),
        supabase.from('prestamos').select('id, usuario_id, ejemplar_id, fecha_prestamo, fecha_limite_devolucion, fecha_real_devolucion, estado, observaciones, evaluado_por'),
        supabase.from('reservas').select('id, usuario_id, libro_id, fecha_reserva, posicion_cola, estado'),
        supabase.from('sanciones').select('id, usuario_id, tipo, motivo, valor_economico, estado, fecha_creacion'),
      ]);

      if (usuariosRes.error) throw usuariosRes.error;
      if (librosRes.error) throw librosRes.error;
      if (ejemplaresRes.error) throw ejemplaresRes.error;
      if (prestamosRes.error) throw prestamosRes.error;
      if (reservasRes.error) throw reservasRes.error;
      if (sancionesRes.error) throw sancionesRes.error;

      const dbUsuarios = usuariosRes.data;
      const dbLibros = librosRes.data;
      const dbEjemplares = ejemplaresRes.data;
      const dbPrestamos = prestamosRes.data;
      const dbReservas = reservasRes.data;
      const dbSanciones = sancionesRes.data;

      const mappedUsers: User[] = (dbUsuarios || []).map((u: any) => ({
        id: String(u.id),
        name: u.nombre_completo,
        email: u.correo_electronico || '',
        role: ROLE_MAP[u.rol] || 'EST',
        status: u.activo ? 'Activo' as const : 'Inactivo' as const,
        password: u.contrasena || undefined,
        phone: u.telefono || undefined,
        address: u.direccion || undefined,
        identificacion: u.identificacion || undefined,
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
        const ejemplaresData: { id: number; numero: number; codigo: string; estado: string }[] = [];
        ejemplares.forEach((ej: any) => {
          const parts = ej.codigo_ejemplar.split('-');
          const numero = parseInt(parts[parts.length - 1], 10) || 0;
          ejemplaresData.push({ id: ej.id, numero, codigo: ej.codigo_ejemplar, estado: ej.estado });
          if (ej.estado === 'PERDIDO') customStatuses[numero] = 'Perdido';
          else if (ej.estado === 'DAÑADO') customStatuses[numero] = 'Dañado';
        });
        return {
          isbn: libro.isbn,
          title: libro.titulo,
          author: libro.autor,
          editorial: libro.editorial || '',
          anioPublicacion: libro.anio_publicacion ?? null,
          copies: totalCopies,
          availableCopies,
          stockMinimo: libro.stock_minimo ?? 0,
          coverUrl: libro.portada_url || `https://picsum.photos/seed/${encodeURIComponent(libro.isbn)}/200/300`,
          status: availableCopies > 0 ? 'Disponible' as const : 'No disponible' as const,
          customCopyStatuses: Object.keys(customStatuses).length > 0 ? customStatuses : undefined,
          ejemplares: ejemplaresData,
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
          ejemplarId: p.ejemplar_id,
          userId: identificacion,
          userName,
          bookIsbn: libroInfo?.isbn || '',
          bookTitle: libroInfo?.titulo || '',
          loanDate: dateOnly(p.fecha_prestamo),
          dueDate: dateOnly(p.fecha_limite_devolucion),
          returnDate: p.fecha_real_devolucion ? dateOnly(p.fecha_real_devolucion) : null,
          status: LOAN_STATUS_MAP[p.estado] || 'Activo',
          observaciones: p.observaciones,
          evaluadoPor: p.evaluado_por ? String(p.evaluado_por) : null,
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

      this.supabaseConnected.set(true);
      this.supabaseError.set(null);

      this.updateVencidos();
      await this.cancelarReservasVencidas();
      await this.fetchNotifications();
      await this.fetchPendingReturns();
      this.initRealtime();
      this.startExpirationChecker();
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
          telefono: u.phone || null,
          direccion: u.address || null,
          identificacion: u.identificacion || null,
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
          telefono: u.phone || null,
          direccion: u.address || null,
          identificacion: u.identificacion || null,
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
          editorial: b.editorial || null,
          anio_publicacion: b.anioPublicacion ?? null,
          estado_general: 'ACTIVO',
          stock_minimo: b.stockMinimo ?? 0,
          portada_url: b.coverUrl || null,
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
      }
    } catch (err) {
      console.error(`Supabase sync error on ${table}:`, err);
    }
  }

  async updateVencidos() {
    const today = new Date(todayStr());
    const loans = this.loans();

    for (const loan of loans) {
      if (loan.status !== 'Activo') continue;
      const dueDate = new Date(loan.dueDate);
      if (dueDate >= today) continue;

      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      const { error } = await supabase
        .from('prestamos')
        .update({ estado: 'VENCIDO' })
        .eq('id', loan.id);
      if (error) { console.error('Error updating loan to VENCIDO:', error); continue; }

      if (daysOverdue >= 3) {
        const { data: existing } = await supabase
          .from('sanciones')
          .select('id')
          .eq('usuario_id', parseInt(loan.userId, 10))
          .eq('motivo', `Mora de ${daysOverdue} día(s) en préstamo #${loan.id}`)
          .limit(1);

        if (existing && existing.length > 0) continue;

        const isEconomic = daysOverdue >= 10;
        const fine = isEconomic ? daysOverdue * 500 : 0;
        const tipo = isEconomic ? 'ECONOMICA' : 'DISCIPLINARIA';
        const motivo = `Mora de ${daysOverdue} día(s) en préstamo #${loan.id}`;

        const { error: sanErr } = await supabase
          .from('sanciones')
          .insert({
            usuario_id: parseInt(loan.userId, 10),
            tipo,
            motivo,
            valor_economico: fine,
            estado: 'ACTIVA',
            fecha_creacion: new Date().toISOString(),
          });
        if (sanErr) console.error('Error creating sanction:', sanErr);
      }
    }

    let updated = false;
    const currentLoans = loans.map((loan) => {
      if (loan.status === 'Activo' && new Date(loan.dueDate) < today) {
        updated = true;
        return { ...loan, status: 'Vencido' as const };
      }
      return loan;
    });
    if (updated) this.loans.set(currentLoans);
  }

  private startExpirationChecker() {
    if (this.expirationInterval) clearInterval(this.expirationInterval);
    this.expirationInterval = setInterval(async () => {
      if (!this.supabaseConnected()) return;
      this.updateVencidos();
      await this.cancelarReservasVencidas();
      await this.fetchSanctions();
    }, 5 * 60 * 1000);
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
    this.fetchNotifications();
    return true;
  }

  logout() {
    this.currentUser.set(null);
    this.activeView.set('login');
  }

  // CRUD USUARIOS
  addUser(u: Omit<User, 'status' | 'id'> & { id?: string }) {
    const maxId = this.users().reduce((max, user) => {
      const num = parseInt(user.id, 10);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    const newId = u.id || String(maxId + 1);
    const newUser: User = {
      ...u,
      id: newId,
      status: 'Activo',
    };
    this.users.update((us) => [...us, newUser]);
    this.syncToSupabase('usuarios', newUser);
  }

  updateUser(id: string, updated: Partial<User>) {
    this.users.update((us) =>
      us.map((u) => (u.id === id ? { ...u, ...updated } : u))
    );
    const target = this.users().find((u) => u.id === id);
    if (target) {
      this.syncToSupabase('usuarios', target);
    }
  }

  deleteUser(id: string) {
    const target = this.users().find((u) => u.id === id);
    this.users.update((us) => us.filter((u) => u.id !== id));
    this.syncToSupabase('usuarios', null, 'id', id, 'delete');
  }

  // CRUD LIBROS
  async addBook(b: Omit<Book, 'availableCopies' | 'status'>) {
    const newBook: Book = {
      ...b,
      availableCopies: b.copies,
      stockMinimo: b.stockMinimo ?? 0,
      status: b.copies > 0 ? 'Disponible' : 'No disponible',
    };
    this.books.update((bs) => [...bs, newBook]);
    await this.syncToSupabase('libros', newBook);

    if (b.copies > 0) {
      const { data: libro } = await supabase.from('libros').select('id').eq('isbn', b.isbn).single();
      if (libro) {
        const ejemplaresToInsert = Array.from({ length: b.copies }, (_, i) => ({
          libro_id: libro.id,
          codigo_ejemplar: `${b.isbn}-${String(i + 1).padStart(3, '0')}`,
          estado: 'DISPONIBLE',
        }));
        const { data: inserted } = await supabase.from('ejemplares').insert(ejemplaresToInsert).select('id, codigo_ejemplar, estado');
        if (inserted) {
          const ejemplaresData = inserted.map((e: any, i: number) => ({ id: e.id, numero: i + 1, codigo: e.codigo_ejemplar, estado: e.estado }));
          this.books.update((bs) =>
            bs.map((bk) => bk.isbn === b.isbn ? { ...bk, ejemplares: ejemplaresData } : bk)
          );
        }
      }
    }
  }

  updateBook(isbn: string, updated: Partial<Book>) {
    if (updated.isbn && updated.isbn !== isbn) {
      this.loans.update((ls) =>
        ls.map((l) => l.bookIsbn === isbn ? { ...l, bookIsbn: updated.isbn! } : l)
      );
      this.reservations.update((rs) =>
        rs.map((r) => r.bookIsbn === isbn ? { ...r, bookIsbn: updated.isbn! } : r)
      );
    }

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
    const target = this.books().find((b) => b.isbn === (updated.isbn || isbn));
    if (target) {
      this.syncToSupabase('libros', target);
    }
  }

  async updateCopyStatus(isbn: string, copyNumber: number, newStatus: 'Disponible' | 'Perdido' | 'Dañado') {
    const book = this.books().find((b) => b.isbn === isbn);
    if (!book) return 'Libro no encontrado.';

    const ejemplar = (book.ejemplares || []).find(e => e.numero === copyNumber);
    if (!ejemplar) return 'Ejemplar no encontrado.';

    const DB_STATE_MAP: Record<string, string> = { 'Disponible': 'DISPONIBLE', 'Perdido': 'PERDIDO', 'Dañado': 'DAÑADO' };
    const dbNewStatus = DB_STATE_MAP[newStatus];
    if (ejemplar.estado === dbNewStatus) return null;

    const oldEstado = ejemplar.estado;

    this.books.update((bs) =>
      bs.map((b) => {
        if (b.isbn !== isbn) return b;
        const updatedEjemplares = (b.ejemplares || []).map(e =>
          e.numero === copyNumber ? { ...e, estado: dbNewStatus } : e
        );
        let diff = 0;
        if (oldEstado === 'DISPONIBLE' && (dbNewStatus === 'PERDIDO' || dbNewStatus === 'DAÑADO')) diff = -1;
        else if ((oldEstado === 'PERDIDO' || oldEstado === 'DAÑADO') && dbNewStatus === 'DISPONIBLE') diff = 1;
        const newCustomStatuses = { ...(b.customCopyStatuses || {}) };
        if (dbNewStatus === 'DISPONIBLE') delete newCustomStatuses[copyNumber];
        else newCustomStatuses[copyNumber] = newStatus;
        return {
          ...b,
          ejemplares: updatedEjemplares,
          customCopyStatuses: Object.keys(newCustomStatuses).length > 0 ? newCustomStatuses : undefined,
          availableCopies: Math.max(0, b.availableCopies + diff),
          status: (b.availableCopies + diff) > 0 ? 'Disponible' as const : 'No disponible' as const,
        };
      })
    );

    const ejemplarId = ejemplar.id;
    await supabase.from('ejemplares').update({ estado: dbNewStatus }).eq('id', ejemplarId);

    if (dbNewStatus !== 'DISPONIBLE') {
      await this.checkStockAndNotify(isbn);
    }

    return null;
  }

  deleteBook(isbn: string) {
    const target = this.books().find((b) => b.isbn === isbn);
    this.books.update((bs) => bs.filter((b) => b.isbn !== isbn));
    this.syncToSupabase('libros', null, 'isbn', isbn, 'delete');
  }

  async addEjemplar(isbn: string): Promise<string | null> {
    const book = this.books().find((b) => b.isbn === isbn);
    if (!book) return 'Libro no encontrado.';

    const { data: libro } = await supabase.from('libros').select('id').eq('isbn', isbn).single();
    if (!libro) return 'Libro no encontrado en DB.';

    const existingEjemplares = book.ejemplares || [];
    const nextNumber = existingEjemplares.length > 0
      ? Math.max(...existingEjemplares.map(e => e.numero)) + 1
      : 1;
    const codigo = `${isbn}-${String(nextNumber).padStart(3, '0')}`;

    const { data: newEj, error } = await supabase.from('ejemplares').insert({
      libro_id: libro.id,
      codigo_ejemplar: codigo,
      estado: 'DISPONIBLE',
    }).select('id').single();

    if (error) return 'Error al crear ejemplar en DB.';

    this.books.update((bs) =>
      bs.map((b) => {
        if (b.isbn !== isbn) return b;
        const newEjemplares = [...(b.ejemplares || []), { id: newEj.id, numero: nextNumber, codigo, estado: 'DISPONIBLE' }];
        return { ...b, copies: newEjemplares.length, availableCopies: b.availableCopies + 1, ejemplares: newEjemplares, status: 'Disponible' as const };
      })
    );
    return null;
  }

  async removeEjemplar(isbn: string): Promise<string | null> {
    const book = this.books().find((b) => b.isbn === isbn);
    if (!book) return 'Libro no encontrado.';

    const loaned = this.loans().filter(
      l => l.bookIsbn === isbn && (l.status === 'Activo' || l.status === 'Pendiente devolución')
    ).length;
    if (book.copies <= loaned) return 'No se pueden retirar ejemplares. Hay copias prestadas o reservadas.';

    const ejemplares = book.ejemplares || [];
    const availableEj = ejemplares.find(e => e.estado === 'DISPONIBLE');
    if (!availableEj) return 'No hay ejemplares disponibles para eliminar.';

    const { error } = await supabase.from('ejemplares').delete().eq('id', availableEj.id);
    if (error) return 'Error al eliminar ejemplar de DB.';

    this.books.update((bs) =>
      bs.map((b) => {
        if (b.isbn !== isbn) return b;
        const newEjemplares = ejemplares.filter(e => e.id !== availableEj.id);
        return { ...b, copies: newEjemplares.length, availableCopies: Math.max(0, b.availableCopies - 1), ejemplares: newEjemplares };
      })
    );
    return null;
  }

  // LOANS MANAGEMENT
  async createLoan(userId: string, bookIsbn: string): Promise<string | null> {
    const user = this.users().find((u) => u.id === userId);
    if (!user) return 'Usuario no encontrado.';

    const activeLoans = this.loans().filter(
      (l) => l.userId === userId && (l.status === 'Activo' || l.status === 'Pendiente devolución' || l.status === 'Vencido')
    );
    const activeReservations = this.reservations().filter(
      (r) => r.userId === userId && (r.status === 'En cola' || r.status === 'Listo para retirar')
    );
    if (activeLoans.length + activeReservations.length > 3) {
      return 'Has alcanzado el límite de 3 préstamos y reservas combinados. Devuelve un libro o cancela una reserva primero.';
    }

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

    const firstDisponible = (book.ejemplares || []).find(e => e.estado === 'DISPONIBLE');

    const newLoan: Loan = {
      id: 'P' + (this.loans().length + 1).toString().padStart(3, '0'),
      ejemplarId: firstDisponible?.id ?? 0,
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

    this.books.update((bs) =>
      bs.map((b) => {
        if (b.isbn !== bookIsbn) return b;
        if (firstDisponible) {
          const updatedEjemplares = (b.ejemplares || []).map(e =>
            e.id === firstDisponible.id ? { ...e, estado: 'PRESTADO' as const } : e
          );
          return { ...b, ejemplares: updatedEjemplares };
        }
        return b;
      })
    );

    if (firstDisponible) {
      await supabase.from('ejemplares').update({ estado: 'PRESTADO' }).eq('id', firstDisponible.id);
    }

      this.loans.update((ls) => [...ls, newLoan]);
    this.syncToSupabase('prestamos', newLoan);

    await this.checkStockAndNotify(bookIsbn);

    return null;
  }

  async returnLoan(loanId: string): Promise<string | null> {
    const loanIndex = this.loans().findIndex((l) => l.id === loanId);
    if (loanIndex === -1) return 'Préstamo no encontrado.';

    const loan = this.loans()[loanIndex];
    if (loan.status === 'Devuelto') return 'Este préstamo ya fue devuelto.';
    if (loan.status === 'Pendiente devolución') return 'Este préstamo ya está pendiente de evaluación.';

    this.loans.update((ls) =>
      ls.map((l) => (l.id === loanId ? { ...l, status: 'Pendiente devolución' as const } : l))
    );

    const prestamoId = parseInt(loanId, 10);
    if (!isNaN(prestamoId)) {
      const { error } = await supabase.from('prestamos').update({ estado: 'PENDIENTE_DEVOLUCION' }).eq('id', prestamoId);
      if (error) console.error('Error updating prestamo status:', error);
    }

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

    await this.fetchPendingReturns();

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

      if (ejemplarEstado !== 'DISPONIBLE') {
        await this.checkStockAndNotify(loan.bookIsbn);
      }

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

    const activeLoansCount = this.loans().filter(
      (l) => l.userId === userId && (l.status === 'Activo' || l.status === 'Pendiente devolución' || l.status === 'Vencido')
    ).length;
    const activeReservationsCount = this.reservations().filter(
      (r) => r.userId === userId && (r.status === 'En cola' || r.status === 'Listo para retirar')
    ).length;
    if (activeLoansCount + activeReservationsCount > 3) {
      return 'Has alcanzado el límite de 3 préstamos y reservas combinados. No puedes hacer una nueva reserva.';
    }

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

      const bookEjemplares = (book.ejemplares || []).filter(e => e.estado === 'DISPONIBLE');
      if (bookEjemplares.length > 0) {
        const ejemplarToReserve = bookEjemplares[0];
        await supabase.from('ejemplares').update({ estado: 'RESERVADO' }).eq('id', ejemplarToReserve.id);
        this.books.update((bs) =>
          bs.map((b) => {
            if (b.isbn !== bookIsbn) return b;
            return { ...b, ejemplares: (b.ejemplares || []).map(e => e.id === ejemplarToReserve.id ? { ...e, estado: 'RESERVADO' as const } : e) };
          })
        );
      }
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

    return null;
  }

  async cancelReservation(resId: string): Promise<string | null> {
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

        const reservedEjemplar = (book.ejemplares || []).find(e => e.estado === 'RESERVADO');
        if (reservedEjemplar) {
          await supabase.from('ejemplares').update({ estado: 'DISPONIBLE' }).eq('id', reservedEjemplar.id);
          this.books.update((bs) =>
            bs.map((b) => {
              if (b.isbn !== res.bookIsbn) return b;
              return { ...b, ejemplares: (b.ejemplares || []).map(e => e.id === reservedEjemplar.id ? { ...e, estado: 'DISPONIBLE' as const } : e) };
            })
          );
        }
      }
    }

    this.recalculateQueuePositions(res.bookIsbn);

    return null;
  }

  recalculateQueuePositions(bookIsbn: string) {
    let position = 1;
    this.reservations.update((rs) =>
      rs.map((r) => {
        if (r.bookIsbn === bookIsbn && r.status === 'En cola') {
          const newPosition = position++;
          const wasUpdated = r.queuePosition !== newPosition;
          const updated = { ...r, queuePosition: newPosition };
          this.syncToSupabase('reservas', updated);
          if (wasUpdated && newPosition === 1) {
            const userId = parseInt(r.userId, 10);
            if (!isNaN(userId)) {
              const book = this.books().find((b) => b.isbn === bookIsbn);
              this.createNotification(
                userId,
                `¡Tu reserva del libro "${book?.title || ''}" ahora es la primera en la cola! Se te notificará cuando esté disponible para retirar.`,
                'RESERVA'
              );
            }
          }
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

  async markAllNotificationsRead() {
    this.notifications.update((notes) => notes.map((n) => ({ ...n, read: true })));
    const current = this.currentUser();
    if (current) {
      await supabase.from('notificaciones').update({ leida: true }).eq('usuario_id', parseInt(current.id, 10)).eq('leida', false);
    }
  }

  async markNotificationRead(notifId: string) {
    this.notifications.update((notes) => notes.map((n) => n.id === notifId ? { ...n, read: true } : n));
    await supabase.from('notificaciones').update({ leida: true }).eq('id', parseInt(notifId, 10));
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

  private async checkStockAndNotify(bookIsbn: string) {
    const book = this.books().find((b) => b.isbn === bookIsbn);
    if (!book || book.stockMinimo <= 0) return;

    const available = book.availableCopies;
    if (available > book.stockMinimo) {
      this.lastNotifiedStock.delete(bookIsbn);
      return;
    }

    const lastNotified = this.lastNotifiedStock.get(bookIsbn);
    if (lastNotified === available) return;
    this.lastNotifiedStock.set(bookIsbn, available);

    const allBiblioUsers = this.users().filter((u) => u.role === 'BIBL' || u.role === 'ADMIN');
    const message = available === 0
      ? `El libro "${book.title}" (ISBN: ${bookIsbn}) no tiene ejemplares disponibles. Stock mínimo: ${book.stockMinimo}.`
      : `El libro "${book.title}" (ISBN: ${bookIsbn}) está por debajo del stock mínimo. Disponibles: ${available} / Mínimo: ${book.stockMinimo}.`;

    for (const user of allBiblioUsers) {
      await this.createNotification(parseInt(user.id, 10), message, 'SISTEMA');
    }
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
    const isLow = current.role === 'DOC' || current.role === 'EST';
    const mapped = (data || []).map((n: any) => {
      let view = '';
      let viewLabel = '';
      if (n.tipo === 'PRESTAMO') {
        view = isLow ? 'my-loans' : 'returns';
        viewLabel = isLow ? 'Ir a Mis Préstamos' : 'Ir a Devoluciones';
      } else if (n.tipo === 'RESERVA') {
        view = isLow ? 'my-reservations' : 'reservations';
        viewLabel = 'Ir a Reservas';
      } else if (n.tipo === 'SANCION') {
        view = isLow ? 'my-sanctions' : 'sanctions';
        viewLabel = 'Ir a Sanciones';
      }
      return {
        id: String(n.id),
        title: n.tipo || 'Sistema',
        desc: n.mensaje,
        date: n.fecha_creacion ? n.fecha_creacion.substring(0, 10) : '',
        read: n.leida,
        view,
        viewLabel,
      };
    });
    this.notifications.set(mapped);
  }

  async fetchPendingReturns() {
    const { data, error } = await supabase
      .from('prestamos')
      .select('id, usuario_id, ejemplar_id, fecha_prestamo, fecha_limite_devolucion, fecha_real_devolucion, estado, observaciones, evaluado_por')
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
        ejemplarId: p.ejemplar_id,
        userId: String(p.usuario_id),
        userName: usr?.nombre_completo || 'Desconocido',
        bookIsbn: lib?.isbn || '',
        bookTitle: lib?.titulo || '',
        loanDate: p.fecha_prestamo ? p.fecha_prestamo.substring(0, 10) : '',
        dueDate: p.fecha_limite_devolucion ? p.fecha_limite_devolucion.substring(0, 10) : '',
        returnDate: p.fecha_real_devolucion ? p.fecha_real_devolucion.substring(0, 10) : null,
        status: 'Pendiente devolución' as const,
        observaciones: p.observaciones,
        evaluadoPor: p.evaluado_por ? String(p.evaluado_por) : null,
      };
    });
    this.pendingReturns.set(pending);
  }

  async fetchSanctions() {
    const { data, error } = await supabase.from('sanciones').select('id, usuario_id, tipo, motivo, valor_economico, estado, fecha_creacion');
    if (error) { console.error('Error fetching sanciones:', error); return; }
    const sanctions: Sanction[] = (data || []).map((s: any) => {
      const identificacion = this.findIdentificacion(s.usuario_id);
      const users = this.users();
      const userName = users.find((u) => u.id === identificacion)?.name || 'Desconocido';
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
    this.sanctions.set(sanctions);
  }

  async cancelarReservasVencidas() {
    const { error } = await supabase.rpc('cancelar_reservas_vencidas');
    if (error) {
      console.error('Error canceling expired reservations:', error);
      return;
    }
    await this.refreshReservations();
    await this.fetchSanctions();
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
    const { eventType } = payload;
    if (eventType === 'INSERT' || eventType === 'UPDATE' || eventType === 'DELETE') {
      await this.refreshLoans();
      await this.fetchPendingReturns();
      await this.refreshEjemplares();
    }
  }

  private async handleRealtimeReserva(payload: any) {
    await this.refreshReservations();
    await this.refreshEjemplares();
    await this.fetchSanctions();
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
      .select('id, usuario_id, ejemplar_id, fecha_prestamo, fecha_limite_devolucion, fecha_real_devolucion, estado, observaciones, evaluado_por');
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
        ejemplarId: p.ejemplar_id,
        userId: String(p.usuario_id),
        userName: usr?.nombre_completo || 'Desconocido',
        bookIsbn: lib?.isbn || '',
        bookTitle: lib?.titulo || '',
        loanDate: p.fecha_prestamo ? p.fecha_prestamo.substring(0, 10) : '',
        dueDate: p.fecha_limite_devolucion ? p.fecha_limite_devolucion.substring(0, 10) : '',
        returnDate: p.fecha_real_devolucion ? p.fecha_real_devolucion.substring(0, 10) : null,
        status: LOAN_STATUS_MAP[p.estado] || 'Activo',
        observaciones: p.observaciones,
        evaluadoPor: p.evaluado_por ? String(p.evaluado_por) : null,
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
      .select('id, libro_id, estado, codigo_ejemplar');
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
        const updatedEjemplares = ejemplares.map((e: any) => ({
          id: e.id,
          numero: parseInt(String(e.codigo_ejemplar).split('-').pop() || '0', 10),
          codigo: e.codigo_ejemplar,
          estado: e.estado,
        }));
        return { ...book, ejemplares: updatedEjemplares, copies: ejemplares.length, availableCopies, status: availableCopies > 0 ? 'Disponible' as const : 'No disponible' as const };
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
