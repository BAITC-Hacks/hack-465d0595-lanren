"use client";

import { useState } from "react";

export default function Home() {
  const [draft, setDraft] = useState("");
  const [submittedDraft, setSubmittedDraft] = useState("");
  const [error, setError] = useState("");

  function handleContinue() {
    const text = draft.trim();

    if (text.length < 20) {
      setError("Опишите задачу подробнее — минимум 20 символов.");
      return;
    }

    setError("");
    setSubmittedDraft(text);
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="text-xl font-bold tracking-tight">
            SANA<span className="text-blue-600"> EVENTS</span>
          </div>

          <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
            Кабинет бизнеса
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 md:py-16">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-sm font-semibold text-blue-700">
            Новая задача
          </p>

          <h1 className="text-3xl font-bold leading-tight md:text-5xl">
            Организуйте мероприятие вместе со студентами
          </h1>

          <p className="mt-5 text-lg leading-8 text-slate-600">
            Опишите свою идею. Поможем превратить её в понятную
            задачу для студенческой команды.
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[2fr_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            {!submittedDraft ? (
              <>
                <h2 className="text-2xl font-semibold">
                  Какая помощь вам нужна?
                </h2>

                <p
                  id="draft-hint"
                  className="mt-3 leading-7 text-slate-600"
                >
                  Расскажите, какое мероприятие вы планируете
                  и что хотите поручить студенческой команде.
                </p>

                <label
                  htmlFor="draft"
                  className="mt-6 block font-medium"
                >
                  Первоначальное описание задачи
                </label>

                <textarea
                  id="draft"
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    setError("");
                  }}
                  rows={8}
                  maxLength={5000}
                  aria-describedby={
                    error ? "draft-hint draft-error" : "draft-hint"
                  }
                  aria-invalid={Boolean(error)}
                  placeholder="Например: хотим провести открытый урок по ИИ для студентов в нашем учебном центре. Площадку и спикера предоставим. Нужна команда для регистрации участников и координации мероприятия."
                  className="mt-3 w-full resize-y rounded-xl border border-slate-300 bg-slate-50 p-4 leading-7 placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />

                <div className="mt-2 text-right text-sm text-slate-500">
                  {draft.length} / 5000
                </div>

                {error && (
                  <p
                    id="draft-error"
                    role="alert"
                    className="mt-3 text-sm text-red-700"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!draft.trim()}
                  className="mt-6 w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  Продолжить
                </button>
              </>
            ) : (
              <div aria-live="polite">
                <p className="text-sm font-semibold text-blue-700">
                  Первоначальное описание
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Черновик вашей задачи
                </h2>

                <div className="mt-6 whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-slate-50 p-5 leading-8">
                  {submittedDraft}
                </div>

                <p className="mt-5 text-sm leading-6 text-slate-600">
                  Пока черновик хранится только на этой странице
                  и исчезнет при обновлении. Уточняющие вопросы
                  от ИИ добавим на следующем этапе.
                </p>

                <button
                  type="button"
                  onClick={() => setSubmittedDraft("")}
                  className="mt-6 rounded-xl border border-slate-300 px-5 py-3 font-medium transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
                >
                  Изменить описание
                </button>
              </div>
            )}
          </section>

          <aside className="rounded-2xl bg-slate-900 p-6 text-white">
            <h2 className="text-xl font-semibold">
              С чего начать?
            </h2>

            <p className="mt-3 leading-7 text-slate-300">
              Необязательно знать все детали заранее.
              Напишите то, что уже известно:
            </p>

            <ul className="mt-5 list-disc space-y-3 pl-5 leading-7 text-slate-200">
              <li>Цель мероприятия и аудитория</li>
              <li>Планируемая дата и площадка</li>
              <li>Ресурсы, которые предоставит бизнес</li>
              <li>Задачи студенческой команды</li>
            </ul>
          </aside>
        </div>
      </main>
    </div>
  );
}