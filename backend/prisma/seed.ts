import { PrismaClient, UserRole, CardStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.orderTicket.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.expression.deleteMany();
  await prisma.slideshowPhoto.deleteMany();
  await prisma.price.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.card.deleteMany();
  await prisma.user.deleteMany();
  await prisma.partner.deleteMany();
  await prisma.cardType.deleteMany();
  await prisma.location.deleteMany();

  console.log('✅ Cleaned existing data');

  // Create locations
  const bali = await prisma.location.create({
    data: {
      urlSlug: 'bali',
      country: 'Indonesia',
      region: 'Bali',
      city: 'Denpasar',
      language: 'ru',
    },
  });

  const phuket = await prisma.location.create({
    data: {
      urlSlug: 'phuket',
      country: 'Thailand',
      region: 'Phuket',
      city: 'Phuket City',
      language: 'ru',
    },
  });

  const dubai = await prisma.location.create({
    data: {
      urlSlug: 'dubai',
      country: 'UAE',
      region: 'Dubai',
      city: 'Dubai',
      language: 'ru',
    },
  });

  console.log('✅ Created locations');

  // Create card types
  const excursion = await prisma.cardType.create({
    data: {
      name: 'Экскурсия',
      slug: 'excursion',
    },
  });

  const activity = await prisma.cardType.create({
    data: {
      name: 'Активность',
      slug: 'activity',
    },
  });

  const transfer = await prisma.cardType.create({
    data: {
      name: 'Трансфер',
      slug: 'transfer',
    },
  });

  console.log('✅ Created card types');

  // Create partner
  const partner1 = await prisma.partner.create({
    data: {
      title: 'Bali Adventures Co.',
      description: 'Лучший туроператор на Бали с 10-летним опытом',
      contacts: {
        phone: '+62 123 456 789',
        email: 'info@baliadventures.com',
        website: 'https://baliadventures.com',
        address: 'Jl. Sunset Road, Seminyak, Bali',
      },
    },
  });

  console.log('✅ Created partners');

  // Hash password
  const passwordHash = await bcrypt.hash('password123', 10);

  // Create users
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@travelio.local',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: UserRole.ADMIN,
      emailVerified: true,
    },
  });

  const partnerUser = await prisma.user.create({
    data: {
      name: 'Partner User',
      email: 'partner@travelio.local',
      passwordHash: await bcrypt.hash('partner123', 10),
      role: UserRole.PARTNER,
      partnerId: partner1.id,
      emailVerified: true,
    },
  });

  const normalUser = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'user@travelio.local',
      phone: '+7 999 123 45 67',
      passwordHash: await bcrypt.hash('user123', 10),
      role: UserRole.USER,
      emailVerified: true,
    },
  });

  console.log('✅ Created users');

  // Create cards with partner user
  const card1 = await prisma.card.create({
    data: {
      userId: partnerUser.id,
      locationId: bali.id,
      cardTypeId: excursion.id,
      partnerId: partner1.id,
      title: 'Обзорная экскурсия по рисовым террасам Тегаллаланг',
      shortDescription:
        'Посетите знаменитые рисовые террасы Тегаллаланг и узнайте о традиционной системе орошения Субак',
      description: `
# Описание тура

Познакомьтесь с одной из самых известных достопримечательностей Бали - рисовыми террасами Тегаллаланг. 
Эта впечатляющая система террасного земледелия, созданная более 1000 лет назад, является объектом Всемирного наследия ЮНЕСКО.

## Программа тура:
- Встреча в отеле
- Трансфер к рисовым террасам (30 минут)
- Прогулка по террасам с гидом (1.5 часа)
- Посещение плантации кофе Лювак
- Фотосессия на фоне террас
- Трансфер обратно в отель

## Что включено:
- Трансфер туда-обратно
- Русскоговорящий гид
- Входные билеты
- Бутылка воды

## Что взять с собой:
- Удобную обувь
- Головной убор
- Солнцезащитный крем
- Фотокамеру
      `,
      tags: ['природа', 'культура', 'фото'],
      status: CardStatus.PUBLISHED,
      position: 1,
      duration: 240,
      minParticipants: 2,
      maxParticipants: 8,
      headPhotoUrl: 'https://placehold.co/800x600/4ade80/ffffff?text=Rice+Terraces',
    },
  });

  const card2 = await prisma.card.create({
    data: {
      userId: admin.id,
      locationId: bali.id,
      cardTypeId: activity.id,
      title: 'Рафтинг по реке Аюнг',
      shortDescription: 'Захватывающий сплав по горной реке с порогами 2-3 категории',
      description: `
# Рафтинг по реке Аюнг

Приключение для любителей активного отдыха! Сплав по самой живописной реке Бали с опытными инструкторами.

## Маршрут:
- Длина: 12 км
- Продолжительность на воде: 2 часа
- Пороги: 2-3 категории
- Водопады и джунгли

## Включено:
- Инструктаж
- Профессиональное снаряжение
- Страховка
- Обед
- Душ и раздевалки
- Фотографии
      `,
      tags: ['активность', 'приключение', 'спорт'],
      status: CardStatus.PUBLISHED,
      position: 2,
      duration: 300,
      minParticipants: 4,
      maxParticipants: 20,
      headPhotoUrl: 'https://placehold.co/800x600/06b6d4/ffffff?text=Rafting',
    },
  });

  const card3 = await prisma.card.create({
    data: {
      userId: partnerUser.id,
      locationId: phuket.id,
      cardTypeId: excursion.id,
      partnerId: partner1.id,
      title: 'Экскурсия на острова Пхи-Пхи',
      shortDescription: 'Морская прогулка к знаменитым островам из фильма "Пляж"',
      description: `
# Острова Пхи-Пхи

Посетите одни из самых красивых островов Таиланда на комфортабельном катере.

## Программа:
- 08:00 - Выезд из отеля
- 09:00 - Отплытие от пристани
- Бухта Майя Бэй
- Остров Бамбу
- Снорклинг
- Обед на острове
- 16:00 - Возвращение

## В стоимость включено:
- Трансфер
- Катер
- Снаряжение для снорклинга
- Обед
- Фрукты и напитки
- Страховка
      `,
      tags: ['море', 'острова', 'снорклинг'],
      status: CardStatus.PUBLISHED,
      position: 1,
      duration: 480,
      minParticipants: 10,
      maxParticipants: 40,
      headPhotoUrl: 'https://placehold.co/800x600/f59e0b/ffffff?text=Phi+Phi+Islands',
    },
  });

  console.log('✅ Created cards');

  // Create schedules
  await prisma.schedule.create({
    data: {
      cardId: card1.id,
      weeklySchedule: {
        monday: { active: true, times: ['09:00', '14:00'] },
        tuesday: { active: true, times: ['09:00', '14:00'] },
        wednesday: { active: true, times: ['09:00', '14:00'] },
        thursday: { active: true, times: ['09:00', '14:00'] },
        friday: { active: true, times: ['09:00', '14:00'] },
        saturday: { active: true, times: ['09:00', '13:00'] },
        sunday: { active: false, times: [] },
      },
      specialDates: [],
    },
  });

  await prisma.schedule.create({
    data: {
      cardId: card2.id,
      weeklySchedule: {
        monday: { active: true, times: ['08:00'] },
        tuesday: { active: true, times: ['08:00'] },
        wednesday: { active: true, times: ['08:00'] },
        thursday: { active: true, times: ['08:00'] },
        friday: { active: true, times: ['08:00'] },
        saturday: { active: true, times: ['08:00'] },
        sunday: { active: true, times: ['08:00'] },
      },
      specialDates: [],
    },
  });

  await prisma.schedule.create({
    data: {
      cardId: card3.id,
      weeklySchedule: {
        monday: { active: true, times: ['08:00'] },
        tuesday: { active: true, times: ['08:00'] },
        wednesday: { active: true, times: ['08:00'] },
        thursday: { active: true, times: ['08:00'] },
        friday: { active: true, times: ['08:00'] },
        saturday: { active: true, times: ['08:00'] },
        sunday: { active: false, times: [] },
      },
      specialDates: [],
    },
  });

  console.log('✅ Created schedules');

  // Create tickets and prices for card1
  const ticket1Adult = await prisma.ticket.create({
    data: {
      cardId: card1.id,
      title: 'Взрослый билет',
      description: 'Для лиц старше 12 лет',
      isMain: true,
      position: 1,
      typeConfig: { ageFrom: 12, ageTo: 99 },
    },
  });

  const ticket1Child = await prisma.ticket.create({
    data: {
      cardId: card1.id,
      title: 'Детский билет',
      description: 'Для детей от 3 до 12 лет',
      isMain: false,
      position: 2,
      typeConfig: { ageFrom: 3, ageTo: 12 },
    },
  });

  // Prices for next 30 days
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setDate(today.getDate() + 30);

  await prisma.price.create({
    data: {
      ticketId: ticket1Adult.id,
      dateFrom: today,
      dateTo: nextMonth,
      adultPrice: 2500,
      availableSlots: 50,
    },
  });

  await prisma.price.create({
    data: {
      ticketId: ticket1Child.id,
      dateFrom: today,
      dateTo: nextMonth,
      adultPrice: 1500,
      availableSlots: 50,
    },
  });

  // Create tickets and prices for card2
  const ticket2Adult = await prisma.ticket.create({
    data: {
      cardId: card2.id,
      title: 'Участник',
      description: 'Стандартный билет на рафтинг',
      isMain: true,
      position: 1,
    },
  });

  await prisma.price.create({
    data: {
      ticketId: ticket2Adult.id,
      dateFrom: today,
      dateTo: nextMonth,
      adultPrice: 3500,
      availableSlots: 30,
    },
  });

  // Create tickets and prices for card3
  const ticket3Adult = await prisma.ticket.create({
    data: {
      cardId: card3.id,
      title: 'Взрослый',
      description: 'Для лиц старше 10 лет',
      isMain: true,
      position: 1,
      typeConfig: { ageFrom: 10, ageTo: 99 },
    },
  });

  const ticket3Child = await prisma.ticket.create({
    data: {
      cardId: card3.id,
      title: 'Детский',
      description: 'Для детей от 4 до 10 лет',
      isMain: false,
      position: 2,
      typeConfig: { ageFrom: 4, ageTo: 10 },
    },
  });

  await prisma.price.create({
    data: {
      ticketId: ticket3Adult.id,
      dateFrom: today,
      dateTo: nextMonth,
      adultPrice: 4500,
      availableSlots: 100,
    },
  });

  await prisma.price.create({
    data: {
      ticketId: ticket3Child.id,
      dateFrom: today,
      dateTo: nextMonth,
      adultPrice: 2500,
      availableSlots: 100,
    },
  });

  console.log('✅ Created tickets and prices');

  // Create slideshow photos
  await prisma.slideshowPhoto.createMany({
    data: [
      {
        cardId: card1.id,
        url: 'https://placehold.co/1200x800/4ade80/ffffff?text=Gallery+1',
        sortOrder: 1,
        caption: 'Вид на террасы',
      },
      {
        cardId: card1.id,
        url: 'https://placehold.co/1200x800/4ade80/ffffff?text=Gallery+2',
        sortOrder: 2,
        caption: 'Фермеры за работой',
      },
      {
        cardId: card1.id,
        url: 'https://placehold.co/1200x800/4ade80/ffffff?text=Gallery+3',
        sortOrder: 3,
        caption: 'Закат над террасами',
      },
    ],
  });

  console.log('✅ Created slideshow photos');

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📝 Test users:');
  console.log('   Admin: admin@travelio.local / admin123');
  console.log('   Partner: partner@travelio.local / partner123');
  console.log('   User: user@travelio.local / user123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
