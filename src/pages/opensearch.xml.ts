import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
  const origin = (site ?? new URL('https://docs.aliammari.dev')).toString().replace(/\/$/, '');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">',
    '  <ShortName>Awesome AI Tools</ShortName>',
    '  <Description>Search the open catalog of plainly described AI tools.</Description>',
    '  <InputEncoding>UTF-8</InputEncoding>',
    `  <Image width="32" height="32" type="image/svg+xml">${origin}/favicon.svg</Image>`,
    `  <Url type="text/html" method="get" template="${origin}/en/?q={searchTerms}#directory" />`,
    `  <Url type="application/opensearchdescription+xml" rel="self" template="${origin}/opensearch.xml" />`,
    '</OpenSearchDescription>',
    '',
  ].join('\n');

  return new Response(xml, {
    headers: { 'Content-Type': 'application/opensearchdescription+xml; charset=utf-8' },
  });
};
