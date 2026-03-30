var Storage = (function () {
  var PREFIX = "psx-";

  function get(key) {
    try {
      var raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {
      // quota exceeded or private browsing
    }
  }

  function remove(key) {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch (e) {
      // ignore
    }
  }

  return { get: get, set: set, remove: remove };
})();
