import Link from "next/link";
import { notFound } from "next/navigation";
import { availabilityLabels, catalog, catalogAvailability, catalogDeployments, issuers } from "../../../../../../packages/asset-catalog/registry/catalog";
import { pageTitle, panel } from "../../_components/styles";

export default async function CatalogDetail({ params }: { params: Promise<{ asset: string }> }) {
  const { asset } = await params;
  const item = catalog.find(entry => entry.id === asset);
  if (!item) notFound();
  return (
    <div className="grid max-w-4xl gap-4">
      <Link href="/pasar" className="text-sm text-landing-accent">← Pasar</Link>
      <h1 className={pageTitle}>{item.name} ({item.ticker})</h1>
      {item.id === "us0378331005" && <Link href="/saham/apple" className="text-landing-accent">Buka pratinjau Apple →</Link>}
      <p className="text-sm text-landing-muted">Katalog resmi. Kelayakan pengguna, hak ekonomi dan likuiditas perlu diverifikasi sebelum penerbit dapat dibandingkan.</p>
      {Object.entries(issuers).map(([id, issuer]) => {
        const products = item.products.filter(product => product.issuer === id);
        return (
          <section key={id} className={`${panel} grid gap-3`}>
            <h2 className="font-semibold">{issuer.name}</h2>
            <p className="text-sm text-landing-muted">{issuer.legalEntity}</p>
            {products.length === 0 && <p className="text-sm">Produk belum tersedia dari penerbit ini di katalog terverifikasi.</p>}
            {products.map(product => (
              <div key={product.symbol} className="grid gap-1 text-sm">
                <p>{product.symbol} · {availabilityLabels[catalogAvailability(product)]}</p>
                {catalogDeployments(product).map(token => (
                  <div key={token.id} className="grid gap-1 text-landing-muted">
                    <p>{token.network.label}{token.network.environment === "mainnet" && " mainnet"} · {token.standard} · {token.quoteMode ? "Pratinjau kuotasi" : "Tercatat di katalog"}</p>
                    <code className="wrap-anywhere text-xs">{token.address}</code>
                  </div>
                ))}
                <p className="text-xs text-landing-muted">Diperiksa {product.verifiedAt.slice(0, 10)} · <a href={product.source} className="text-landing-accent hover:underline">Sumber penerbit</a></p>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
