import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useStore, useCurrentUser } from './store/useStore';
import type { Role } from './data/types';
import AppShell from './components/AppShell';
import { Toaster } from './components/ui';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import NewReport from './pages/NewReport';
import ReportDetail from './pages/ReportDetail';
import FillReport from './pages/FillReport';
import ReviewCenter from './pages/ReviewCenter';
import EquipmentPage from './pages/Equipment';
import Trucks from './pages/Trucks';
import Registry from './pages/Registry';
import Documents from './pages/Documents';
import Compliance from './pages/Compliance';

function RequireAuth({ roles, children }: { roles?: Role[]; children: ReactNode }) {
  const user = useCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={user.role === 'colaborador' ? '/relatorios' : '/'} replace />;
  return <>{children}</>;
}

export function AppRoutes() {
  const session = useStore((s) => s.session);
  return (
    <>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
        {/* Link individual do colaborador — sem login, escopo restrito ao token */}
        <Route path="/preencher/:token" element={<FillReport />} />

        <Route element={<RequireAuth><AppShell /></RequireAuth>}>
          <Route path="/" element={<RequireAuth roles={['admin', 'revisora']}><Dashboard /></RequireAuth>} />
          <Route path="/relatorios" element={<Reports />} />
          <Route path="/relatorios/novo" element={<RequireAuth roles={['admin']}><NewReport /></RequireAuth>} />
          <Route path="/relatorios/:id" element={<ReportDetail />} />
          <Route path="/revisao" element={<RequireAuth roles={['admin', 'revisora']}><ReviewCenter /></RequireAuth>} />
          <Route path="/equipamentos" element={<RequireAuth roles={['admin', 'revisora']}><EquipmentPage /></RequireAuth>} />
          <Route path="/caminhoes" element={<RequireAuth roles={['admin', 'revisora']}><Trucks /></RequireAuth>} />
          <Route path="/cadastros" element={<RequireAuth roles={['admin']}><Registry /></RequireAuth>} />
          <Route path="/documentos" element={<RequireAuth roles={['admin', 'revisora']}><Documents /></RequireAuth>} />
          <Route path="/conformidade" element={<Compliance />} />
        </Route>

        <Route path="*" element={<Navigate to={session ? '/' : '/login'} replace />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
