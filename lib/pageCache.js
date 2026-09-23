// A tiny in-memory cache, module-scoped so it survives client-side
// navigation between tabs (Next's App Router keeps the JS running between
// route changes -- it's not a full page reload) but resets on an actual
// page refresh, which is fine: this is a "don't re-show a spinner for data
// you just had" cache, not a durable one.
//
// The pattern every page uses: on mount, if something's cached for this
// key, render it immediately (no spinner) and kick off a fresh fetch in
// the background; if nothing's cached, show the spinner like before. This
// is why switching Today -> Habits -> Today used to reload every time even
// though nothing had changed -- each page wiped its own state on mount and
// started over from zero.
const cache = new Map();

export function getCache(key) {
  return cache.get(key);
}

export function setCache(key, value) {
  cache.set(key, value);
}
