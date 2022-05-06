const API_KEY =
  '409dea7172697de942cd44745d23de93c799cec7d10538e3dc1501b8ad32e954';

const PRICE_UPDATE_TYPE = '5';
const INVALID_SUB = 'INVALID_SUB';
const BTC = 'BTC';

export const PRICE_UPDATE = 'PRICE_UPDATE';
export const PRICE_ERROR = 'PRICE_ERROR';

export const subscribeToTicker = (name, cb) => {
  if (cb) {
    if (tickers.has(name)) {
      tickers.set(name, [...tickers.get(name), cb]);
    } else {
      tickers.set(name, [cb]);
    }
  }
  if (name === BTC) {
    isSubscribedToBtcUds = true;
  }
  addSubscription(name);
};

export const unsubscribeFromTicker = (name) => {
  tickers.delete(name);
  if (name === BTC && isSubscribedToBtcUds && btcSubs.length) {
    return;
  }
  if (btcSubs.includes(name)) {
    removeTickerToBtcSubscription(name);
  } else {
    removeSubscription(name);
  }
};

const tickers = new Map();

let btcSubs = [];
let lastBtcPrice = null;
let isSubscribedToBtcUds = false;

const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);

const hasBtcPairSubscription = (name) => btcSubs.includes(name);

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
    TOSYMBOL: toTicker,
    PRICE: price,
  } = JSON.parse(e.data);

  if (message === INVALID_SUB) {
    const tickerName = getTickerFromParameter(parameter);
    if (hasBtcPairSubscription(tickerName)) {
      reportSubscribers(tickerName, { type: PRICE_ERROR });
    } else {
      subscribeToBtcPair(tickerName);
    }
  }
  if (type === PRICE_UPDATE_TYPE && price) {
    if (toTicker === BTC) {
      if (!isSubscribedToBtcUds) {
        subscribeToTicker(BTC);
      }
      if (isSubscribedToBtcUds && lastBtcPrice) {
        reportSubscribers(ticker, {
          type: PRICE_UPDATE,
          value: price * lastBtcPrice,
        });
      }
    } else {
      if (ticker === BTC) {
        lastBtcPrice = price;
      }
      reportSubscribers(ticker, { type: PRICE_UPDATE, value: price });
    }
  }
};

const sendToSocket = (message) => {
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

const createActionObject = (action, fromPair, toPair) => ({
  action,
  subs: [`5~CCCAGG~${fromPair}~${toPair}`],
});

const createSubscriptionObject = (fromPair, toPair) =>
  createActionObject('SubAdd', fromPair, toPair);

const createUnsubscriptionObject = (fromPair, toPair) =>
  createActionObject('SubRemove', fromPair, toPair);

const addSubscription = (fromPair, toPair = 'USD') =>
  sendToSocket(createSubscriptionObject(fromPair, toPair));

const removeSubscription = (fromPair, toPair = 'USD') =>
  sendToSocket(createUnsubscriptionObject(fromPair, toPair));

const subscribeToBtcPair = (name) => {
  addSubscription(name, BTC);
  btcSubs.push(name);
};

const unsubscribeFromBtcPair = (name) => {
  removeSubscription(name, BTC);
  btcSubs = btcSubs.filter((s) => s !== name);
};

const removeTickerToBtcSubscription = (name) => {
  unsubscribeFromBtcPair(name);
  if (!tickers.get(BTC) && !btcSubs.length) {
    removeSubscription(BTC);
    lastBtcPrice = null;
  }
};
