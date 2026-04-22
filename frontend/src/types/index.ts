// API Types based on backend Prisma schema

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  PARTNER = 'PARTNER',
  HOTEL_OWNER = 'HOTEL_OWNER',
}

export enum CardStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum PricingType {
  PER_GROUP = 'PER_GROUP',
  PER_PERSON = 'PER_PERSON',
}

export enum OrderStatus {
  PREORDER = 'PREORDER',
  CONFIRMED = 'CONFIRMED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  COMPLETED = 'COMPLETED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  emailVerified: boolean;
  partnerId: string | null;
  hotelId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  urlSlug: string;
  country: string;
  region: string | null;
  city: string | null;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export interface CardType {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface TariffType {
  id: string;
  name: string;
  description: string | null;
  ageFrom: number | null;
  ageTo: number | null;
  sortOrder: number;
  createdAt: string;
}

export interface AdminUserOption {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  partnerId: string | null;
}

export interface Card {
  id: string;
  userId: string;
  locationId: string;
  cardTypeId: string;
  partnerId: string | null;
  title: string;
  description: string;
  shortDescription: string | null;
  headPhotoUrl: string | null;
  tags: string[];
  includedItems: string[] | null;
  notIncludedItems: string[] | null;
  status: CardStatus;
  duration: number | null;
  minParticipants: number | null;
  maxParticipants: number | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  location?: Location;
  cardType?: CardType;
  tickets?: Ticket[];
  slideshowPhotos?: SlideshowPhoto[];
  expressions?: Expression[];
  schedules?: Schedule[];
}

export interface Ticket {
  id: string;
  cardId: string;
  title: string;
  description: string | null;
  isMain: boolean;
  position: number;
  typeConfig: any;
  pricingType: PricingType;
  tariffTypeId: string | null;
  tariffType?: TariffType | null;
  createdAt: string;
  updatedAt: string;
  prices?: Price[];
}

export interface GroupTier {
  minPeople: number;
  maxPeople: number | null;
  price: number;
  priceType: 'fixed' | 'per_person';
}

export interface Price {
  id: string;
  ticketId: string;
  dateFrom: string;
  dateTo: string;
  adultPrice: string;
  childPrice: string | null;
  minPrice: string | null;
  availableSlots: number | null;
  isArchived: boolean;
  groupTiers: GroupTier[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  id: string;
  cardId: string;
  weeklySchedule: any;
  specialDates: any;
  createdAt: string;
  updatedAt: string;
}

export interface SlideshowPhoto {
  id: string;
  cardId: string;
  url: string;
  caption: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Expression {
  id: string;
  cardId: string;
  photoUrl: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  userId: string;
  cardId: string;
  date: string;
  time: string | null;
  quantity: number;
  amount: string;
  prepaymentPercent: number;
  prepaymentAmount: string;
  status: OrderStatus;
  expired: boolean;
  expiresAt: string | null;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  card?: Card;
  user?: User;
  orderTickets?: OrderTicket[];
  payments?: Payment[];
}

export interface OrderTicket {
  id: string;
  orderId: string;
  ticketId: string;
  priceId: string;
  quantity: number;
  priceSnapshot: any;
  createdAt: string;
  updatedAt: string;
  ticket?: Ticket;
}

export interface Payment {
  id: string;
  userId: string;
  orderId: string;
  amount: string;
  paymentIdExternal: string | null;
  status: PaymentStatus;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

// API Request/Response types

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface CreateCardRequest {
  userId?: string;
  locationId: string;
  cardTypeId: string;
  title: string;
  description: string;
  shortDescription?: string;
  tags?: string[];
  duration?: number;
  minParticipants?: number;
  maxParticipants?: number;
  position?: number;
  includedItems?: string[];
  notIncludedItems?: string[];
}

export interface UpdateCardRequest extends Partial<CreateCardRequest> {
  status?: CardStatus;
}

export interface CardFilterParams {
  locationId?: string;
  cardTypeId?: string;
  status?: CardStatus;
  search?: string;
  tags?: string[];
  skip?: number;
  take?: number;
  includeNonPublished?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    skip: number;
    take: number;
    hasMore: boolean;
  };
}

export interface CreateTicketRequest {
  cardId: string;
  title: string;
  description?: string;
  isMain: boolean;
  position?: number;
  typeConfig?: any;
}

export interface CreatePriceRequest {
  ticketId: string;
  dateFrom: string;
  dateTo: string;
  adultPrice: number;
  childPrice?: number;
  infantPrice?: number;
  availableSlots?: number;
}

export interface WeeklySchedule {
  monday?: { active: boolean; times: string[] };
  tuesday?: { active: boolean; times: string[] };
  wednesday?: { active: boolean; times: string[] };
  thursday?: { active: boolean; times: string[] };
  friday?: { active: boolean; times: string[] };
  saturday?: { active: boolean; times: string[] };
  sunday?: { active: boolean; times: string[] };
}

export interface SpecialDate {
  dateFrom: string;
  dateTo?: string;
  times?: string[];
  isClosed: boolean;
  note?: string;
}

export interface UpdateScheduleRequest {
  weeklySchedule?: WeeklySchedule;
  specialDates?: SpecialDate[];
}

export interface CreateOrderRequest {
  cardId: string;
  date: string;
  time?: string;
  tickets: {
    ticketId: string;
    quantity: number;
  }[];
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
}

export interface CreatePaymentRequest {
  orderId: string;
  returnUrl?: string;
}

export interface PaymentResponse {
  payment?: Payment;
  paymentId?: string;
  confirmationToken?: string;
  confirmationUrl?: string;
  amount?: string | number;
  note?: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
