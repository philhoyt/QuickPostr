/**
 * WordPress REST API wrapper.
 *
 * Reads credentials from the auth context passed in as an argument.
 * Falls back to nonce/cookie auth if no Application Password is stored.
 */

const config = window.quickpostrConfig ?? {};

/**
 * Build the Authorization header value from stored credentials.
 *
 * @param {{ username: string, appPassword: string } | null} creds
 * @returns {Record<string, string>}
 */
function authHeaders(creds) {
  if (creds?.username && creds?.appPassword) {
    const token = btoa(`${creds.username}:${creds.appPassword}`);
    return { Authorization: `Basic ${token}` };
  }
  // Cookie auth fallback — nonce injected by the PHP app shell.
  if (config.nonce) {
    return { 'X-WP-Nonce': config.nonce };
  }
  return {};
}

/**
 * Core request function.
 *
 * @param {'GET'|'POST'|'PUT'|'DELETE'} method
 * @param {string} path  Relative to restUrl, e.g. '/wp/v2/posts'
 * @param {object|null} body
 * @param {object|null} creds
 * @param {object} [extraHeaders]
 * @returns {Promise<any>}
 */
async function request(method, path, body = null, creds = null, extraHeaders = {}) {
  const url    = (config.restUrl ?? '/wp-json/').replace(/\/$/, '') + path;
  const headers = {
    ...authHeaders(creds),
    ...extraHeaders,
  };

  // Don't set Content-Type for FormData (browser sets it with boundary).
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: response.statusText }));
    throw Object.assign(new Error(err.message ?? 'Request failed'), {
      status: response.status,
      data: err,
    });
  }

  // 204 No Content
  if (response.status === 204) return null;
  return response.json();
}

// ---------------------------------------------------------------------------
// Endpoint helpers — each accepts a `creds` object as the last argument.
// ---------------------------------------------------------------------------

export function getMe(creds) {
  return request('GET', '/wp/v2/users/me', null, creds);
}

export function createPost(data, creds) {
  return request('POST', '/wp/v2/posts', data, creds);
}

export function uploadMedia(file, creds) {
  const form = new FormData();
  form.append('file', file);
  return request(
    'POST',
    '/wp/v2/media',
    form,
    creds,
    { 'Content-Disposition': `attachment; filename="${encodeURIComponent(file.name)}"` }
  );
}

export function getPosts(creds) {
  return request('GET', '/wp/v2/posts?author=me&per_page=10', null, creds);
}

export function getCategories(creds) {
  return request('GET', '/wp/v2/categories?per_page=100', null, creds);
}

export function getTags(creds) {
  return request('GET', '/wp/v2/tags?per_page=100', null, creds);
}

/**
 * Fetch the QuickPostr feed for the current user.
 *
 * @param {{ format?: 'status'|'photo', perPage?: number, page?: number }} params
 * @param {object} creds
 */
export function getFeed({ format, perPage = 20, page = 1 } = {}, creds) {
  const params = new URLSearchParams({ per_page: perPage, page });
  if (format) params.set('format', format);
  return request('GET', `/quickpostr/v1/feed?${params}`, null, creds);
}
