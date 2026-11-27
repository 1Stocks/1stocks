import { panel } from "./_components/styles";

export default function DashboardLoading() {
  return <p role="status" className={`${panel} text-sm text-landing-muted`}>Memuat halaman…</p>;
}
