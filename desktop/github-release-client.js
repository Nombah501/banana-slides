const https = require('https');

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function fetchGitHubText(hostname, requestPath, options = {}) {
  const {
    token = '',
    timeoutMs = 10000,
    userAgent = 'BananaSlides',
    accept = '*/*',
  } = options;

  return new Promise((resolve, reject) => {
    const headers = {
      Accept: accept,
      'User-Agent': userAgent,
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const req = https.get({
      hostname,
      path: requestPath,
      headers,
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => { chunks.push(chunk); });
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode !== 200) {
          reject(createHttpError(`GitHub request returned HTTP ${res.statusCode}`, res.statusCode));
          return;
        }
        resolve(body);
      });
    });

    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error('GitHub request timed out'));
    });
  });
}

async function fetchGitHubJson(requestPath, options = {}) {
  try {
    const body = await fetchGitHubText('api.github.com', requestPath, {
      ...options,
      accept: 'application/vnd.github+json',
    });
    return JSON.parse(body);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('GitHub API returned invalid JSON', { cause: error });
    }
    if (error?.statusCode) {
      error.message = `GitHub API returned HTTP ${error.statusCode}`;
    }
    throw error;
  }
}

function httpStatusFromError(error) {
  const explicitStatus = Number(error?.statusCode || error?.response?.statusCode);
  if (Number.isInteger(explicitStatus)) return explicitStatus;
  const message = String(error?.message || '');
  const match = message.match(/\b(?:HTTP\s+|status(?:Code)?\s*[:=]?\s*)(\d{3})\b/i)
    || message.match(/\b(\d{3})\b/);
  return match ? Number(match[1]) : null;
}

function isRateLimitedError(error) {
  return [403, 429].includes(httpStatusFromError(error));
}

function decodeXml(value) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function atomElement(entry, name) {
  const match = entry.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return match ? decodeXml(match[1]).trim() : '';
}

function atomAttribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, 'i'));
  return match ? decodeXml(match[1]) : '';
}

function parseAtomReleases(xml) {
  if (typeof xml !== 'string') {
    throw new Error('GitHub Atom feed returned invalid XML');
  }

  const releases = [];
  for (const match of xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)) {
    const entry = match[1];
    const title = atomElement(entry, 'title');
    const links = [...entry.matchAll(/<link\b[^>]*\/?>/gi)]
      .map((linkMatch) => linkMatch[0])
      .map((tag) => ({
        rel: atomAttribute(tag, 'rel'),
        href: atomAttribute(tag, 'href'),
      }))
      .filter((link) => link.href);
    const releaseLink = (
      links.find((link) => link.rel === 'alternate' && /\/releases\/tag\//i.test(link.href))
      || links.find((link) => /\/releases\/tag\//i.test(link.href))
      || links.find((link) => link.rel === 'alternate')
    )?.href || '';
    const tagMatch = releaseLink.match(/\/releases\/tag\/([^/?#]+)/i)
      || title.match(/\bv?\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?\b/);
    if (!tagMatch) continue;

    const tagName = decodeURIComponent(tagMatch[1] || tagMatch[0]);
    const publishedAt = atomElement(entry, 'published') || atomElement(entry, 'updated') || null;
    releases.push({
      tag_name: tagName,
      title,
      name: title,
      body: atomElement(entry, 'summary') || atomElement(entry, 'content'),
      html_url: releaseLink,
      published_at: publishedAt,
      assets: [],
      source: 'atom',
    });
  }
  return releases;
}

async function fetchGitHubReleaseAtom(owner, repository, options = {}) {
  const xml = await fetchGitHubText(
    'github.com',
    `/${owner}/${repository}/releases.atom`,
    { ...options, accept: 'application/atom+xml' },
  );
  return parseAtomReleases(xml);
}

async function fetchGitHubReleases(owner, repository, options = {}) {
  const {
    fetchPage = fetchGitHubJson,
    fetchAtom = fetchGitHubReleaseAtom,
    perPage = 100,
    ...requestOptions
  } = options;
  const releases = [];

  try {
    for (let page = 1; ; page += 1) {
      const payload = await fetchPage(
        `/repos/${owner}/${repository}/releases?per_page=${perPage}&page=${page}`,
        requestOptions,
      );
      if (!Array.isArray(payload)) {
        throw new Error('GitHub API returned an invalid releases response');
      }

      releases.push(...payload);
      if (payload.length < perPage) {
        return releases;
      }
    }
  } catch (error) {
    if (!isRateLimitedError(error)) throw error;
    return fetchAtom(owner, repository, requestOptions);
  }
}

module.exports = {
  fetchGitHubJson,
  fetchGitHubReleaseAtom,
  fetchGitHubReleases,
  httpStatusFromError,
  isRateLimitedError,
  parseAtomReleases,
};
