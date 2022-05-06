const API_KEY =
  '409dea7172697de942cd44745d23de93c799cec7d10538e3dc1501b8ad32e954';

const PRICE_UPDATE_TYPE = '5';

const get = (url) => fetch(url).then((d) => d.json());

export const loadCoinlist = () =>
  get('https://min-api.cryptocompare.com/data/all/coinlist?summary=true');

const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);

socket.onmessage = (e) => {
  const { TYPE: type, FROMSYMBOL: ticker, PRICE: price } = JSON.parse(e.data);
  if (type === PRICE_UPDATE_TYPE && price) {
    const subscribers = Array.from(tickers.get(ticker) ?? []);
    subscribers.forEach((fn) => fn(price));
  }
};

const sentToWs = (message) => {
  const stringifiedMessage = JSON.stringify(message);

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(stringifiedMessage);
  } else {
    socket.addEventListener(
      'open',
      () => socket.send(JSON.stringify(message)),
      {
        once: true,
      }
    );
  }
};

const tickers = new Map();

export const subscribeToTicker = (name, cb) => {
  if (tickers.has(name)) {
    tickers.set(name, [...tickers.get(name), cb]);
  } else {
    tickers.set(name, [cb]);
  }
  sentToWs({
    action: 'SubAdd',
    subs: [`5~CCCAGG~${name}~USD`],
  });
};

export const unsubscribeFromTicker = (name) => {
  tickers.delete(name);
  sentToWs({
    action: 'SubRemove',
    subs: [`5~CCCAGG~${name}~USD`],
  });
};
