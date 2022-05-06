export const urlService = {
  getSearchParams(names = []) {
    const entries = Array.from(
      new URL(window.location.href).searchParams.entries()
    );

    return Object.fromEntries(entries.filter(([key]) => names.includes(key)));
  },
  setSearchParams(params) {
    const url = new URL(window.location.href);

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    window.history.pushState(null, document.title, url.href);
  },
};
