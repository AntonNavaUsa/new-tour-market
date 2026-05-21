import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Star, ChevronLeft, ChevronRight, X, BedDouble, ArrowLeft } from 'lucide-react';
import { accommodationsApi } from '../lib/api/accommodationsApi';
import { Button } from '../components/ui/button';
import type { AccommodationType } from '../types';

const TYPE_LABELS: Record<AccommodationType | string, string> = {
  HOTEL: 'Гостиница',
  HOSTEL: 'Хостел',
  GUESTHOUSE: 'Гостевой дом',
  APARTMENT: 'Апартаменты',
  CAMPING: 'Кемпинг',
  OTHER: 'Другое',
};

export default function AccommodationPage() {
  const { id } = useParams<{ id: string }>();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: accommodation, isLoading, isError } = useQuery({
    queryKey: ['accommodation', id],
    queryFn: () => accommodationsApi.getOne(id!),
    enabled: !!id,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['accommodation-reviews', id],
    queryFn: () => accommodationsApi.getReviews(id!),
    enabled: !!id,
  });

  const photos = accommodation?.photos ?? [];
  const reviews = reviewsData ?? accommodation?.reviews ?? [];
  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isError || !accommodation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground text-lg">Объект размещения не найден</p>
        <Button variant="ghost" asChild>
          <Link to="/">На главную</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero photos */}
      <div className="relative w-full bg-muted overflow-hidden" style={{ maxHeight: '480px' }}>
        {photos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 h-72 sm:h-96">
            {photos.slice(0, 6).map((photo, index) => (
              <div
                key={photo.id}
                className={`overflow-hidden cursor-pointer bg-muted ${index === 0 ? 'sm:row-span-2 sm:col-span-2' : ''}`}
                onClick={() => setLightboxIndex(index)}
              >
                <img
                  src={photo.thumbUrl || photo.url}
                  alt={`${accommodation.name} ${index + 1}`}
                  className="h-full w-full object-cover hover:scale-105 transition duration-500"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <BedDouble className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
        {photos.length > 6 && (
          <button
            className="absolute bottom-4 right-4 bg-black/60 text-white text-sm rounded-lg px-3 py-1.5 hover:bg-black/80 transition"
            onClick={() => setLightboxIndex(0)}
          >
            +{photos.length - 6} фото
          </button>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Back */}
        <Button variant="ghost" className="-ml-2" asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Назад
          </Link>
        </Button>

        {/* Title */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold">{accommodation.name}</h1>
            <span className="text-sm bg-primary/10 text-primary rounded-full px-3 py-1 shrink-0">
              {TYPE_LABELS[accommodation.type] ?? accommodation.type}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {accommodation.address && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4 shrink-0" />
                {accommodation.address}
              </span>
            )}
            {avgRating !== null && (
              <span className="flex items-center gap-1 text-amber-600 font-medium">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                {avgRating.toFixed(1)}
                <span className="text-muted-foreground font-normal">
                  ({reviews.length} {reviews.length === 1 ? 'отзыв' : reviews.length < 5 ? 'отзыва' : 'отзывов'})
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {accommodation.description && (
          <div className="rounded-2xl border border-border p-5">
            <h2 className="text-lg font-semibold mb-3">Описание</h2>
            <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">
              {accommodation.description}
            </p>
          </div>
        )}

        {/* All photos grid */}
        {photos.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Фотографии</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="aspect-video rounded-xl overflow-hidden bg-muted cursor-pointer"
                  onClick={() => setLightboxIndex(index)}
                >
                  <img
                    src={photo.thumbUrl || photo.url}
                    alt={`${accommodation.name} ${index + 1}`}
                    className="h-full w-full object-cover hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">Отзывы</h2>
              {avgRating !== null && (
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-2xl border border-border p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">{review.authorName}</p>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(review.createdAt).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' })}
                    </span>
                  </div>
                  {review.title && <p className="text-sm font-medium">{review.title}</p>}
                  <p className="text-sm leading-relaxed text-foreground/90">{review.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && photos.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition z-10"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            {lightboxIndex + 1} / {photos.length}
          </div>
          {lightboxIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>
          )}
          <img
            src={photos[lightboxIndex].url}
            alt={`${accommodation.name} ${lightboxIndex + 1}`}
            className="max-h-[90vh] max-w-[90vw] object-contain select-none"
            draggable={false}
            onClick={(e) => e.stopPropagation()}
          />
          {lightboxIndex < photos.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition"
            >
              <ChevronRight className="h-7 w-7" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
