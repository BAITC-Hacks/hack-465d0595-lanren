"use client";

import SiteHeader from "@/components/SiteHeader";
import ApplyToTask from "@/components/ApplyToTask";
import Link from "next/link";
import { useEffect, useState } from "react";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase";

const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  readiness_score: z.number().nullable(),
  created_at: z.string(),
});

type Task = z.infer<typeof TaskSchema>;

export default function CatalogPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadTasks() {
      setIsLoading(true);
      setError("");

      try {
        const supabase = getSupabase();

        const { data, error: queryError } = await supabase
          .from("tasks")
          .select(
            "id, title, description, readiness_score, created_at"
          )
          .eq("status", "published")
          .order("readiness_score", {
            ascending: false,
            nullsFirst: false,
          })
          .order("created_at", { ascending: false })
          .limit(50);

        if (queryError) {
          throw new Error(queryError.message);
        }

        const parsed = z.array(TaskSchema).safeParse(data);

        if (!parsed.success) {
          throw new Error("Получены некорректные данные задач.");
        }

        if (!cancelled) {
          setTasks(parsed.data);
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Не удалось загрузить каталог."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadTasks();

    return () => {
      cancelled = true;
    };
  }, [reloadCount]);

  return (
    <div className="min-h-screen">
      <SiteHeader active="catalog" />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="catalog-heading flex flex-wrap items-start justify-between gap-5">
          <div>
            <span className="eyebrow"><i /> КАТАЛОГ ВОЗМОЖНОСТЕЙ</span><h1 className="catalog-title">Найдите событие.<br /><em>Станьте его частью.</em></h1>

            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              Изучите мероприятия, условия и обязанности команды.
              Выберите задачу, которая подходит вашему опыту.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setReloadCount((value) => value + 1)}
            disabled={isLoading}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium hover:bg-slate-100 disabled:opacity-50"
          >
            {isLoading ? "Загружаем..." : "Обновить каталог"}
          </button>
        </div>

        {isLoading && (
          <p role="status" className="mt-8 text-slate-600">
            Загружаем опубликованные задачи...
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="mt-8 rounded-xl bg-red-50 p-5 text-red-700"
          >
            {error}
          </div>
        )}

        {!isLoading && !error && tasks.length === 0 && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8">
            <h2 className="text-xl font-semibold">
              Пока нет опубликованных задач
            </h2>

            <p className="mt-3 text-slate-600">
              После публикации первая карточка появится здесь.
            </p>

            <Link
              href="/"
              className="mt-5 inline-block font-medium text-blue-700"
            >
              Создать задачу
            </Link>
          </div>
        )}

        {!isLoading && !error && tasks.length > 0 && (
          <>
            <p className="mt-8 text-sm text-slate-500">
              Показано задач: {tasks.length}. Максимум — 50.
            </p>

            <div className="mt-4 grid items-start gap-6 md:grid-cols-2">
              {tasks.map((task) => (
                <article
                  key={task.id}
                  className="event-task min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                      Открытая задача
                    </span>

                    <span className="text-sm text-slate-500">
                      {task.readiness_score === null
                        ? "Рейтинг не сохранён"
                        : `Готовность: ${task.readiness_score}/100`}
                    </span>
                  </div>

                  <h2 className="mt-5 break-words text-xl font-semibold">
                    {task.title}
                  </h2>

                  <p className="mt-3 whitespace-pre-wrap break-words leading-7 text-slate-600">
                    {task.description.length > 240
                      ? `${task.description.slice(0, 240)}…`
                      : task.description}
                  </p>

                  <details className="mt-5 border-t border-slate-200 pt-4">
                    <summary className="cursor-pointer font-medium text-blue-700">
                      Полное описание
                    </summary>

                    <p className="mt-4 whitespace-pre-wrap break-words leading-7 text-slate-700">
                      {task.description}
                    </p>
                  </details>

                  <p className="mt-5 text-sm text-slate-500">
                    Опубликовано:{" "}
                    {new Date(task.created_at).toLocaleDateString(
                      "ru-RU",
                      { timeZone: "Asia/Almaty" }
                    )}
                  </p>
                  <ApplyToTask taskId={task.id} />
                </article>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}