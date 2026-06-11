import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';

/**
 * AdminComponent — US-006 / US-008
 *
 * Area admin, accessibile solo agli utenti in whitelist.
 * Espone il pulsante di logout e il link al form di inserimento carico (US-008).
 */
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [MatButtonModule, RouterLink],
  template: `
    <div class="admin-shell">
      <header class="admin-header">
        <h1>Area Amministratore</h1>
        <button mat-stroked-button (click)="logout()">Logout</button>
      </header>
      <main class="admin-content">
        <nav class="admin-nav">
          <a routerLink="/admin/carichi" class="admin-nav__link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path d="M12 2a10 10 0 0 1 0 20A10 10 0 0 1 12 2z"/>
              <path d="M12 8v4l2 2"/>
            </svg>
            Carichi
          </a>
          <a routerLink="/admin/pagamenti" class="admin-nav__link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            Pagamenti
          </a>
          <a routerLink="/admin/configurazione" class="admin-nav__link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            Configurazione prezzi
          </a>
        </nav>
        <a routerLink="/dashboard" class="admin-content__link">Vai alla dashboard pubblica</a>
      </main>
    </div>
  `,
  styles: [`
    .admin-shell {
      min-height: 100vh;
      background: #060f14;
      color: #e0f6fa;
      font-family: "DM Sans", system-ui, sans-serif;
    }
    .admin-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem 2rem;
      border-bottom: 1px solid rgba(103, 232, 249, 0.14);
    }
    .admin-content {
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .admin-nav {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .admin-nav__link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: rgba(14, 116, 144, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.25);
      border-radius: 10px;
      color: #38bdf8;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9375rem;
      transition: background 0.15s, border-color 0.15s;
      width: fit-content;

      &:hover {
        background: rgba(14, 116, 144, 0.25);
        border-color: rgba(56, 189, 248, 0.45);
      }
    }
    .admin-content__link {
      color: #22d3ee;
      font-size: 0.875rem;
    }
  `],
})
export class Admin {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  async logout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigate(['/login']);
  }
}
