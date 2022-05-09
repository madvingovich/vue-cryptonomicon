const get = (url) => fetch(url).then((d) => d.json());

export const loadCoinlist = () =>
  get('https://min-api.cryptocompare.com/data/all/coinlist?summary=true');
