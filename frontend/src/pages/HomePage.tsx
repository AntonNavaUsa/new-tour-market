import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Mountain, Clock, Users, Shield } from 'lucide-react';

export function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary/10 to-background py-20 md:py-32">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
              Треккинги и походы в горы
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Организуем походы, треккинги и горные экспедиции в Красной Поляне.
              Бронируйте с опытными гидами онлайн — для новичков и опытных туристов.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/tours">
                <Button size="lg" className="w-full sm:w-auto">
                  Найти поход
                </Button>
              </Link>
              <Link to="/about">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  О нас
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Почему выбирают нас</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Мы специализируемся на треккингах и походах — для тех, кто хочет не просто отдыхать, а приключаться
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Mountain className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-xl">Только треккинги</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Пешие походы, горные тропы и многодневные экспедиции — ничего лишнего
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Clock className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-xl">Опытные гиды</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Все маршруты ведут сертифицированные гиды с знанием местности и техники безопасности
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-xl">Безопасная оплата</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Защищенные платежи через YooKassa с гарантией возврата средств
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-xl">Группы и соло</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Сберные группы для новичков и индивидуальные маршруты для опытных туристов
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Готовы к первому походу?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Для новичков и опытных — найдите свой маршрут в каталоге
            </p>
            <Link to="/tours">
              <Button size="lg">
                Смотреть походы
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
