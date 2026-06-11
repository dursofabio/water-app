import { Routes } from '@angular/router';
import { Dashboard } from './features/dashboard/dashboard/dashboard';
import { Login } from './features/login/login';
import { Admin } from './features/admin/admin';
import { AdminLoadsListComponent } from './features/admin/loads/loads-list/loads-list';
import { LoadFormComponent } from './features/admin/loads/load-form/load-form';
import { PaymentFormComponent } from './features/admin/payments/payment-form/payment-form';
import { PaymentsListComponent } from './features/admin/payments/payments-list/payments-list';
import { ConfigFormComponent } from './features/admin/config/config-form/config-form';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard },
  { path: 'login', component: Login },
  { path: 'admin', component: Admin, canActivate: [authGuard] },
  { path: 'admin/carichi', component: AdminLoadsListComponent, canActivate: [authGuard] },
  { path: 'admin/carichi/nuovo', component: LoadFormComponent, canActivate: [authGuard] },
  { path: 'admin/carichi/:loadId', component: LoadFormComponent, canActivate: [authGuard] },
  { path: 'admin/pagamenti', component: PaymentsListComponent, canActivate: [authGuard] },
  { path: 'admin/pagamenti/nuovo', component: PaymentFormComponent, canActivate: [authGuard] },
  { path: 'admin/pagamenti/:paymentId', component: PaymentFormComponent, canActivate: [authGuard] },
  { path: 'admin/configurazione', component: ConfigFormComponent, canActivate: [authGuard] },
];
