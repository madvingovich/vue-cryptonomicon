export const getTickerFromParameter = (parameter) => parameter.split('~')[2];

const createActionObject = (action, fromPair, toPair) => ({
  action,
  subs: [`5~CCCAGG~${fromPair}~${toPair}`],
});

export const createSubscriptionObject = (fromPair, toPair) =>
  createActionObject('SubAdd', fromPair, toPair);

export const createUnsubscriptionObject = (fromPair, toPair) =>
  createActionObject('SubRemove', fromPair, toPair);
