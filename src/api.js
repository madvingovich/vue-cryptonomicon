const get = (url) => fetch(url).then((d) => d.json());

export const loadCoinlist = () =>
  get('https://min-api.cryptocompare.com/data/all/coinlist?summary=true');

export const loadTickersPrices = (tickers) =>
  get(
    `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${tickers.join(
      ','
    )}&tsyms=USD`
  ).then((exchangeData) =>
    Object.fromEntries(
      Object.entries(exchangeData).map(([key, value]) => [key, value.USD])
    )
  );

const tickers = new Map();

const loadPrices = () => {
  const names = Array.from(tickers.keys());
  if (names.length) {
    loadTickersPrices(names).then((prices) => {
      Object.entries(prices).forEach(([key, value]) => {
        tickers.get(key).forEach((fn) => fn(value));
      });
    });
  }
};

setInterval(loadPrices, 5000);

export const subscribeToTicker = (name, cb) => {
  if (tickers.has(name)) {
    tickers.set(name, [...tickers.get(name), cb]);
  } else {
    tickers.set(name, [cb]);
  }
};

export const unsubscribeFromTicker = (name) => {
  tickers.delete(name);
};
