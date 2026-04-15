import { useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { RootLayout } from './components/layout/RootLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { ToursPage } from './pages/ToursPage';
import { TourDetailPage } from './pages/TourDetailPage';
import { BookingPage } from './pages/BookingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { OrdersPage } from './pages/OrdersPage';
import { AdminCardsPage } from './pages/AdminCardsPage';
import { AdminCardFormPage } from './pages/AdminCardFormPage';
import { AdminLocationsPage } from './pages/AdminLocationsPage';
import { AdminLocationFormPage } from './pages/AdminLocationFormPage';
import { AdminCardTypesPage } from './pages/AdminCardTypesPage';
import { AdminCardTypeFormPage } from './pages/AdminCardTypeFormPage';
import { AdminTariffTypesPage } from './pages/AdminTariffTypesPage';
import { AdminTariffTypeFormPage } from './pages/AdminTariffTypeFormPage';
import { UserRole } from './types';

function App() {
  const loadUser = useAuthStore((state) => state.loadUser);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/tours" element={<ToursPage />} />
        <Route path="/tours/:id" element={<TourDetailPage />} />
        <Route path="/booking/:id" element={<BookingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cards"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AdminCardsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cards/new"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AdminCardFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cards/:id/edit"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AdminCardFormPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/locations"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AdminLocationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/locations/new"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AdminLocationFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/locations/:id/edit"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AdminLocationFormPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/card-types"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AdminCardTypesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/card-types/new"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AdminCardTypeFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/card-types/:id/edit"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AdminCardTypeFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tariff-types"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AdminTariffTypesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tariff-types/new"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AdminTariffTypeFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tariff-types/:id/edit"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AdminTariffTypeFormPage />
            </ProtectedRoute>
          }
        />
        
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

function NotFoundPage() {
  return (
    <div className="container mx-auto py-20 text-center">
      <h1 className="text-2xl font-bold mb-4">404 - Страница не найдена</h1>
      <p className="text-muted-foreground mb-6">
        Запрашиваемая страница не существует
      </p>
      <Link
        to="/"
        className="text-primary hover:underline"
      >
        Вернуться на главную
      </Link>
    </div>
  );
}

export default App;
