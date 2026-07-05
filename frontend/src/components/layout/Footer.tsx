import { Link } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="text-lg font-semibold mb-4">Сезон путешествий!</h3>
            <p className="text-sm text-muted-foreground">
              Треккинги, походы и горные туры
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Туры</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/#tours" className="text-muted-foreground hover:text-foreground transition-colors">
                  Все маршруты
                </Link>
              </li>
              <li>
                <Link to="/#hiking" className="text-muted-foreground hover:text-foreground transition-colors">
                  Однодневные трекинги
                </Link>
              </li>
              <li>
                <Link to="/#pohod" className="text-muted-foreground hover:text-foreground transition-colors">
                  Трекинги с ночевками
                </Link>
              </li>
              <li>
                <Link to="/#self-guided" className="text-muted-foreground hover:text-foreground transition-colors">
                  Туры без гида
                </Link>
              </li>
              <li>
                <Link to="/tour-packages" className="text-muted-foreground hover:text-foreground transition-colors">
                  Туры с проживанием
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
            <h4 className="text-sm font-semibold mb-4">Офрета</h4>
            <ul className="space-y-2 text-sm">
              
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Условия использования
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Обработка персональных данных
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground space-y-1">
          <p>&copy; {currentYear} Сезон путешествий! Все права защищены.</p>
          <p>ИП Навакус Антон Борисович &mdash; ИНН&nbsp;665908836379</p>
        </div>
      </div>
    </footer>
  );
}
