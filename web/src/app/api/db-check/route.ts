import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return NextResponse.json(
      {
        ok: false,
        message: "Проверьте настройки Supabase в .env.local.",
      },
      { status: 503 }
    );
  }

  try {
    const supabase = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { error } = await supabase
      .from("tasks")
      .select("id")
      .eq("status", "published")
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          message: "Не удалось прочитать таблицу tasks.",
          code: error.code,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Подключение к Supabase работает. Таблица tasks доступна.",
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Проверьте URL проекта Supabase и подключение к сети.",
      },
      { status: 502 }
    );
  }
}