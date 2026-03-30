const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

export const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL?.trim();
  if (envUrl) return trimTrailingSlash(envUrl);

  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }

    return trimTrailingSlash(origin);
  }

  return 'http://localhost:3000';
};
