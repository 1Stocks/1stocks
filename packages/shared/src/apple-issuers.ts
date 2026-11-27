import type { IssuerProfile } from "./quotes";
import type { AppleBuyToken } from "./tokens";

export const appleIssuerProfiles = {
  AAPLx: {
    documentUrl: "https://assets.backed.fi/products/apple-xstock",
    instrument: "Sertifikat pelacak saham Apple.",
    dividendTreatment: "Dividen bersih diinvestasikan kembali dan tercermin dalam penyesuaian saldo.",
    restriction: "Penerbitan dan penebusan langsung tersedia untuk klien yang memenuhi syarat.",
  },
  AAPLon: {
    documentUrl: "https://app.ondo.finance/assets/aaplon",
    instrument: "Token pelacak imbal hasil total Apple.",
    dividendTreatment: "Dividen bersih diinvestasikan kembali dan tercermin dalam penyesuaian saldo di Solana.",
    restriction: "Pencetakan dan penebusan langsung memerlukan onboarding dan kelayakan dari Ondo.",
  },
} as const satisfies Record<AppleBuyToken, IssuerProfile>;
