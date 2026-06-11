import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard/dashboard';
import { Login } from './features/login/login';
import { Admin } from './features/admin/admin';
import { LoadFormComponent } from './features/admin/loads/load-form/load-form';
import { PaymentFormComponent } from './features/admin/payments/payment-form/payment-form';
import { ConfigFormComponent } from './features/admin/config/config-form/config-form';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard },
  { path: 'login', component: Login },
  { path: 'admin', component: Admin, canActivate: [authGuard] },
  { path: 'admin/carichi/nuovo', component: LoadFormComponent, canActivate: [authGuard] },
  { path: 'admin/pagamenti/nuovo', component: PaymentFormComponent, canActivate: [authGuard] },
  { path: 'admin/configurazione', component: ConfigFormComponent, canActivate: [authGuard] },
];
