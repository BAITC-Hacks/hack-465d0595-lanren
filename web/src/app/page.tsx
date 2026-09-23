"use client";

import ReadinessScore from "@/components/ReadinessScore";
import { useEffect, useState } from "react";
import { z } from "zod";

type TaskCard = {
  title: string;
  description: string;
  missingInformation: string[];
};

const STORAGE_KEY = "businessman-events-draft-v1";

const SavedDraftSchema = z.object({
    draft: z.string(),
    step: z.enum(["draft", "questions"]),
    questions: z.array(z.string()),
    answers: z.array(z.string()),
    hasQuestions: z.boolean(),
    card: z
      .object({
        title: z.string(),
        description: z.string(),
        missingInformation: z.array(z.string()),
      })
      .nullable(),
    cardSource: z.string(),
});

export default function Home() {
  const [draft, setDraft] = useState("");
  const [step, setStep] = useState<"draft" | "questions">("draft");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [hasQuestions, setHasQuestions] = useState(false);

  const [card, setCard] = useState<TaskCard | null>(null);
  const [cardSource, setCardSource] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [error, setError] = useState("");
  const [isRestored, setIsRestored] = useState(false);
  const [storageError, setStorageError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (raw) {
        const result = SavedDraftSchema.safeParse(JSON.parse(raw));

        if (result.success) {
          const saved = result.data;

          setDraft(saved.draft);
          setStep(saved.hasQuestions ? saved.step : "draft");
          setQuestions(saved.questions);
          setAnswers(
            saved.questions.map((_, index) => saved.answers[index] ?? "")
          );
          setHasQuestions(saved.hasQuestions);
          setCard(saved.card);
          setCardSource(saved.cardSource);
        } else {
          setStorageError(
            "Не удалось восстановить сохранённый черновик."
          );
        }
      }
    } catch {
      setStorageError(
        "Не удалось прочитать черновик из хранилища браузера."
      );
    } finally {
      setIsRestored(true);
    }
  }, []);

  useEffect(() => {
    if (!isRestored) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          draft,
          step,
          questions,
          answers,
          hasQuestions,
          card,
          cardSource,
        })
      );
    } catch {
      setStorageError(
        "Автосохранение недоступно. Скопируйте важный текст перед закрытием страницы."
      );
    }
  }, [
    isRestored,
    draft,
    step,
    questions,
    answers,
    hasQuestions,
    card,
    cardSource,
  ]);

  const busy = !isRestored || isLoading || isImproving;

  const currentSource = JSON.stringify({
    draft: draft.trim(),
    answers: questions.map((question, index) => ({
      question,
      answer: (answers[index] ?? "").trim(),
    })),
  });

  const cardIsOutdated = Boolean(
    card && cardSource !== currentSource
  );

  async function handleClarify() {
    if (busy) return;

    if (draft.trim().length < 20) {
      setError("Опишите задачу подробнее — минимум 20 символов.");
      return;
    }

    if (
      hasQuestions &&
      !window.confirm(
        "Новые вопросы заменят текущие вопросы и ответы. Продолжить?"
      )
    ) {
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: draft.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Не удалось получить вопросы.");
      }

      if (
        !Array.isArray(data.questions) ||
        !data.questions.every(
          (item: unknown) => typeof item === "string"
        )
      ) {
        throw new Error("ИИ вернул некорректный список вопросов.");
      }

      setQuestions(data.questions);
      setAnswers(data.questions.map(() => ""));
      setHasQuestions(true);
      setStep("questions");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Не удалось получить вопросы."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleImprove() {
    if (busy) return;

    if (
      card &&
      !window.confirm(
        "ИИ создаст новую версию карточки из описания и ответов. " +
          "Ручные правки текущей карточки будут заменены. Продолжить?"
      )
    ) {
      return;
    }

    setError("");
    setIsImproving(true);

    // Keep the exact input used to generate this version.
    const source = currentSource;

    try {
      const response = await fetch("/api/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: source,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Не удалось улучшить описание.");
      }

      if (
        typeof data.title !== "string" ||
        typeof data.description !== "string" ||
        !Array.isArray(data.missingInformation) ||
        !data.missingInformation.every(
          (item: unknown) => typeof item === "string"
        )
      ) {
        throw new Error("ИИ вернул некорректную карточку.");
      }

      setCard({
        title: data.title,
        description: data.description,
        missingInformation: data.missingInformation,
      });
      setCardSource(source);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Не удалось улучшить описание."
      );
    } finally {
      setIsImproving(false);
    }
  }

  const fieldClass =
    "mt-2 w-full rounded-xl border border-slate-300 bg-white p-4 " +
    "leading-7 focus:border-blue-600 focus:outline-none " +
    "focus:ring-2 focus:ring-blue-100 disabled:opacity-60";

  const primaryButton =
    "rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white " +
    "hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

  const secondaryButton =
    "rounded-xl border border-slate-300 px-5 py-3 font-medium " +
    "hover:bg-slate-100 disabled:opacity-50";

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div className="text-xl font-bold">
            Бизнесмен <span className="text-blue-600">Ивентс</span>
          </div>

          <span className="text-sm text-slate-600">
            Кабинет бизнеса
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="text-3xl font-bold">
          Подготовьте задачу для студенческой команды
        </h1>

        <p className="mt-3 max-w-3xl leading-7 text-slate-600">
          Опишите мероприятие, уточните детали и проверьте
          подготовленную карточку.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl bg-red-50 p-4 text-red-700"
          >
            {error}
          </div>
        )}

        {(isLoading || isImproving) && (
          <p role="status" className="mt-5 text-blue-700">
            {isLoading
              ? "ИИ готовит уточняющие вопросы..."
              : "ИИ объединяет описание и ответы..."}
          </p>
        )}

        <fieldset disabled={busy} className="mt-8 min-w-0">
          <legend className="sr-only">
            Подготовка задачи
          </legend>

          <div className="grid items-start gap-6 lg:grid-cols-2">
            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6">
              {step === "draft" ? (
                <>
                  <h2 className="text-xl font-semibold">
                    1. Опишите мероприятие
                  </h2>

                  <label
                    htmlFor="draft"
                    className="mt-5 block font-medium"
                  >
                    Какая помощь вам нужна?
                  </label>

                  <textarea
                    id="draft"
                    value={draft}
                    onChange={(event) => {
                      setDraft(event.target.value);
                      setError("");
                    }}
                    rows={9}
                    maxLength={5000}
                    placeholder="Расскажите о мероприятии и задачах команды..."
                    className={fieldClass}
                  />

                  <p className="mt-2 text-right text-sm text-slate-500">
                    {draft.length} / 5000
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleClarify}
                      disabled={busy || !draft.trim()}
                      className={primaryButton}
                    >
                      {hasQuestions
                        ? "Обновить вопросы"
                        : "Уточнить задачу"}
                    </button>

                    {hasQuestions && (
                      <button
                        type="button"
                        onClick={() => {
                          setError("");
                          setStep("questions");
                        }}
                        className={secondaryButton}
                      >
                        Вернуться к ответам
                      </button>
                    )}
                  </div>

                  {hasQuestions && (
                    <p className="mt-4 text-sm leading-6 text-slate-500">
                      При включённом автосохранении ответы сохраняются в этом браузере
                    </p>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold">
                    2. Уточните детали
                  </h2>

                  <details className="mt-4 rounded-xl bg-slate-50 p-4">
                    <summary className="cursor-pointer font-medium">
                      Исходное описание
                    </summary>

                    <p className="mt-3 whitespace-pre-wrap break-words leading-7">
                      {draft}
                    </p>
                  </details>

                  <div className="mt-6 space-y-5">
                    {questions.map((question, index) => (
                      <div key={`${index}-${question}`}>
                        <label
                          htmlFor={`answer-${index}`}
                          className="block font-medium leading-7"
                        >
                          {index + 1}. {question}
                        </label>

                        <textarea
                          id={`answer-${index}`}
                          rows={3}
                          maxLength={1500}
                          value={answers[index] ?? ""}
                          onChange={(event) => {
                            const value = event.target.value;
                            setAnswers((previous) =>
                              previous.map((answer, answerIndex) =>
                                answerIndex === index ? value : answer
                              )
                            );
                          }}
                          placeholder="Введите ответ или укажите, что условие ещё не согласовано."
                          className={fieldClass}
                        />
                      </div>
                    ))}
                  </div>

                  <p className="mt-4 text-sm text-slate-600">
                    {questions.length > 0
                      ? `Заполнено ответов: ${
                          answers.filter((answer) => answer.trim()).length
                        } из ${questions.length}`
                      : "ИИ не нашёл важных пробелов. Можно подготовить карточку."}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleImprove}
                      disabled={busy}
                      className={primaryButton}
                    >
                      {isImproving
                        ? "Улучшаем описание..."
                        : "Улучшить описание"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setStep("draft");
                      }}
                      className={secondaryButton}
                    >
                      Изменить описание
                    </button>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-500">
                    Неизвестные условия можно оставить без ответа.
                    Они будут отмечены как требующие уточнения.
                  </p>
                </>
              )}
            </section>

            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold">
                Карточка задачи
              </h2>

              {!card ? (
                <p className="mt-4 leading-7 text-slate-600">
                  После уточнения нажмите «Улучшить описание».
                  Здесь появится текст, объединяющий вашу идею
                  и ответы на вопросы.
                </p>
              ) : (
                <>
                  {cardIsOutdated && (
                    <p
                      role="status"
                      className="mt-4 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900"
                    >
                      Исходные данные изменились. Эта карточка
                      создана по предыдущей версии. Повторно
                      нажмите «Улучшить описание», чтобы обновить её.
                    </p>
                  )}

                  <label
                    htmlFor="card-title"
                    className="mt-5 block font-medium"
                  >
                    Название задачи
                  </label>

                  <input
                    id="card-title"
                    value={card.title}
                    maxLength={200}
                    onChange={(event) => {
                      const title = event.target.value;
                      setCard((previous) =>
                        previous ? { ...previous, title } : previous
                      );
                    }}
                    className={fieldClass}
                  />

                  <label
                    htmlFor="card-description"
                    className="mt-5 block font-medium"
                  >
                    Полное описание
                  </label>

                  <textarea
                    id="card-description"
                    value={card.description}
                    rows={19}
                    maxLength={12000}
                    onChange={(event) => {
                      const description = event.target.value;
                      setCard((previous) =>
                        previous
                          ? { ...previous, description }
                          : previous
                      );
                    }}
                    className={fieldClass}
                  />

                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    Текст можно редактировать вручную.
                    Проверьте факты и обязанности перед публикацией.
                  </p>

                  <ReadinessScore
                    title={card.title}
                    description={card.description}
                  />

                  {card.missingInformation.length > 0 && (
                    <div className="mt-6 rounded-xl bg-amber-50 p-5">
                      <h3 className="font-semibold text-amber-900">
                        Требовало уточнения при генерации
                      </h3>

                      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-amber-900">
                        {card.missingInformation.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>

                      <p className="mt-3 text-sm text-amber-900">
                        Ручные правки не пересчитывают этот список.
                      </p>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </fieldset>

        <p
          role="status"
          className={`mt-6 text-sm ${
            storageError ? "text-red-700" : "text-slate-500"
          }`}
        >
          {storageError ||
            (isRestored
              ? "Черновик автоматически сохраняется в этом браузере. На других устройствах он пока недоступен."
              : "Восстанавливаем черновик...")}
        </p>
      </main>
    </div>
  );
}