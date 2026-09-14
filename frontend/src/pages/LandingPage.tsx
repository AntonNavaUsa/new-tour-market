import { useNavigate } from 'react-router-dom';
import { Compass, Headphones, Search, ShieldCheck } from 'lucide-react';
import { TourSearchBar } from '../components/TourSearchBar';
import { useTourSearchForm } from '../lib/useTourSearchForm';

export function LandingPage() {
  const navigate = useNavigate();
  const searchForm = useTourSearchForm();

  const submit = () => {
    if (searchForm.validate()) {
      navigate('/tour-search', { state: { form: searchForm.form, autoSubmit: true } });
    }
  };

  return (
    <main className="min-h-[calc(100vh-3rem)] overflow-hidden bg-sky-500">
      <section className="relative isolate bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.16),transparent_38%),linear-gradient(125deg,transparent_40%,rgba(255,255,255,0.08)_40%,transparent_70%)]" />
        <div className="container relative py-8 sm:py-12 lg:py-16">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
                <Compass className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-extrabold leading-none">Сезон путешествий</p>
                <p className="mt-1 text-xs text-white/75">Путешествуйте с удовольствием</p>
              </div>
            </div>
            <div className="hidden items-center gap-5 text-sm font-semibold sm:flex">
              <span className="inline-flex items-center gap-2 text-white/90">
                <ShieldCheck className="h-4 w-4" /> Надёжные туроператоры
              </span>
              <span className="inline-flex items-center gap-2 text-white/90">
                <Headphones className="h-4 w-4" /> Помощь эксперта
              </span>
            </div>
          </header>

          <div className="mx-auto max-w-4xl pb-8 pt-16 text-center sm:pb-12 sm:pt-20">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-cyan-100">Ваш следующий отдых начинается здесь</p>
            <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Выбирайте путешествие сами
              <span className="block text-white/90">или доверьте подбор эксперту</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
              Сравните предложения туроператоров и найдите подходящий отдых по своим датам, бюджету и направлению.
            </p>
          </div>

          <section className="mx-auto max-w-7xl" aria-label="Поиск тура">
            <TourSearchBar
              form={searchForm.form}
              departures={searchForm.departures}
              countries={searchForm.countries}
              regions={searchForm.regions}
              meals={searchForm.meals}
              hotels={searchForm.hotels}
              isHotelsLoading={searchForm.isHotelsLoading}
              hotelSearch={searchForm.hotelSearch}
              onHotelSearchChange={searchForm.setHotelSearch}
              availableDates={searchForm.availableDates}
              isDeparturesLoading={searchForm.isDeparturesLoading}
              isCountriesLoading={searchForm.isCountriesLoading}
              isSearching={false}
              onUpdateForm={searchForm.updateForm}
              onChangeDeparture={searchForm.changeDeparture}
              onSubmit={submit}
              invalidField={searchForm.invalidField}
              validationNonce={searchForm.validationNonce}
            />
          </section>

          <div className="mx-auto mt-7 flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-semibold text-white/85">
            <span>Более 1000 направлений</span>
            <span>Актуальные цены</span>
            <span>Поддержка до и после покупки</span>
          </div>
        </div>
      </section>

      <section className="bg-white py-10 sm:py-14">
        <div className="container grid gap-4 sm:grid-cols-3">
          {[
            ['Подберём лучший вариант', 'Учитываем ваши даты, направление и состав путешественников.'],
            ['Сравним предложения', 'Покажем доступные отели и варианты размещения в одном месте.'],
            ['Поможем на каждом шаге', 'Эксперт ответит на вопросы и поможет оформить поездку.'],
          ].map(([title, text]) => (
            <article key={title} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <Search className="mb-4 h-5 w-5 text-orange-500" />
              <h2 className="font-bold text-slate-900">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}