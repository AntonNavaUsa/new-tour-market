import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/button';
import { User, LogOut, BookOpen, ChevronDown } from 'lucide-react';
import { messagesApi } from '../../lib/api/messages';
import { guidePagesApi } from '../../lib/api/guide-pages';
import { useState, useRef, useEffect } from 'react';

export function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [guideOpen, setGuideOpen] = useState(false);
  const guideRef = useRef<HTMLDivElement>(null);

  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => messagesApi.getUnreadCount(),
    enabled: isAuthenticated,
    refetchInterval: 30000,
    staleTime: 20000,
  });

  const unreadCount = unreadData?.count ?? 0;

  const { data: guidePages = [] } = useQuery({
    queryKey: ['guide-pages-nav'],
    queryFn: guidePagesApi.list,
    staleTime: 60000,
  });

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (guideRef.current && !guideRef.current.contains(e.target as Node)) {
        setGuideOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-12 items-center justify-between">
        <div className="flex items-center gap-3 md:gap-6 min-w-0">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo.png" alt="Сезон приключений" className="h-9 w-9 rounded-full object-contain" />
            {!isAuthenticated && (
              <span className="text-base sm:text-xl md:text-2xl font-bold text-primary whitespace-nowrap">Сезон приключений!</span>
            )}
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link 
              to="/#tours" 
              className="transition-colors hover:text-foreground/80 text-foreground"
            >
              Все туры
            </Link>

            {/* Путеводитель dropdown */}
            <div ref={guideRef} className="relative">
              <button
                className="flex items-center gap-1 transition-colors hover:text-foreground/80 text-foreground"
                onClick={() => setGuideOpen((v) => !v)}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Путеводитель
                <ChevronDown className={`h-3 w-3 transition-transform ${guideOpen ? 'rotate-180' : ''}`} />
              </button>
              {guideOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-background border rounded-lg shadow-lg py-1 z-50">
                  {guidePages.length === 0 ? (
                    <span className="block px-4 py-2 text-sm text-muted-foreground">Нет страниц</span>
                  ) : (
                    guidePages.map((p) => (
                      <Link
                        key={p.id}
                        to={`/guides/${p.slug}`}
                        className="block px-4 py-2 text-sm hover:bg-stone-50 transition-colors"
                        onClick={() => setGuideOpen(false)}
                      >
                        {p.title}
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>

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
                  to="/admin/guide-pages" 
                  className="transition-colors hover:text-foreground/80 text-foreground"
                >
                  Путеводитель
                </Link>
                <Link 
                  to="/admin/settings" 
                  className="transition-colors hover:text-foreground/80 text-foreground"
                >
                  Настройки
                </Link>
                <span className="relative inline-block">
                  <Link 
                    to="/admin/orders" 
                    className="transition-colors hover:text-foreground/80 text-foreground"
                  >
                    Заказы
                  </Link>
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-4 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </span>
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
              
              <span className="relative inline-block">
                <Link to="/orders">
                  <Button variant="outline" size="sm">
                    Мои заказы
                  </Button>
                </Link>
                {unreadCount > 0 && user?.role === 'USER' && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none pointer-events-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </span>

              <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">Выйти</span>
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden md:block">
                <Button variant="ghost" size="sm">
                  Войти
                </Button>
              </Link>
              <Link to="/register" className="hidden md:block">
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
