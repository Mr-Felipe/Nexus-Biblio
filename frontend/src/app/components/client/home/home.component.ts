import { ChangeDetectionStrategy, Component, inject, signal, computed, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LibraryState } from '../../../library-state';
import { ToastService } from '../../../services/toast.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  state = inject(LibraryState);
  private toast = inject(ToastService);

  @Output() navigate = new EventEmitter<string>();

  homeSearchQuery = signal('');
  homePlaceholderIndex = signal(0);

  homePlaceholders = [
    'Explora nuestra colección de clásicos universales...',
    'Encuentra tu próxima aventura literaria...',
    'Más de 500 títulos disponibles para ti...',
    'Reserva favoritos y recígelos al instante...',
    'Descubre novela, filosofía, terror y más...',
    'Tu biblioteca digital, siempre abierta...',
  ];

  ngOnInit() {
    setInterval(() => {
      this.homePlaceholderIndex.update((i) => (i + 1) % this.homePlaceholders.length);
    }, 4000);
  }

  searchFromHome() {
    const query = this.homeSearchQuery();
    this.state.pendingSearch.set(query);
    const role = this.state.currentUser()?.role;
    if (role === 'ADMIN' || role === 'BIBL') {
      this.state.activeView.set('inventory');
    } else {
      this.state.activeView.set('catalogue');
    }
  }

  searchBook(bookTitle: string) {
    this.state.pendingSearch.set(bookTitle);
    const role = this.state.currentUser()?.role;
    if (role === 'ADMIN' || role === 'BIBL') {
      this.state.activeView.set('inventory');
    } else {
      this.state.activeView.set('catalogue');
    }
  }
}
