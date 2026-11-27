import type { Metadata } from "next";
import Link from "next/link";
import { pageTitle, panel } from "../_components/styles";

export const metadata: Metadata = { title: "Bantuan | 1Stocks" };

const questions = [
  {
    question: "Apa itu token saham?",
    answer: "Token saham memberi eksposur terhadap perubahan nilai saham acuan. Hak pemegang dan risikonya mengikuti ketentuan masing-masing penerbit.",
  },
  {
    question: "Bagaimana 1Stocks membandingkan penerbit Apple?",
    answer: "1Stocks meminta penawaran AAPLx dan AAPLon untuk nominal yang sama. Rekomendasi muncul jika data eksposur, kelayakan, dan biaya memenuhi syarat perbandingan.",
  },
  {
    question: "Apakah pratinjau membeli token Apple?",
    answer: "Pratinjau menampilkan estimasi jumlah token, biaya, dan ketentuan penerbit. Tahap ini tidak memindahkan dana atau token.",
  },
  {
    question: "Di mana saya bisa melihat alamat dompet?",
    answer: "Setelah masuk, alamat publik dompet Solana tersedia di menu Akun dan Pengaturan. Saldo SOL devnet hanya ditampilkan jika layanan pembacaan saldo terhubung.",
  },
  {
    question: "Apakah deposit, withdraw, dan jual sudah tersedia?",
    answer: "Ketiganya belum tersedia di demo ini. Kamu tetap bisa melihat estimasi pembelian Apple tanpa saldo rupiah.",
  },
] as const;

export default function HelpPage() {
  return (
    <div className="grid max-w-4xl gap-[18px]">
      <h1 className={pageTitle}>Bantuan</h1>
      <section aria-label="Pertanyaan umum" className={panel}>
        {questions.map(({ question, answer }) => (
          <details key={question} className="border-b border-solid border-landing-border last:border-0">
            <summary className="min-h-11 cursor-pointer py-3 font-medium text-white marker:text-landing-accent">{question}</summary>
            <p className="max-w-[70ch] pb-4 pl-4 text-sm text-landing-muted">{answer}</p>
          </details>
        ))}
      </section>
      <Link href="/#disclaimer" className="w-fit text-sm text-landing-accent hover:underline">Baca risiko dan disclaimer →</Link>
    </div>
  );
}
