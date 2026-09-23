"use client";

import { useState } from "react";
import { z } from "zod";

const ResultSchema = z.object({
  score: z.number().min(0).max(100),
  items: z.array(
    z.object({
      label: z.string(),
      max: z.number(),
      points: z.number(),
      explanation: z.string(),
    })
  ),
});

type Evaluation = z.infer<typeof ResultSchema>;

type Props = {
  title: string;
  description: string;
};

export default function ReadinessScore({
  title,
  description,
}: Props) {
  const [result, setResult] = useState<Evaluation | null>(null);
  const [evaluatedText, setEvaluatedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const currentText = JSON.stringify({ title, description });
  const outdated = Boolean(result && evaluatedText !== currentText);

  async function handleEvaluate() {
    if (isLoading) return;

    setIsLoading(true);
    setError("");

    // Remember exactly which card version is being evaluated.
    const snapshot = currentText;

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: snapshot,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Не удалось оценить карточку.");
      }

      const parsed = ResultSchema.safeParse(data);

      if (!parsed.success) {
        throw new Error("Получен некорректный результат оценки.");
      }

      setResult(parsed.data);
      setEvaluatedText(snapshot);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Не удалось оценить карточку."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
      <h3 className="text-lg font-semibold">
        Готовность задачи
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        Оценка полноты и ясности описания, а не гарантия
        успешного проведения мероприятия.
      </p>

      <button
        type="button"
        onClick={handleEvaluate}
        disabled={
          isLoading ||
          !title.trim() ||
          description.trim().length < 20
        }
        className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading
          ? "Оцениваем..."
          : result
            ? "Пересчитать рейтинг"
            : "Оценить готовность"}
      </button>

      {isLoading && (
        <p role="status" className="mt-3 text-sm text-blue-700">
          Проверяем восемь критериев...
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {outdated && (
        <p
          role="status"
          className="mt-4 rounded-lg bg-amber-100 p-3 text-sm text-amber-900"
        >
          Карточка изменилась. Пересчитайте рейтинг для нового текста.
        </p>
      )}

      {result && !outdated && (
        <div aria-live="polite">
          <p className="mt-6 text-4xl font-bold text-blue-700">
            {result.score}
            <span className="text-lg text-slate-500"> / 100</span>
          </p>

          <progress
            value={result.score}
            max={100}
            aria-label="Готовность задачи"
            className="mt-3 h-3 w-full accent-blue-600"
          />

          <ul className="mt-5 space-y-4">
            {result.items.map((item) => (
              <li
                key={item.label}
                className="rounded-lg bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-medium">{item.label}</span>
                  <span className="shrink-0 font-semibold text-blue-700">
                    {item.points}/{item.max}
                  </span>
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.explanation}
                </p>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-sm leading-6 text-slate-500">
            Нет информации — 0 баллов. Частично — половина.
            Достаточно конкретики — полный балл.
            Интерпретацию текста ИИ стоит проверить.
          </p>
        </div>
      )}
    </section>
  );
}