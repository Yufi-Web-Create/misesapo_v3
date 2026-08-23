// Test-only stand-in for the `server-only` package. Vitest's jsdom
// environment looks like a client bundle to that package's own guard, which
// throws unconditionally in that context. Server/client boundary enforcement
// for real builds is still provided by Next.js itself; this stub only
// affects `npm test`.
export {};
