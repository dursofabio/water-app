import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

/**
 * AdminComponent — US-021 (TASK-02)
 *
 * Area admin redesignata con top bar sticky, quick actions panel,
 * sezione descrittiva e bottom nav mobile-only.
 */
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="app-shell">

      <!-- Top bar sticky -->
      <header class="top-bar">
        <a routerLink="/dashboard" class="back-link" aria-label="Vai alla dashboard pubblica">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Dashboard
        </a>
        <strong class="top-bar__title">Admin</strong>
        <div class="top-bar__right">
          <div class="brand" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <path d="M16 3C16 3 6 13.5 6 20a10 10 0 0 0 20 0C26 13.5 16 3 16 3z" fill="url(#drop-admin)"/>
              <defs>
                <linearGradient id="drop-admin" x1="16" y1="3" x2="16" y2="30" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#7dd3fc"/>
                  <stop offset="100%" stop-color="#0e7490"/>
                </linearGradient>
              </defs>
            </svg>
            <span class="brand__name">AcquaApp</span>
          </div>
          <button
            class="logout-btn"
            type="button"
            (click)="logout()"
            aria-label="Logout"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </header>

      <main class="admin-layout">

        <!-- Intro section -->
        <section class="admin-intro" aria-labelledby="admin-title">
          <p class="eyebrow">Operazioni ricorrenti</p>
          <h1 id="admin-title" class="intro-title">Registra senza perdere il filo.</h1>
          <p class="intro-subtitle">Carichi, pagamenti e prezzi restano a portata di tap, con la dashboard pubblica sempre raggiungibile.</p>
        </section>

        <!-- Quick actions -->
        <nav class="quick-actions" aria-label="Navigazione admin">
          <a routerLink="/admin/carichi/nuovo" class="quick-action quick-action--primary">
            <span class="quick-action__icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </span>
            <span class="quick-action__text">
              <strong>Nuovo carico</strong>
              <small>Preview quote live</small>
            </span>
          </a>
          <a routerLink="/admin/pagamenti/nuovo" class="quick-action">
            <span class="quick-action__icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </span>
            <span class="quick-action__text">
              <strong>Pagamento</strong>
              <small>Persona e importo</small>
            </span>
          </a>
          <a routerLink="/admin/configurazione" class="quick-action">
            <span class="quick-action__icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </span>
            <span class="quick-action__text">
              <strong>Prezzi</strong>
              <small>Acqua ed energia</small>
            </span>
          </a>
        </nav>

        <!-- Secondary CTA -->
        <div class="secondary-cta">
          <a routerLink="/dashboard" class="btn-secondary">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Vai alla dashboard pubblica
          </a>
        </div>

      </main>

      <!-- Bottom nav — mobile only (< 640px) -->
      <nav class="bottom-nav" aria-label="Navigazione rapida admin">
        <a routerLink="/admin/carichi" class="bottom-nav__item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M12 2a10 10 0 0 1 0 20A10 10 0 0 1 12 2z"/>
            <path d="M12 8v4l2 2"/>
          </svg>
          Carichi
        </a>
        <a routerLink="/admin/pagamenti" class="bottom-nav__item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
          Pagamenti
        </a>
        <a routerLink="/admin/configurazione" class="bottom-nav__item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          Prezzi
        </a>
        <a routerLink="/dashboard" class="bottom-nav__item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
          Dashboard
        </a>
      </nav>

    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    // ─── Layout ────────────────────────────────────────────────────────────────

    .app-shell {
      min-height: 100vh;
      background: #060f14;
      color: #e0f6fa;
      font-family: "DM Sans", system-ui, sans-serif;
      padding-bottom: 5rem;

      @media (min-width: 640px) {
        padding-bottom: 0;
      }
    }

    .admin-layout {
      width: min(980px, calc(100% - 2rem));
      margin: 0 auto;
      padding: 2rem 0 3rem;
    }

    // ─── Top bar ───────────────────────────────────────────────────────────────

    .top-bar {
      position: sticky;
      top: 0;
      z-index: 20;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border-bottom: 1px solid rgba(103, 232, 249, 0.1);
      background: rgba(6, 15, 20, 0.92);
      backdrop-filter: blur(12px);
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #38bdf8;
      text-decoration: none;
      min-height: 44px;
      padding: 0 0.25rem;
      letter-spacing: 0.01em;

      &:hover {
        color: #7dd3fc;
      }
    }

    .top-bar__title {
      font-size: 0.9375rem;
      font-weight: 700;
      color: #e0f6fa;
      text-align: center;
    }

    .top-bar__right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      justify-content: flex-end;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .brand__name {
      font-size: 0.8125rem;
      font-weight: 700;
      color: #38bdf8;
    }

    .logout-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      min-height: 44px;
      padding: 0 0.75rem;
      background: transparent;
      border: 1px solid rgba(103, 232, 249, 0.2);
      border-radius: 8px;
      color: #94a3b8;
      font-size: 0.8125rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: border-color 0.15s, color 0.15s;

      &:hover {
        border-color: rgba(103, 232, 249, 0.4);
        color: #e0f6fa;
      }
    }

    // ─── Intro section ─────────────────────────────────────────────────────────

    .admin-intro {
      padding: 1rem 0 0.5rem;
      margin-bottom: 1.5rem;
    }

    .eyebrow {
      margin: 0 0 0.35rem;
      color: #22d3ee;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .intro-title {
      margin: 0 0 0.6rem;
      font-size: clamp(1.75rem, 6vw, 3rem);
      font-weight: 700;
      line-height: 1.05;
      color: #e0f6fa;
    }

    .intro-subtitle {
      margin: 0;
      color: #64748b;
      font-size: 0.9rem;
      line-height: 1.5;
      max-width: 40rem;
    }

    // ─── Quick actions ─────────────────────────────────────────────────────────

    .quick-actions {
      display: grid;
      gap: 0.75rem;
      margin-bottom: 2rem;

      @media (min-width: 640px) {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .quick-action {
      display: grid;
      grid-template-columns: 46px minmax(0, 1fr);
      align-items: center;
      gap: 0.75rem;
      min-height: 68px;
      padding: 0.875rem;
      border: 1px solid rgba(103, 232, 249, 0.14);
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.04);
      text-decoration: none;
      color: #e0f6fa;
      transition: border-color 0.15s, background 0.15s;

      &:hover {
        border-color: rgba(103, 232, 249, 0.3);
        background: rgba(255, 255, 255, 0.07);
      }
    }

    .quick-action--primary {
      border-color: rgba(103, 232, 249, 0.28);
      background: rgba(14, 116, 144, 0.15);

      &:hover {
        border-color: rgba(103, 232, 249, 0.45);
        background: rgba(14, 116, 144, 0.22);
      }
    }

    .quick-action__icon {
      display: grid;
      place-items: center;
      width: 46px;
      height: 46px;
      border-radius: 10px;
      background: rgba(56, 189, 248, 0.14);
      color: #38bdf8;
      flex-shrink: 0;
    }

    .quick-action__text {
      display: flex;
      flex-direction: column;

      strong {
        display: block;
        font-size: 0.9375rem;
        font-weight: 700;
        color: #e0f6fa;
      }

      small {
        display: block;
        margin-top: 0.15rem;
        font-size: 0.8rem;
        color: #64748b;
      }
    }

    // ─── Secondary CTA ─────────────────────────────────────────────────────────

    .secondary-cta {
      display: flex;
    }

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      min-height: 44px;
      padding: 0.7rem 1.125rem;
      background: transparent;
      border: 1px solid rgba(103, 232, 249, 0.2);
      border-radius: 10px;
      color: #38bdf8;
      font-size: 0.875rem;
      font-weight: 600;
      font-family: inherit;
      text-decoration: none;
      cursor: pointer;
      transition: border-color 0.15s, color 0.15s;

      &:hover {
        border-color: rgba(103, 232, 249, 0.4);
        color: #7dd3fc;
      }
    }

    // ─── Bottom nav (mobile only) ───────────────────────────────────────────────

    .bottom-nav {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 30;
      grid-template-columns: repeat(4, 1fr);
      border-top: 1px solid rgba(103, 232, 249, 0.14);
      background: #0b1d27;
      backdrop-filter: blur(12px);
      padding-bottom: max(0.75rem, env(safe-area-inset-bottom));

      @media (max-width: 640px) {
        display: grid;
      }
    }

    .bottom-nav__item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.3rem;
      min-height: 58px;
      color: #64748b;
      text-decoration: none;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      transition: color 0.15s;

      &:hover {
        color: #38bdf8;
      }

      &.active {
        color: #38bdf8;
      }
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
