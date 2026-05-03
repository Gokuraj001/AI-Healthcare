
export const DISPOSABLE_DOMAINS = [
  'mailinator.com',
  'guerrillamail.com',
  '10minutemail.com',
  'temp-mail.org',
  'trashmail.com',
  'getairmail.com',
  'yopmail.com',
  'sharklasers.com',
  'dispostable.com',
  'burnemail.com',
  'fakeinbox.com',
  'armyspy.com',
  'cuvox.de',
  'dayrep.com',
  'einrot.com',
  'fleckens.hu',
  'gustr.com',
  'jourrapide.com',
  'rhyta.com',
  'superrito.com',
  'teleworm.us',
  'trbvm.com',
  'tempmail.com',
  'maildrop.cc',
  'disposable.com',
  'proxymail.com',
  'spamgourmet.com',
  'anonaddy.com'
];

export const isDisposableEmail = (email: string): boolean => {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return true;
  return DISPOSABLE_DOMAINS.includes(domain);
};

export const isValidEmailFormat = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};
