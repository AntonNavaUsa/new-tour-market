import { useEffect, useRef } from 'react';

const TOURVISOR_SCRIPT_ID = 'tourvisor-module-script';

export function HotToursPage() {
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const existingScript = document.getElementById(TOURVISOR_SCRIPT_ID) as HTMLScriptElement | null;
    const script = existingScript ?? document.createElement('script');

    script.id = TOURVISOR_SCRIPT_ID;
    script.type = 'text/javascript';
    script.src = 'https://tourvisor.ru/module/init.js';
    script.async = true;

    if (!existingScript) {
      document.body.appendChild(script);
    }

    return () => {
      script.remove();
      if (formRef.current) {
        formRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <main className="min-h-[calc(100vh-3rem)] bg-gradient-to-b from-emerald-50/70 via-background to-background py-10 sm:py-14">
      <div className="container max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Выгодные предложения
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Горящие туры
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Выберите подходящее путешествие по специальной цене.
          </p>
        </div>

        <section
          className="mx-auto mt-8 max-w-5xl overflow-hidden rounded-xl border bg-card p-4 shadow-sm sm:mt-10 sm:p-8"
          aria-label="Горящие туры"
        >
          <div
            ref={formRef}
            className="tv-hot-tours w-full min-w-0 max-w-full overflow-x-auto tv-moduleid-9995356"
          />
        </section>
      </div>
    </main>
  );
}
