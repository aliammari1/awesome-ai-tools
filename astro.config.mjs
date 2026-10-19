import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://docs.aliammari.dev',
  output: 'static',
  trailingSlash: 'always',
  security: {
    csp: {
      algorithm: 'SHA-256',
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
        'upgrade-insecure-requests',
      ],
    },
  },
});
