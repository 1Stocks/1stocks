function setupEstimator(form) {
  const input = form.querySelector("#nominal");
  const help = form.querySelector("#amount-help");
  const tokenOutput = form.querySelector("#estimate-tokens");
  const feeOutput = form.querySelector("#estimate-fee");
  const announcements = form.querySelector("#estimate-live");
  const reviewButton = form.querySelector("button[type=submit]");
  const amountButtons = form.querySelectorAll("[data-amount]");
  const review = document.querySelector("#order-review");
  const reviewTitle = review.querySelector("#review-title");
  const portfolio = document.querySelector("#portofolio");
  const portfolioTitle = portfolio.querySelector("#portfolio-title");
  const portfolioState = portfolio.querySelector("#portfolio-state-title");
  const portfolioDetail = portfolio.querySelector("#portfolio-state-detail");

  const number = new Intl.NumberFormat("id-ID");
  const units = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 6 });
  const rupiah = value => "Rp" + number.format(value);
  let announcementTimer;

  function estimate() {
    const raw = input.value.trim();
    const amount = Number(raw.replaceAll(".", ""));
    const valid = /^(?:\d+|\d{1,3}(?:\.\d{3})+)$/.test(raw) &&
      Number.isSafeInteger(amount) && amount >= 10000 && amount <= 100000000;

    if (!valid) return null;

    const fee = Math.round(amount / 200);
    const microTokens = Math.floor((amount - fee) / 4);
    return { amount, fee, tokens: units.format(microTokens / 1000000) };
  }

  function announce(message) {
    clearTimeout(announcementTimer);
    announcementTimer = setTimeout(() => {
      announcements.textContent = message;
    }, 350);
  }

  function update(showEmptyError = false) {
    const quote = estimate();
    const hasError = !quote && (showEmptyError || input.value.trim() !== "");
    const error = "Masukkan nominal antara Rp10.000 dan Rp100.000.000.";

    if (hasError) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");

    help.textContent = hasError ? error : "";
    tokenOutput.textContent = quote?.tokens ?? "—";
    feeOutput.textContent = quote ? rupiah(quote.fee) : "—";
    reviewButton.disabled = !quote;
    for (const button of amountButtons) {
      button.setAttribute("aria-pressed", String(Number(button.dataset.amount) === quote?.amount));
    }
    announce(quote ? `Estimasi ${quote.tokens} token. Biaya ${rupiah(quote.fee)}.` : help.textContent);
  }

  function showInput() {
    review.hidden = true;
    form.hidden = false;
  }

  for (const button of amountButtons) {
    button.addEventListener("click", () => {
      input.value = number.format(Number(button.dataset.amount));
      update();
    });
  }

  input.addEventListener("input", () => update());
  input.addEventListener("blur", () => {
    const quote = estimate();
    if (quote) input.value = number.format(quote.amount);
    else if (input.value.trim() === "") update(true);
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    const quote = estimate();

    if (!quote) {
      update(true);
      input.focus();
      return;
    }

    clearTimeout(announcementTimer);
    review.querySelector("#review-amount").textContent = rupiah(quote.amount);
    review.querySelector("#review-fee").textContent = rupiah(quote.fee);
    review.querySelector("#review-total").textContent = rupiah(quote.amount);
    review.querySelector("#review-tokens").textContent = quote.tokens;
    form.hidden = true;
    review.hidden = false;
    reviewTitle.focus();
  });

  function focusInput() {
    showInput();
    input.focus();
  }

  review.querySelector("#edit-order").addEventListener("click", focusInput);
  document.querySelector("#select-apple").addEventListener("click", event => {
    event.preventDefault();
    focusInput();
  });

  review.querySelector("#finish-preview").addEventListener("click", () => {
    portfolioState.textContent = "Pratinjau selesai";
    portfolioDetail.textContent = "Pratinjau ini tidak menarik rupiah atau mengirim token.";
    showInput();
    portfolioTitle.focus({ preventScroll: true });
    portfolio.scrollIntoView({ block: "start" });
  });

  if (input.value !== input.defaultValue) update();
}

const estimateForm = document.querySelector("#estimate-form");
if (estimateForm) setupEstimator(estimateForm);
