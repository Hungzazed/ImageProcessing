export function readCookie(name) {
  if (typeof document === 'undefined') return '';

  const entry = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));

  if (!entry) return '';
  return decodeURIComponent(entry.slice(name.length + 1));
}

export function clearCookie(name) {
  document.cookie = `${name}=; Max-Age=0; path=/`;
}
