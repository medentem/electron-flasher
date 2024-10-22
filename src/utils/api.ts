export function createUrl(relativeUrl: string) {
  let host = window.location.host;
  if (relativeUrl.startsWith("api")) {
    host = "api.meshtastic.org";
    relativeUrl = relativeUrl.replace("api/", "");
  }
  const base = `${window.location.protocol}//${host}`;
  const fullUrl = `${base}/${relativeUrl}`;
  console.info(`API URL: ${fullUrl}`);
  return fullUrl;
}
