const API_KEY =
  '409dea7172697de942cd44745d23de93c799cec7d10538e3dc1501b8ad32e954';

const PRICE_UPDATE_TYPE = '5';
const INVALID_SUB = 'INVALID_SUB';
const BTC = 'BTC';

export const PRICE_UPDATE = 'price_update';
export const PRICE_ERROR = 'price_error';

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
      if (isSubscribedToBtcUds) {
        lastBtcPrice &&
          reportSubscribers(ticker, {
            type: PRICE_UPDATE,
            value: price * lastBtcPrice,
          });
      } else {
        subscribeToTicker(BTC);
      }
    } else {
      if (ticker === BTC) {
        lastBtcPrice = price;
      }
      reportSubscribers(ticker, { type: PRICE_UPDATE, value: price });
    }
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
  sentToWs({
    action: 'SubAdd',
    subs: [`5~CCCAGG~${name}~USD`],
  });
};

export const unsubscribeFromTicker = (name) => {
  tickers.delete(name);
  if (name === BTC && isSubscribedToBtcUds && btcSubs.length) {
    return;
  }
  if (btcSubs.includes(name)) {
    btcSubs = btcSubs.filter((s) => s !== name);
    sentToWs({
      action: 'SubRemove',
      subs: [`5~CCCAGG~${name}~BTC`],
    });
    if (!tickers.get(BTC) && !btcSubs.length) {
      sentToWs({
        action: 'SubRemove',
        subs: [`5~CCCAGG~${BTC}~USD`],
      });
      lastBtcPrice = null;
    }
  }
  sentToWs({
    action: 'SubRemove',
    subs: [`5~CCCAGG~${name}~USD`],
  });
};

const subscribeToBtcPair = (name) => {
  sentToWs({
    action: 'SubAdd',
    subs: [`5~CCCAGG~${name}~BTC`],
  });
  btcSubs.push(name);
};
