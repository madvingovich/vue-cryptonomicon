import {
  API_KEY,
  PRICE_UPDATE_TYPE,
  INVALID_SUB,
  BTC,
  PRICE_UPDATE,
  PRICE_ERROR,
  CONNECTED,
  BROADCAST_NAME,
  SOCKET_MESSAGE,
  CLOSE_MAIN_TAB,
  SUBSCRIBE,
} from './constants';

import {
  getTickerFromParameter,
  createSubscriptionObject,
  createUnsubscriptionObject,
} from './utils';

const tickers = new Map();
const bc = new BroadcastChannel(BROADCAST_NAME);
let socket = null;

let btcSubs = [];
let lastBtcPrice = null;
let isSubscribedToBtcUds = false;

bc.onmessage = (ev) => {
  const { type, data, fromPair, toPair } = JSON.parse(ev.data);
  if (type === SOCKET_MESSAGE) {
    !socket && onSocketAnswer(data);
  } else if (type === CLOSE_MAIN_TAB) {
    window.location.reload();
  } else if (type === SUBSCRIBE) {
    socket && sendToSocket(createSubscriptionObject(fromPair, toPair));
  }
};

const isSocketConnected = () => JSON.parse(localStorage.getItem(CONNECTED));

const onSocketAnswer = (data) => {
  const {
    TYPE: type,
    MESSAGE: message,
    PARAMETER: parameter,
    FROMSYMBOL: ticker,
    TOSYMBOL: toTicker,
    PRICE: price,
  } = data;

  if (message === INVALID_SUB) {
    const tickerName = getTickerFromParameter(parameter);
    if (btcSubs.includes(tickerName)) {
      notifySubscribers(tickerName, { type: PRICE_ERROR });
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
        notifySubscribers(ticker, {
          type: PRICE_UPDATE,
          value: price * lastBtcPrice,
        });
      }
    } else {
      if (ticker === BTC) {
        lastBtcPrice = price;
      }
      notifySubscribers(ticker, { type: PRICE_UPDATE, value: price });
    }
  }
};

const connectSocket = () => {
  socket = new WebSocket(
    `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
  );

  socket.onmessage = (e) => {
    const data = JSON.parse(e.data);
    bc.postMessage(JSON.stringify({ type: SOCKET_MESSAGE, data }));
    onSocketAnswer(data);
  };

  localStorage.setItem(CONNECTED, 'true');

  window.addEventListener('beforeunload', () => {
    localStorage.removeItem(CONNECTED);
    bc.postMessage(JSON.stringify({ type: CLOSE_MAIN_TAB }));
  });
};

if (!isSocketConnected()) {
  connectSocket();
}

const addSubscription = (fromPair, toPair = 'USD') => {
  bc.postMessage(JSON.stringify({ type: SUBSCRIBE, fromPair, toPair }));
  socket && sendToSocket(createSubscriptionObject(fromPair, toPair));
};

const removeSubscription = (fromPair, toPair = 'USD') => {
  socket && sendToSocket(createUnsubscriptionObject(fromPair, toPair));
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

const notifySubscribers = (ticker, data) => {
  const subscribers = Array.from(tickers.get(ticker) ?? []);
  subscribers.forEach((fn) => fn(data));
};

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
