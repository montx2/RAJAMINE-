import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useStore } from './store/useStore';
import type { Role } from './data/types';
import AppShell from './components/AppShell';
import DriverShell from './components/DriverShell';
import { Toaster } from './components/ui';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import NewReport from './pages/NewReport';
import ReportDetail from './pages/ReportDetail';
import ReviewCenter from './pages/ReviewCenter';
import Equipment from './pages/Equipment';
import Trucks from './pages/Trucks';
import Registry from './pages/Registry';
import Documents from './pages/Documents';
import Weekly from './pages/Weekly';
import Operations from './pages/Operations';
import DriverOps from './pages/DriverOps';
import FillReport from './pages/FillReport';
import DriverHome from './pages/driver/DriverHome';
import DriverChecklist from './pages/driver/DriverChecklist';
import DriverOccurrences from './pages/driver/DriverOccurrences';
import DriverOccurrenceNew from './pages/driver/DriverOccurrenceNew';
import DriverHistory from './pages/driver/DriverHistory';
import DriverTraining from './pages/driver/DriverTraining';

function homeFor(role?: Role) {
  if (role === 'motorista') return '/motorista';
  if (role === 'colaborador') return '/relatorios';
  return '/';
}

function RequireAuth({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
  const session = useStore((s) => s.session);
  if (!session) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(session.role)) {
    return <Navigate to={homeFor(session.role)} replace />;
  }
  return <>{children}</>;
}

export function AppRoutes() {
  const session = useStore((s) => s.session);
  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to={homeFor(session.role)} replace /> : <Login />} />
      <Route path="/preencher/:token" element={<FillReport />} />

      {/* Portal do Motorista — PWA mobile-first */}
      <Route path="/motorista" element={<RequireAuth roles={['motorista']}><DriverShell /></RequireAuth>}>
        <Route index element={<DriverHome />} />
        <Route path="checklist" element={<DriverChecklist />} />
        <Route path="checklist/:caminhaoId" element={<DriverChecklist />} />
        <Route path="ocorrencias" element={<DriverOccurrences />} />
        <Route path="ocorrencias/nova" element={<DriverOccurrenceNew />} />
        <Route path="historico" element={<DriverHistory />} />
        <Route path="treinamento" element={<DriverTraining />} />
      </Route>

      <Route element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route path="/" element={<RequireAuth roles={['admin', 'revisora']}><Dashboard /></RequireAuth>} />
        <Route path="/relatorios" element={<Reports />} />
        <Route path="/relatorios/novo" element={<RequireAuth roles={['admin', 'revisora', 'colaborador']}><NewReport /></RequireAuth>} />
        <Route path="/relatorios/:id" element={<ReportDetail />} />
        <Route path="/revisao" element={<RequireAuth roles={['admin', 'revisora']}><ReviewCenter /></RequireAuth>} />
        <Route path="/operacoes" element={<RequireAuth roles={['admin', 'revisora']}><Operations /></RequireAuth>} />
        <Route path="/semanal" element={<RequireAuth roles={['admin', 'revisora']}><Weekly /></RequireAuth>} />
        <Route path="/equipamentos" element={<RequireAuth roles={['admin', 'revisora']}><Equipment /></RequireAuth>} />
        <Route path="/caminhoes" element={<RequireAuth roles={['admin', 'revisora']}><Trucks /></RequireAuth>} />
        <Route path="/ocorrencias" element={<RequireAuth roles={['admin', 'revisora']}><DriverOps /></RequireAuth>} />
        <Route path="/cadastros" element={<RequireAuth roles={['admin']}><Registry /></RequireAuth>} />
        <Route path="/documentos" element={<RequireAuth roles={['admin', 'revisora']}><Documents /></RequireAuth>} />
      </Route>

      <Route path="*" element={<Navigate to={session ? homeFor(session.role) : '/login'} replace />} />
    </Routes>
  );
}

function ToastLayer() {
  const { pathname } = useLocation();
  // Portal do motorista e link de preenchimento têm barra fixa em qualquer
  // largura; na gestão ela só existe abaixo de lg.
  const alwaysBar = pathname.startsWith('/motorista') || pathname.startsWith('/preencher');
  return <Toaster className={alwaysBar ? 'bottom-20' : 'bottom-20 lg:bottom-6'} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <ToastLayer />
    </BrowserRouter>
  );
}
