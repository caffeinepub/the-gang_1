export function parseTranscript(text: string): string {
  if (!text) return '';

  // Strip all HTML table tags
  let sanitized = text
    .replace(/<\/?table[^>]*>/gi, '')
    .replace(/<\/?tbody[^>]*>/gi, '')
    .replace(/<\/?thead[^>]*>/gi, '')
    .replace(/<\/?tr[^>]*>/gi, '')
    .replace(/<\/?td[^>]*>/gi, '')
    .replace(/<\/?th[^>]*>/gi, '');

  // Convert product links to anchor tags
  // Match URLs (http/https)
  sanitized = sanitized.replace(
    /(https?:\/\/[^\s<]+)/gi,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80">$1</a>'
  );

  // Match markdown-style links [text](url)
  sanitized = sanitized.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/gi,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80">$1</a>'
  );

  return sanitized;
}
