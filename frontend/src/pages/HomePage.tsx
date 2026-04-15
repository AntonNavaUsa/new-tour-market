import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { MapPin, Clock, Users, Shield } from 'lucide-react';

export function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary/10 to-background py-20 md:py-32">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
              Откройте мир удивительных путешествий
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Маркетплейс туристических услуг - от экскурсий до приключений. 
              Бронируйте онлайн и наслаждайтесь незабываемыми впечатлениями.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/tours">
                <Button size="lg" className="w-full sm:w-auto">
                  Посмотреть туры
                </Button>
              </Link>
              <Link to="/about">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Узнать больше
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
              Мы создали платформу, которая делает бронирование туров простым и безопасным
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <MapPin className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-xl">Широкий выбор</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Сотни туров и экскурсий в разных локациях от проверенных партнеров
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Clock className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-xl">Мгновенное бронирование</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Забронируйте тур онлайн за несколько минут без звонков и ожидания
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
                <CardTitle className="text-xl">Отзывы туристов</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Реальные отзывы от путешественников помогут сделать правильный выбор
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
            <h2 className="text-3xl font-bold mb-4">Готовы начать путешествие?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Присоединяйтесь к тысячам довольных путешественников
            </p>
            <Link to="/tours">
              <Button size="lg">
                Найти тур
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
