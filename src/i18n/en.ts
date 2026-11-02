/**
 * Source of truth for interface text. Every other locale must define every key
 * here (enforced by the type checker and tests/i18n.test.mjs). Use {name}
 * placeholders for values.
 */
export const en = {
  'site.name': 'Awesome AI Tools',
  'site.tagline': 'A plainly described, open catalog of AI tools.',

  'nav.directory': 'Directory',
  'nav.domains': 'Domains',
  'nav.collections': 'Collections',
  'nav.saved': 'Saved',
  'nav.methodology': 'Methodology',
  'nav.contribute': 'Contribute',
  'nav.insights': 'Insights',
  'nav.changelog': 'Changelog',
  'nav.privacy': 'Privacy',
  'nav.linkHealth': 'Link health',
  'nav.primary': 'Primary',
  'nav.mobile': 'Mobile',
  'nav.menu': 'Menu',
  'nav.search': 'Search',
  'nav.searchTools': 'Search tools',
  'nav.theme': 'Toggle color theme',
  'nav.home': 'Awesome AI Tools home',
  'nav.star': 'Star',
  'nav.starSuffix': ' on GitHub',
  'common.skip': 'Skip to content',
  'common.backToTop': 'Back to top',
  'common.lastUpdated': 'Catalog last updated {date}',

  'lang.label': 'Language',
  'lang.switchTo': 'Switch language to {language}',
  'lang.suggest': 'This site is also available in {language}.',
  'lang.suggestAction': 'Switch to {language}',
  'lang.dismiss': 'Dismiss',

  'notice.title': 'Interface translated.',
  'notice.body': 'Tool names and descriptions are written in English.',
  'notice.link': 'View the English page',

  'hero.title': '{count} AI tools, plainly described.',
  'hero.lead':
    'A free, open catalog across {domains} domains. No rankings, no sponsored slots and no affiliate links, just what each tool does and where to find it.',
  'hero.placeholder': 'Try “coding agent”, “speech to text” or “open source”',
  'hero.search': 'Search',
  'hero.searchLabel': 'Search {count} AI tools',
  'hero.statTools': 'tools',
  'hero.statDomains': 'domains',
  'hero.statOpenSource': 'open source',
  'hero.popular': 'Popular domains',
  'hero.allDomains': 'All {count} domains',

  'page.home.description':
    'Search {count} AI tools across {domains} domains. Plain descriptions, open metadata, saved lists and side-by-side comparison. No rankings or paid placement.',
  'page.category.description': '{description} Browse {count} catalog entries.',
  'page.saved.title': 'Saved tools',
  'page.saved.description': 'Tools, lists, notes and personal stack saved locally in this browser.',
  'page.saved.lead':
    'Your personal workspace. Lists, notes, tags and stack markers live only in this browser and are never sent anywhere.',
  'page.compare.title': 'Compare tools',
  'page.compare.description':
    'Compare up to three AI tools side by side using recorded catalog metadata.',
  'page.compare.lead':
    'Put up to three tools side by side using the metadata recorded in the catalog. The page address holds your selection, so you can share it.',
  'page.contribute.title': 'Suggest a tool',
  'page.contribute.description':
    'Suggest an AI tool for the directory or contribute a catalog entry.',
  'page.contribute.lead':
    'Found a tool that belongs in the catalog? Validate a record in the browser, download a ready JSON file or open a prefilled GitHub issue.',
  'page.methodology.title': 'Curation methodology',
  'page.methodology.description':
    'How Awesome AI Tools selects, records, verifies, and maintains catalog entries.',
  'page.methodology.lead':
    'A listing helps you discover a tool. It is not an endorsement, a ranking or a security guarantee.',
  'page.collections.title': 'Curated collections',
  'page.collections.description':
    'Focused starting points across the catalog, built from recorded domain and license metadata.',
  'page.insights.title': 'Catalog insights',
  'page.insights.description':
    'Counts by domain, open-source share and additions over time, computed directly from the catalog.',
  'page.changelog.title': 'Catalog changelog',
  'page.changelog.description':
    'Chronological log of community additions and catalog migrations from recorded source dates.',
  'page.privacy.title': 'Privacy & local storage',
  'page.privacy.description':
    'Inspect every key stored in your browser by Awesome AI Tools and clear all local data in one click.',
  'page.linkHealth.title': 'Link-health report',
  'page.linkHealth.description':
    'Automated outbound link checks and catalog verification configuration.',
  'page.notFound.title': 'Page not found',
  'page.notFound.description': 'The requested page does not exist.',
  'page.notFound.lead':
    'The link may be outdated, or the tool may have been retired from the catalog. Search the directory to find what you were looking for.',
  'page.notFound.search': 'Search the directory',
  'page.notFound.home': 'Go to the home page',

  'footer.about':
    'An open, plainly described catalog of AI tools. Maintained as JSON files and compiled into both this site and the repository README. No paid placement, no affiliate links.',
  'footer.browse': 'Browse',
  'footer.allTools': 'All tools',
  'footer.domains': 'Domains',
  'footer.saved': 'Saved shortlist',
  'footer.compare': 'Compare tools',
  'footer.project': 'Project',
  'footer.methodology': 'Methodology',
  'footer.suggest': 'Suggest a tool',
  'footer.repo': 'GitHub repository',
  'footer.issue': 'Report an issue',
  'footer.governance': 'Governance',
  'footer.contributing': 'Contribution guide',
  'footer.conduct': 'Code of conduct',
  'footer.security': 'Security policy',
  'footer.license': 'CC0 1.0 license',
  'footer.copyright': 'CC0 1.0 Public Domain · {year}',
  'footer.disclaimer':
    'Listings are not endorsements. Verify details on each tool’s official site.',
} as const;

export type MessageKey = keyof typeof en;
