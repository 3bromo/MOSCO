/**
 * Minimal Node resolver hook so plain `node --experimental-strip-types` can run
 * the project's TypeScript modules directly: maps the `@/` path alias to the
 * repo root and retries extensionless specifiers as `.ts` / `.tsx`.
 */
import { pathToFileURL } from "node:url";
import path from "node:path";

const ROOT = pathToFileURL(path.resolve(import.meta.dirname, "..") + "/").href;

export async function resolve(specifier, context, next) {
  let spec = specifier;
  if (spec.startsWith("@/")) spec = ROOT + spec.slice(2);

  try {
    return await next(spec, context);
  } catch (err) {
    for (const ext of [".ts", ".tsx", "/index.ts"]) {
      try {
        return await next(spec + ext, context);
      } catch {
        /* keep trying */
      }
    }
    throw err;
  }
}
