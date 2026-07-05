export function ContactsPage() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Контакты</h1>
        <p className="text-2xl leading-relaxed">
          По всем вопросам пишите пожалуйста на{' '}
          <a href="mailto:newmailreg@ynadex.ru" className="underline underline-offset-4 hover:text-emerald-600 transition-colors">
            почту
          </a>
          .
        </p>
      </div>
    </div>
  );
}
