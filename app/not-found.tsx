import NotFoundContent from "@/components/content/NotFoundContent";

/**
 * Must stay synchronous. An async not-found boundary makes Next.js begin
 * streaming before the boundary resolves, which pins the response to HTTP 200.
 * Locale-aware copy therefore lives in the client component below.
 */
export default function NotFound() {
  return <NotFoundContent />;
}
