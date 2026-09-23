"use client";

import { useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase";

type Props = {
  title: string;
  description: string;
  disabled?: boolean;
};

export default function PublishTask({
  title,
  description,
  disabled = false,
}: Props) {
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState("");
  const [published, setPublished] = useState<{
    id: string;
    source: string;
  } | null>(null);

  const inFlight = useRef(false);

  const currentSource = JSON.stringify({
    title: title.trim(),
    description: description.trim(),
  });

  async function handlePublish() {
    if (inFlight.current || published || disabled) return;

    const taskTitle = title.trim();
    const taskDescription = description.trim();

    if (
      taskTitle.length < 1 ||
      taskTitle.length > 200 ||
      taskDescription.length < 20 ||
      taskDescription.length > 12000
    ) {
      setError(
        "Название: 1–200 символов. Описание: 20–12000 символов."
      );
      return;
    }

    inFlight.current = true;
    setIsPublishing(true);
    setError("");

    const snapshot = currentSource;

    try {
      const supabase = getSupabase();

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      let userId = sessionData.session?.user.id;

      if (!userId) {
        const { data, error: signInError } =
          await supabase.auth.signInAnonymously();

        if (signInError) throw signInError;

        userId = data.user?.id;
      }

      if (!userId) {
        throw new Error("Не удалось создать пользовательскую сессию.");
      }

      const { data, error: insertError } = await supabase
        .from("tasks")
        .insert({
          owner_id: userId,
          title: taskTitle,
          description: taskDescription,
          status: "published",
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      if (!data) {
        throw new Error("Сервер не подтвердил публикацию.");
      }

      setPublished({
        id: data.id,
        source: snapshot,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "object" &&
              error !== null &&
              "message" in error
            ? String(error.message)
            : "Не удалось опубликовать задачу.";

      setError(message);
    } finally {
      inFlight.current = false;
      setIsPublishing(false);
    }
  }

  return (
    <section className="mt-6 border-t border-slate-200 pt-6">
      <h3 className="text-lg font-semibold">
        Публикация задачи
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        Название и описание станут доступны другим пользователям.
        Проверьте условия перед публикацией.
      </p>

      <button
        type="button"
        onClick={handlePublish}
        disabled={disabled || isPublishing || Boolean(published)}
        className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPublishing
          ? "Публикуем..."
          : published
            ? "Задача опубликована"
            : "Опубликовать задачу"}
      </button>

      {disabled && !published && (
        <p className="mt-3 text-sm text-amber-800">
          Обновите карточку: исходные ответы изменились.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {published && (
        <p
          role="status"
          className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-800"
        >
          Карточка сохранена в базе и опубликована.
        </p>
      )}

      {published && published.source !== currentSource && (
        <p className="mt-3 text-sm text-amber-800">
          Вы изменили локальный текст. Эти изменения ещё
          не внесены в опубликованную карточку.
        </p>
      )}
    </section>
  );
}