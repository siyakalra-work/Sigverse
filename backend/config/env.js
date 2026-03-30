const DEFAULT_LOCAL_FRONTEND_URL = 'http://localhost:5173';

const splitEnvList = (value) =>
  (value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const getFrontendUrls = () => {
  const urls = splitEnvList(process.env.FRONTEND_URLS);

  if (process.env.FRONTEND_URL) {
    urls.unshift(process.env.FRONTEND_URL.trim());
  }

  return [...new Set(urls)].filter(Boolean);
};

const getPrimaryFrontendUrl = () => getFrontendUrls()[0] || DEFAULT_LOCAL_FRONTEND_URL;

module.exports = {
  DEFAULT_LOCAL_FRONTEND_URL,
  getFrontendUrls,
  getPrimaryFrontendUrl
};
