/**
 * Brand glyphs. lucide v1 dropped third-party logos, so these are drawn
 * inline — no extra dependency, and they inherit currentColor.
 */

type P = { className?: string };

export function InstagramIcon({ className }: P) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TikTokIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.5 2h-2.8v13.1a2.5 2.5 0 1 1-2.1-2.47V9.76a5.6 5.6 0 1 0 5 5.57V8.9a6.6 6.6 0 0 0 3.9 1.26V7.3a3.73 3.73 0 0 1-2.76-1.3A3.86 3.86 0 0 1 16.5 3.4z" />
    </svg>
  );
}

export function WhatsAppIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 14.95L2 22l5.2-1.5A9.9 9.9 0 1 0 12.04 2m0 1.8a8.1 8.1 0 1 1-4.1 15.08l-.3-.17-3.07.88.9-3-.2-.31A8.1 8.1 0 0 1 12.04 3.8m-3.1 4c-.16 0-.42.06-.64.3-.22.24-.85.83-.85 2.02s.87 2.34.99 2.5c.12.16 1.7 2.72 4.2 3.7 2.08.82 2.5.66 2.95.62.45-.04 1.46-.6 1.66-1.17.2-.58.2-1.07.15-1.18-.06-.1-.22-.16-.46-.28s-1.46-.72-1.68-.8c-.23-.09-.39-.13-.55.11-.17.25-.64.81-.78.97-.14.17-.29.19-.53.07-.24-.12-1.03-.38-1.96-1.21-.72-.65-1.21-1.45-1.36-1.69-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.17.04-.31-.02-.43s-.55-1.34-.76-1.83c-.2-.48-.4-.41-.55-.42z" />
    </svg>
  );
}
