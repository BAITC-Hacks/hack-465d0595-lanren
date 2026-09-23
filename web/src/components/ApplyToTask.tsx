"use client";

import { useRef, useState, type FormEvent } from "react";
import { getSupabase } from "@/lib/supabase";

export default function ApplyToTask({ taskId }: { taskId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [proposal, setProposal] = useState("");
  const [contact, setContact] = useState("");

  const [isSending, setIsSending] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const inFlight = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (inFlight.current || isSubmitted) return;

    const name = teamName.trim();
    const text = proposal.trim();
    const contactValue = contact.trim();

    if (
      name.length < 2 ||
      text.length < 20 ||
      contactValue.length < 3
    ) {
      setError(
        "Укажите название команды, контакт и предложение минимум из 20 символов."
      );
      return;
    }

    inFlight.current = true;
    setIsSending(true);
    setError("");

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
        throw new Error("Не удалось создать сессию.");
      }

      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .select("owner_id, status")
        .eq("id", taskId)
        .single();

      if (taskError || !task || task.status !== "published") {
        throw new Error("Задача больше не принимает отклики.");
      }

      if (task.owner_id === userId) {
        throw new Error(
          "Вы автор этой задачи. Для проверки отклика используйте другой браузер."
        );
      }

      const { error: insertError } = await supabase
        .from("applications")
        .insert({
          task_id: taskId,
          applicant_id: userId,
          team_name: name,
          proposal: text,
          contact: contactValue,
        });

      if (insertError) {
        if (insertError.code === "23505") {
          setIsSubmitted(true);
          return;
        }

        throw new Error(insertError.message);
      }

      setIsSubmitted(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Не удалось отправить отклик."
      );
    } finally {
      inFlight.current = false;
      setIsSending(false);
    }
  }

  const fieldClass =
    "mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 " +
    "focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100";

  const fieldId = `apply-${taskId}`;

  if (isSubmitted) {
    return (
      <p
        role="status"
        className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-800"
      >
        Ваш отклик уже сохранён. Заказчик сможет рассмотреть его
        и связаться с командой.
      </p>
    );
  }

  return (
    <div className="mt-5 border-t border-slate-200 pt-5">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        disabled={isSending}
        aria-expanded={isOpen}
        aria-controls={`${fieldId}-form`}
        className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isOpen ? "Свернуть форму" : "Откликнуться"}
      </button>

      {isOpen && (
        <form
          id={`${fieldId}-form`}
          onSubmit={handleSubmit}
          className="mt-5"
        >
          <fieldset disabled={isSending} className="min-w-0 space-y-4">
            <legend className="sr-only">Отклик команды</legend>

            <div>
              <label htmlFor={`${fieldId}-name`} className="font-medium">
                Название команды
              </label>
              <input
                id={`${fieldId}-name`}
                required
                minLength={2}
                maxLength={100}
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
                placeholder="Например: Campus Team"
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor={`${fieldId}-proposal`} className="font-medium">
                Опыт команды и план работы
              </label>
              <textarea
                id={`${fieldId}-proposal`}
                required
                minLength={20}
                maxLength={3000}
                rows={5}
                value={proposal}
                onChange={(event) => setProposal(event.target.value)}
                placeholder="Кто в команде, какой у вас опыт и как вы предлагаете выполнить задачу?"
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor={`${fieldId}-contact`} className="font-medium">
                Контакт для связи
              </label>
              <input
                id={`${fieldId}-contact`}
                required
                minLength={3}
                maxLength={200}
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                placeholder="Email или Telegram"
                className={fieldClass}
              />
              <p className="mt-2 text-sm text-slate-500">
                Контакт виден вам и автору задачи.
              </p>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {isSending ? "Отправляем..." : "Отправить отклик"}
            </button>
          </fieldset>
        </form>
      )}
    </div>
  );
}