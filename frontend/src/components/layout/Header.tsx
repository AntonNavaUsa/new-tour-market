import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/button';
import { User, LogOut } from 'lucide-react';

export function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-12 items-center justify-between">
        <div className="flex items-center gap-3 md:gap-6 min-w-0">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo.png" alt="Сезон приключений" className="h-9 w-9 rounded-full object-contain" />
            <span className="text-base sm:text-xl md:text-2xl font-bold text-primary whitespace-nowrap">Сезон приключений!</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link 
              to="/tours" 
              className="transition-colors hover:text-foreground/80 text-foreground"
            >
              Походы и треккинги
            </Link>
            <Link 
              to="/tour-packages" 
              className="transition-colors hover:text-foreground/80 text-foreground"
            >
              Туры с проживанием
            </Link>

            {isAuthenticated && user?.role === 'ADMIN' && (
              <div className="flex items-center space-x-4">
                <span className="text-foreground/60">|</span>
                <Link 
                  to="/admin/cards" 
                  className="transition-colors hover:text-foreground/80 text-foreground"
                >
                  Карточки
                </Link>
                <Link 
                  to="/admin/locations" 
                  className="transition-colors hover:text-foreground/80 text-foreground"
                >
                  Локации
                </Link>
                <Link 
                  to="/admin/card-types" 
                  className="transition-colors hover:text-foreground/80 text-foreground"
                >
                  Типы
                </Link>
                <Link 
                  to="/admin/tariff-types" 
                  className="transition-colors hover:text-foreground/80 text-foreground"
                >
                  Тарифы
                </Link>
                <Link 
                  to="/admin/reviews" 
                  className="transition-colors hover:text-foreground/80 text-foreground"
                >
                  Отзывы
                </Link>
                <Link 
                  to="/admin/orders" 
                  className="transition-colors hover:text-foreground/80 text-foreground"
                >
                  Заказы
                </Link>
              </div>
            )}
            {isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'PARTNER') && (
              <Link 
                to="/my-cards" 
                className="transition-colors hover:text-foreground/80 text-foreground"
              >
                Мои туры
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link to="/profile">
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline">{user?.name}</span>
                </Button>
              </Link>
              
              <Link to="/orders">
                <Button variant="outline" size="sm">
                  Мои заказы
                </Button>
              </Link>

              <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">Выйти</span>
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Войти
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">
                  Регистрация
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
