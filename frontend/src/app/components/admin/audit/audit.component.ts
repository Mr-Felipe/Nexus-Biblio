import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LibraryState } from '../../../library-state';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './audit.component.html',
  styleUrl: './audit.component.css',
})
export class AuditComponent {
  state = inject(LibraryState);

  auditSearchQuery = signal('');
  auditOpFilter = signal('ALL');

  filteredAuditLogs = computed(() => {
    const q = this.auditSearchQuery().toLowerCase().trim();
    const op = this.auditOpFilter();
    return this.state.auditLogs().filter((log) => {
      const matchQ = log.userName.toLowerCase().includes(q) || log.detail.toLowerCase().includes(q) || log.userId.includes(q) || log.operation.toLowerCase().includes(q);
      const matchOp = op === 'ALL' || log.operation === op;
      return matchQ && matchOp;
    });
  });

  exportCsv() {
    const logs = this.filteredAuditLogs();
    const header = 'ID,Fecha,Hora,Usuario,Operación,IP,Detalle\n';
    const rows = logs.map(l => `${l.id},${l.date},${l.time},${l.userName},${l.operation},${l.ip},"${l.detail.replace(/"/g, '""')}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
