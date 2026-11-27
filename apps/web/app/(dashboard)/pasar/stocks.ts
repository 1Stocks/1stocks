const stocks = [
  { name: "Apple", ticker: "AAPL", href: "/saham/apple" },
  { name: "Tesla", ticker: "TSLA" },
  { name: "NVIDIA", ticker: "NVDA" },
  { name: "Microsoft", ticker: "MSFT" },
  { name: "Alphabet", ticker: "GOOGL" },
  { name: "S&P 500 ETF", ticker: "SPY" },
  { name: "Amazon", ticker: "AMZN" },
] as const;

export function searchStocks(query: string) {
  const term = query.trim().toLowerCase();
  return stocks.filter(({ name, ticker }) =>
    `${name} ${ticker}`.toLowerCase().includes(term),
  );
}
