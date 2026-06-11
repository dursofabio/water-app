import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';

/**
 * LoginComponent — US-006
 *
 * Pagina di accesso admin con pulsante Google Sign-In.
 * Dopo il login verifica la whitelist /admins:
 * - UID autorizzato → naviga a /admin
 * - UID non autorizzato → mostra banner e redirige a /dashboard?denied=true
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly showDenied = signal(false);
  readonly errorMessage = signal<string | null>(null);

  async loginWithGoogle(): Promise<void> {
    this.isLoading.set(true);
    this.showDenied.set(false);
    this.errorMessage.set(null);

    try {
      await this.authService.loginWithGoogle();

      if (this.authService.isAdmin()) {
        await this.router.navigate(['/admin']);
      } else {
        this.showDenied.set(true);
        // Brief pause so the user sees the denied banner before redirect
        setTimeout(() => {
          this.router.navigate(['/dashboard'], { queryParams: { denied: 'true' } });
        }, 2000);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore durante il login';
      this.errorMessage.set(message);
    } finally {
      this.isLoading.set(false);
    }
  }
}
