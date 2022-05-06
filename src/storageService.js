export const createStorageService = (key, storage = localStorage) => ({
  get() {
    const data = storage.getItem(key);
    return data ? JSON.parse(data) : null;
  },
  set(value) {
    storage.setItem(key, JSON.stringify(value));
  },
});
