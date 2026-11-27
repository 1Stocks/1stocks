import { formatAtomic } from "./saham/apple/quote-display";

const number = new Intl.NumberFormat("id-ID");
const rupiah = (value: bigint) => "Rp" + number.format(value);

export function estimateSample(input: string) {
  const raw = input.trim();
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)$/.test(raw)) return null;

  const amount = BigInt(raw.replaceAll(".", ""));
  if (amount < 10000n || amount > 100000000n) return null;

  const fee = (amount + 100n) / 200n;
  const microTokens = (amount - fee) / 4n;
  return { amount, fee, tokens: formatAtomic(microTokens.toString(), 6) };
}

export function setupEstimator(form: HTMLFormElement) {
  const main = form.closest("main");
  const input = form.querySelector<HTMLInputElement>("#nominal");
  const help = form.querySelector("#amount-help");
  const tokenOutput = form.querySelector("#estimate-tokens");
  const feeOutput = form.querySelector("#estimate-fee");
  const announcements = form.querySelector("#estimate-live");
  const reviewButton = form.querySelector<HTMLButtonElement>("button[type=submit]");
  const amountButtons = form.querySelectorAll<HTMLButtonElement>("button[data-amount]");
  const review = main?.querySelector<HTMLElement>("#order-review");
  const reviewTitle = review?.querySelector<HTMLElement>("#review-title");
  const reviewAmount = review?.querySelector("#review-amount");
  const reviewFee = review?.querySelector("#review-fee");
  const reviewTotal = review?.querySelector("#review-total");
  const reviewTokens = review?.querySelector("#review-tokens");
  const editOrder = review?.querySelector("#edit-order");
  const finishPreview = review?.querySelector("#finish-preview");
  const portfolio = main?.querySelector("#portofolio");
  const portfolioTitle = portfolio?.querySelector<HTMLElement>("#portfolio-title");
  const portfolioState = portfolio?.querySelector("#portfolio-state-title");
  const portfolioDetail = portfolio?.querySelector("#portfolio-state-detail");

  if (!input || !help || !tokenOutput || !feeOutput || !announcements || !reviewButton ||
      !review || !reviewTitle || !reviewAmount || !reviewFee || !reviewTotal || !reviewTokens ||
      !editOrder || !finishPreview || !portfolio || !portfolioTitle || !portfolioState || !portfolioDetail) return;

  const listeners = new AbortController();
  const options = { signal: listeners.signal };
  let announcementTimer: number | undefined;

  const update = (showEmptyError = false) => {
    const quote = estimateSample(input.value);
    const hasError = !quote && (showEmptyError || input.value.trim() !== "");
    const error = "Masukkan nominal antara Rp10.000 dan Rp100.000.000.";

    if (hasError) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");

    help.textContent = hasError ? error : "";
    tokenOutput.textContent = quote?.tokens ?? "—";
    feeOutput.textContent = quote ? rupiah(quote.fee) : "—";
    reviewButton.disabled = !quote;
    for (const button of amountButtons) {
      button.setAttribute("aria-pressed", String(button.dataset.amount === quote?.amount.toString()));
    }
    const message = quote ? `Estimasi ${quote.tokens} token. Biaya ${rupiah(quote.fee)}.` : help.textContent;
    window.clearTimeout(announcementTimer);
    announcementTimer = window.setTimeout(() => { announcements.textContent = message; }, 350);
  };

  const showInput = () => {
    review.hidden = true;
    form.hidden = false;
  };

  for (const button of amountButtons) {
    const preset = button.dataset.amount;
    if (!preset || !/^\d+$/.test(preset)) continue;
    button.addEventListener("click", () => {
      input.value = number.format(BigInt(preset));
      update();
    }, options);
  }

  input.addEventListener("input", () => update(), options);
  input.addEventListener("blur", () => {
    const quote = estimateSample(input.value);
    if (quote) input.value = number.format(quote.amount);
    else if (input.value.trim() === "") update(true);
  }, options);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const quote = estimateSample(input.value);

    if (!quote) {
      update(true);
      input.focus();
      return;
    }

    window.clearTimeout(announcementTimer);
    reviewAmount.textContent = rupiah(quote.amount);
    reviewFee.textContent = rupiah(quote.fee);
    reviewTotal.textContent = rupiah(quote.amount);
    reviewTokens.textContent = quote.tokens;
    form.hidden = true;
    review.hidden = false;
    reviewTitle.focus();
  }, options);

  editOrder.addEventListener("click", () => {
    showInput();
    input.focus();
  }, options);
  finishPreview.addEventListener("click", () => {
    portfolioState.textContent = "Pratinjau selesai";
    portfolioDetail.textContent = "Pratinjau ini tidak menarik rupiah atau mengirim token.";
    showInput();
    portfolioTitle.focus({ preventScroll: true });
    portfolio.scrollIntoView({ block: "start" });
  }, options);

  if (input.value !== input.defaultValue) update();

  return () => {
    listeners.abort();
    window.clearTimeout(announcementTimer);
  };
}
