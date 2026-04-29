const PROFANITY: string[] = [
  'motherfucker', 'motherfucking', 'cocksucker', 'bullshit', 'horseshit',
  'dumbfuck', 'clusterfuck', 'fuckface', 'fuckwit', 'shithead',
  'shithole', 'shitfaced', 'asshole', 'asswipe', 'jackass',
  'dumbass', 'fatass', 'badass', 'hardass', 'smartass',
  'bitchass', 'fucking', 'fucker', 'fucked', 'nigger',
  'nigga', 'faggot', 'retard', 'retarded', 'whore',
  'slut', 'bitch', 'cunt', 'twat', 'fuck',
  'shit', 'damn', 'dick', 'cock', 'piss',
  'tits', 'ass', 'cum',
];

const sorted = [...PROFANITY].sort((a, b) => b.length - a.length);
const PROFANITY_RE = new RegExp(
  `\\b(${sorted.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
  'gi',
);

const ALLOWED_HOSTS = [
  'hivefive.app',
  'www.hivefive.app',
  'aptitude.cse.buffalo.edu',
  'cattle.cse.buffalo.edu',
  'localhost',
];

// Matches most URL patterns: http(s), www, or bare domain with path
const URL_RE =
  /\b(?:https?:\/\/|www\.)[^\s<>""'']+|(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:com|org|net|io|co|app|dev|me|info|biz|xyz|tv|gg|ly|to|link|click|site|online|store|shop|porn|xxx|sex|adult|onlyfans|fansly|chaturbate|xvideos|pornhub|xnxx|cam)\b(?:\/[^\s<>""'']*)?/gi;

function isAllowedUrl(url: string): boolean {
  try {
    const withProto = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const host = new URL(withProto).hostname.toLowerCase();
    return ALLOWED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

function maskWord(word: string): string {
  if (word.length <= 2) return '*'.repeat(word.length);
  if (word.length <= 3) return '***';
  return word[0] + '*'.repeat(word.length - 2) + word[word.length - 1];
}

export function sanitizeContent(text: string | null | undefined): string {
  if (!text) return text ?? '';

  let result = text;

  // Suppress external links (allow internal HiveFive URLs)
  URL_RE.lastIndex = 0;
  result = result.replace(URL_RE, (match) => isAllowedUrl(match) ? match : '[link removed]');

  // Mask profanity
  PROFANITY_RE.lastIndex = 0;
  result = result.replace(PROFANITY_RE, (match) => maskWord(match));

  return result;
}

export function containsProfanity(text: string): boolean {
  PROFANITY_RE.lastIndex = 0;
  return PROFANITY_RE.test(text);
}

export function containsExternalLink(text: string): boolean {
  URL_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = URL_RE.exec(text)) !== null) {
    if (!isAllowedUrl(match[0])) return true;
  }
  return false;
}
