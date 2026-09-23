"use client";

import { useState } from "react";

type ClarificationResponse = {
  questions?: string[];
  error?: string;
};

export default function Home() {
  const [draft, setDraft] = useState("");
  const [submittedDraft, setSubmittedDraft] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleContinue() {
    if (isLoading) return;

    const text = draft.trim();

    if (text.length < 20) {
      setError("Опишите задачу подробнее — минимум 20 символов.");
      return;
    }

    setError("");

    if (questions.length > 0) {
      const confirmed = window.confirm(
        "Повторное уточнение заменит вопросы и удалит введённые ответы. Продолжить?"
      );

      if (!confirmed) return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/clarify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ draft: text }),
      });

      const data: ClarificationResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Не удалось получить вопросы."
        );
      }

      if (
        !Array.isArray(data.questions) ||
        !data.questions.every(
          (question) => typeof question === "string"
        )
      ) {
        throw new Error(
          "Получен некорректный ответ. Попробуйте ещё раз."
        );
      }

      setQuestions(data.questions);
      setAnswers(data.questions.map(() => ""));
      setSubmittedDraft(text);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Произошла ошибка. Попробуйте ещё раз."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleEdit() {
  setSubmittedDraft("");
  setError("");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="text-xl font-bold tracking-tight">
            Бизнесмен{" "}
            <span className="text-blue-600">Ивентс</span>
          </div>

          <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
            Кабинет бизнеса
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 md:py-16">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-sm font-semibold text-blue-700">
            {submittedDraft
              ? "Шаг 2 · Уточнение задачи"
              : "Шаг 1 · Описание задачи"}
          </p>

          <h1 className="text-3xl font-bold leading-tight md:text-5xl">
            Организуйте мероприятие вместе со студентами
          </h1>

          <p className="mt-5 text-lg leading-8 text-slate-600">
            Опишите идею. ИИ поможет определить, какие детали
            нужны команде для начала работы.
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[2fr_1fr]">
          <section
            aria-busy={isLoading}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
          >
            {!submittedDraft ? (
              <>
                <h2 className="text-2xl font-semibold">
                  Какая помощь вам нужна?
                </h2>

                <p
                  id="draft-hint"
                  className="mt-3 leading-7 text-slate-600"
                >
                  Расскажите о мероприятии и о том, что хотите
                  поручить студенческой команде.
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
                  disabled={isLoading}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    setError("");
                  }}
                  rows={8}
                  maxLength={5000}
                  aria-describedby={
                    error
                      ? "draft-hint draft-error"
                      : "draft-hint"
                  }
                  aria-invalid={Boolean(error)}
                  placeholder="Например: хотим провести открытый урок по ИИ для студентов. Площадку и спикера предоставим. Нужна команда для регистрации участников и координации мероприятия."
                  className="mt-3 w-full resize-y rounded-xl border border-slate-300 bg-slate-50 p-4 leading-7 placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                />

                <div className="mt-2 text-right text-sm text-slate-500">
                  {draft.length} / 5000
                </div>

                {error && (
                  <p
                    id="draft-error"
                    role="alert"
                    className="mt-4 rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-700"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!draft.trim() || isLoading}
                  className="mt-6 w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {isLoading
                    ? "Готовим вопросы..."
                    : "Уточнить задачу"}
                </button>

                {questions.length > 0 && !isLoading && (
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setSubmittedDraft(draft.trim());
                    }}
                    className="mt-3 block rounded-xl border border-slate-300 px-5 py-3 font-medium hover:bg-slate-100"
                  >
                    Вернуться к ответам
                  </button>
                )}

                {isLoading && (
                  <p
                    role="status"
                    className="mt-4 text-sm text-slate-500"
                  >
                    ИИ анализирует описание. Это может занять
                    несколько секунд.
                  </p>
                )}
              </>
            ) : (
              <div aria-live="polite">
                <h2 className="text-2xl font-semibold">
                  Уточним детали
                </h2>

                <details className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <summary className="cursor-pointer font-medium">
                    Ваше описание
                  </summary>

                  <p className="mt-3 whitespace-pre-wrap break-words leading-7 text-slate-600">
                    {submittedDraft}
                  </p>
                </details>

                {questions.length > 0 ? (
                  <div className="mt-6 space-y-6">
                    <p className="text-sm leading-6 text-slate-600">
                      Ответьте на вопросы. Если решение ещё не принято,
                      так и напишите — это поможет обозначить открытые условия.
                    </p>

                    {questions.map((question, index) => (
                      <div
                        key={`${index}-${question}`}
                        className="rounded-xl border border-slate-200 p-5"
                      >
                        <label
                          htmlFor={`answer-${index}`}
                          className="block font-medium leading-7 text-slate-900"
                        >
                          {index + 1}. {question}
                        </label>

                        <textarea
                          id={`answer-${index}`}
                          value={answers[index] ?? ""}
                          onChange={(event) => {
                            const value = event.target.value;

                            setAnswers((previous) =>
                              previous.map((answer, answerIndex) =>
                                answerIndex === index ? value : answer
                              )
                            );
                          }}
                          rows={3}
                          maxLength={1500}
                          placeholder="Введите ответ..."
                          className="mt-3 w-full resize-y rounded-xl border border-slate-300 bg-slate-50 p-4 leading-7 placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    ))}

                    <p className="text-sm font-medium text-blue-700">
                      Заполнено ответов:{" "}
                      {answers.filter((answer) => answer.trim().length > 0).length}
                      {" из "}
                      {questions.length}
                    </p>
                  </div>
                ) : (
                  <p className="mt-6 leading-7 text-slate-600">
                    ИИ не нашёл важных пробелов в описании.
                    Перед публикацией проверьте условия задачи.
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleEdit}
                  className="mt-8 rounded-xl border border-slate-300 px-5 py-3 font-medium transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
                >
                  Изменить описание
                </button>

                <p className="mt-5 text-sm leading-6 text-slate-500">
                  Описание и вопросы пока хранятся только на
                  этой странице и исчезнут при её обновлении.
                </p>
              </div>
            )}
          </section>

          <aside className="rounded-2xl bg-slate-900 p-6 text-white">
            <h2 className="text-xl font-semibold">
              Что важно для команды?
            </h2>

            <p className="mt-3 leading-7 text-slate-300">
              Чем понятнее условия, тем проще студентам
              оценить задачу и предложить план работы.
            </p>

            <ul className="mt-5 list-disc space-y-3 pl-5 leading-7 text-slate-200">
              <li>Цель мероприятия и аудитория</li>
              <li>Дата, формат и площадка</li>
              <li>Бюджет и оплата команды</li>
              <li>Ресурсы со стороны бизнеса</li>
              <li>Обязанности и ожидаемый результат</li>
            </ul>
          </aside>
        </div>
      </main>
    </div>
  );
}