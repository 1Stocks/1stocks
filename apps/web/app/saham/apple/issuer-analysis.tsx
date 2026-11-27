"use client";

import { useState } from "react";
import { appleIssuerProfiles } from "@1stocks/shared";

type Analysis = {
  status: "OK";
  model: string;
  points: { text: string; evidence: string[] }[];
  freshness: { id: string; fetchedAt: string; expiresAt: string }[];
};

const sources: Record<string, string> = {
  "quote-AAPLx": "Kuotasi LI.FI AAPLx",
  "quote-AAPLon": "Kuotasi LI.FI AAPLon",
  "profile-AAPLx": "Dokumen xStocks",
  "profile-AAPLon": "Dokumen Ondo",
  eligibility: "Pemeriksaan deterministik",
};
const documents: Record<string, string> = {
  "profile-AAPLx": appleIssuerProfiles.AAPLx.documentUrl,
  "profile-AAPLon": appleIssuerProfiles.AAPLon.documentUrl,
};
const time = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", timeStyle: "medium" });

export function IssuerAnalysis({ amount }: { amount: string }) {
  const [state, setState] = useState<"idle" | "loading" | "error" | Analysis>("idle");

  async function load() {
    setState("loading");
    try {
      const response = await fetch(`/api/analysis/apple?amountIdrx=${encodeURIComponent(amount)}`, {
        method: "POST", signal: AbortSignal.timeout(25_000),
      });
      const data = await response.json();
      setState(data.status === "OK" ? data : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <section className="grid justify-items-start gap-3 rounded-xl border border-solid border-landing-border bg-landing-card p-4" aria-label="Analisis AI">
      <h2>Analisis AI penerbit</h2>
      <p className="text-sm text-landing-muted">Penjelasan model berdasarkan kuotasi dan dokumen penerbit. Keputusan kelayakan tetap mengikuti pemeriksaan di atas.</p>
      {typeof state === "object" && (
        <>
          <ul className="m-0 grid gap-3 pl-5 text-sm">
            {state.points.map((point, index) => (
              <li key={index}>
                {point.text}
                <span className="mt-1 block text-xs text-landing-muted">
                  {point.evidence.map((id, i) => <span key={`${id}-${i}`}>{i > 0 && " · "}{documents[id]
                    ? <a href={documents[id]} target="_blank" rel="noreferrer" className="text-landing-accent underline!">{sources[id]}</a>
                    : sources[id]}</span>)}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-landing-muted">OpenAI {state.model} · {state.freshness.map(quote => `${sources[quote.id]} ${time.format(new Date(quote.fetchedAt))} WIB (berlaku hingga ${time.format(new Date(quote.expiresAt))} WIB)`).join(" · ")}. Penjelasan ini tidak menjadi dasar nasihat investasi.</p>
        </>
      )}
      {state === "error" && <p role="alert" className="text-sm">Analisis AI belum tersedia. Kamu tetap bisa membandingkan kuotasi.</p>}
      <button type="button" disabled={state === "loading"} onClick={load} className="rounded-lg border border-solid border-landing-border bg-landing-badge px-3 py-2 text-sm text-landing-accent!">
        {state === "loading" ? "Meminta analisis…" : typeof state === "object" ? "Perbarui analisis" : "Minta analisis AI"}
      </button>
    </section>
  );
}
