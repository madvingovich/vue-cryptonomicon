const API_KEY =
  '409dea7172697de942cd44745d23de93c799cec7d10538e3dc1501b8ad32e954';

const PRICE_UPDATE_TYPE = '5';
const INVALID_SUB = 'INVALID_SUB';

export const PRICE_UPDATE = 'price_update';
export const PRICE_ERROR = 'price_error';

const get = (url) => fetch(url).then((d) => d.json());

export const loadCoinlist = () =>
  get('https://min-api.cryptocompare.com/data/all/coinlist?summary=true');

const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);

const getTickerFromParameter = (parameter) => parameter.split('~')[2];

const reportSubscribers = (ticker, data) => {
  const subscribers = Array.from(tickers.get(ticker) ?? []);
  subscribers.forEach((fn) => fn(data));
};

socket.onmessage = (e) => {
  const {
    TYPE: type,
    MESSAGE: message,
    PARAMETER: parameter,
    FROMSYMBOL: ticker,
    PRICE: price,
  } = JSON.parse(e.data);
  if (message === INVALID_SUB) {
    reportSubscribers(getTickerFromParameter(parameter), { type: PRICE_ERROR });
  }
  if (type === PRICE_UPDATE_TYPE && price) {
    reportSubscribers(ticker, { type: PRICE_UPDATE, value: price });
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
