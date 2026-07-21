const PREFIX = 'animate-js:';

export function getPref(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function setPref(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // stockage indisponible (navigation privée, quota...) — on ignore, ce
    // n'est qu'une préférence de confort, pas une donnée du document.
  }
}
