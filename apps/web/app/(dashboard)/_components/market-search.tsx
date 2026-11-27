import Image from "next/image";
import Form from "next/form";

export function MarketSearch({ id, query = "", className }: { id: string; query?: string; className?: string }) {
  return (
    <Form action="/pasar" role="search" aria-label={id === "pencarian-global" ? "Pencarian saham global" : "Filter pasar"} className={className}>
      <div className="flex min-h-10 items-center gap-2 rounded-[10px] border border-solid border-landing-border bg-landing-card pl-3 focus-within:border-landing-badge-border">
        <Image src="/app-ui/search.svg" alt="" width={16} height={16} unoptimized />
        <label htmlFor={id} className="sr-only">Cari saham</label>
        <input id={id} type="search" name="q" defaultValue={query} placeholder="Cari saham" maxLength={80} className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-landing-text placeholder:text-landing-muted" />
        <button type="submit" className="min-h-10 cursor-pointer rounded-r-[10px] border-0 bg-transparent px-3 text-xs text-landing-muted hover:bg-landing-badge hover:text-landing-text">Cari</button>
      </div>
    </Form>
  );
}
