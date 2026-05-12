import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Redirect, Route, Switch } from 'wouter';

import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';

import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';

import Overview from './pages/Overview';
import Campaigns from './pages/Campaigns';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import Stores from './pages/Stores';
import Templates from './pages/Templates';

function DashboardRoutes() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Switch>
          <Route path="/dashboard">
            <Redirect to="/dashboard/overview" />
          </Route>

          <Route path="/dashboard/overview" component={Overview} />
          <Route path="/dashboard/campaigns" component={Campaigns} />
          <Route path="/dashboard/customers" component={Customers} />
          <Route path="/dashboard/orders" component={Orders} />
          <Route path="/dashboard/stores" component={Stores} />
          <Route path="/dashboard/templates" component={Templates} />
          <Route path="/dashboard/profile" component={Profile} />

          <Route component={NotFound} />
        </Switch>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />

      {/* Compatibilidade com links antigos */}
      <Route path="/campaigns">
        <Redirect to="/dashboard/campaigns" />
      </Route>

      <Route path="/customers">
        <Redirect to="/dashboard/customers" />
      </Route>

      <Route path="/orders">
        <Redirect to="/dashboard/orders" />
      </Route>

      <Route path="/stores">
        <Redirect to="/dashboard/stores" />
      </Route>

      <Route path="/templates">
        <Redirect to="/dashboard/templates" />
      </Route>

      <Route path="/profile">
        <Redirect to="/dashboard/profile" />
      </Route>

      <Route path="/overview">
        <Redirect to="/dashboard/overview" />
      </Route>

      {/* Dashboard */}
      <Route path="/dashboard" component={DashboardRoutes} />
      <Route path="/dashboard/:rest*" component={DashboardRoutes} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;