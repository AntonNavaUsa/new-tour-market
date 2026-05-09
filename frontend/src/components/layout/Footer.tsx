import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="text-lg font-semibold mb-4">Сезон приключений!</h3>
            <p className="text-sm text-muted-foreground">
              Треккинги, походы и горные туры
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Туры</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/tours" className="text-muted-foreground hover:text-foreground transition-colors">
                  Все походы
                </Link>
              </li>
              <li>
                <Link to="/tours?type=trekking" className="text-muted-foreground hover:text-foreground transition-colors">
                  Треккинги
                </Link>
              </li>
              <li>
                <Link to="/tours?type=hiking" className="text-muted-foreground hover:text-foreground transition-colors">
                  Пешие походы
                </Link>
              </li>
              <li>
                <Link to="/tours?type=expedition" className="text-muted-foreground hover:text-foreground transition-colors">
                  Экспедиции
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Компания</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  О нас
                </Link>
              </li>
              <li>
                <Link to="/contacts" className="text-muted-foreground hover:text-foreground transition-colors">
                  Контакты
                </Link>
              </li>
              <li>
                <Link to="/become-partner" className="text-muted-foreground hover:text-foreground transition-colors">
                  Стать партнером
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Поддержка</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/help" className="text-muted-foreground hover:text-foreground transition-colors">
                  Помощь
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Условия использования
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Политика конфиденциальности
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground space-y-1">
          <p>&copy; {currentYear} Сезон приключений! Все права защищены.</p>
          <p>ИП Навакус Антон Борисович &mdash; ИНН&nbsp;665908836379</p>
        </div>
      </div>
    </footer>
  );
}
