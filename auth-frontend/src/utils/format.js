export function maskEmail(email = '') {
  const [name = '', domain = ''] = email.split('@');
  if (!name || !domain) return email;

  if (name.length <= 2) return `${name[0] || ''}*@${domain}`;
  return `${name.slice(0, 2)}***@${domain}`;
}
