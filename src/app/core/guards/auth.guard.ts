import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * authGuard — US-006 / US-007
 *
 * Guard funzionale che protegge le rotte admin.
 *
 * Attende che AuthService.isInitialized sia true prima di valutare
 * isAdmin, garantendo che la sessione Firebase persistita sia stata
 * ripristinata dopo un page reload.
 *
 * Se l'utente non è admin, redirige a /login.
 */
export const authGuard: CanActivateFn = (_route, _state): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return toObservable(authService.isInitialized).pipe(
    filter((initialized) => initialized),
    take(1),
    map(() => (authService.isAdmin() ? true : router.createUrlTree(['/login']))),
  );
};
