export function normalizeURL(parentURL, childURL) {
    const matches = parentURL.match(/^(https?:\/\/[^/]+)/);
    const origDomain = matches && matches[0];

    return origDomain + childURL;
}
