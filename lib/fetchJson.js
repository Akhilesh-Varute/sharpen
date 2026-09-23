// A fetch() that actually throws on failure. Plain fetch().then(r => r.json())
// (used everywhere in this app) silently swallows non-2xx responses -- the
// promise still resolves, json() either parses an {error: "..."} body or
// throws on unparseable output, and callers doing `res.things || []` end up
// rendering an empty list with no sign anything went wrong. That's exactly
// what happened when a query referenced a column that didn't exist yet on
// production: the page just looked empty instead of failing loudly.
export async function fetchJson(url, options) {
  const res = await fetch(url, options);
  let body = null;
  try {
    body = await res.json();
  } catch {
    // non-JSON error page/body -- fall through, res.ok check below still
    // reports the failure with whatever we have.
  }
  if (!res.ok) {
    throw new Error(body?.error || `Request failed (${res.status})`);
  }
  return body;
}
