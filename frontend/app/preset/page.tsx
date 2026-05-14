"use client";

import { useRouter } from "next/navigation";
import {
  PRESET_CHANGED_EVENT,
  PRESET_STORAGE_KEY,
  RISK_PRESETS,
} from "../lib/presets";

export default function PresetPage() {
  const router = useRouter();

  const startWithPreset = (presetId: string) => {
    localStorage.setItem(PRESET_STORAGE_KEY, presetId);
    window.dispatchEvent(new Event(PRESET_CHANGED_EVENT));
    router.push("/dashboard");
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl space-y-6 p-6">
      <section className="glass-card p-5">
        <h1 className="section-title text-2xl font-bold">投資性向プリセット</h1>
        <p className="mt-2 text-sm text-slate-600">
          積極成長型・均衡型・安定型のいずれかから、投資スタイルを選択して開始できます。
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {RISK_PRESETS.map((preset) => (
          <article key={preset.id} className="glass-card p-4">
            <h2 className="section-title text-lg font-semibold">{preset.label}</h2>
            <p className="mt-2 text-sm text-slate-600">{preset.description}</p>
            <ul className="mt-3 space-y-1 text-sm text-slate-700">
              {preset.allocations.map((item) => (
                <li key={`${preset.id}-${item.ticker}`}>
                  {item.ticker}: {item.ratio}%
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="apple-btn mt-4 w-full cursor-pointer px-4 py-2"
              onClick={() => startWithPreset(preset.id)}
            >
              このプリセットで開始
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}
