import { toolDate, type Tool } from './catalog';

export interface CuratedCollection {
  slug: string;
  title: string;
  lead: string;
  filterQuery: string;
  match: (tool: Tool) => boolean;
}

export const curatedCollections: CuratedCollection[] = [
  {
    slug: 'open-source-coding',
    title: 'Open-Source Coding & Developer Tools',
    lead: 'Open-source coding agents, IDE extensions, code search and developer utilities recorded in the catalog.',
    filterQuery: 'category=code-generation-and-development&openSource=true',
    match: (tool) =>
      tool.openSource === true &&
      (tool.category === 'code-generation-and-development' ||
        tool.category === 'ai-agents' ||
        tool.category === 'data-and-analytics'),
  },
  {
    slug: 'open-source-all',
    title: 'All Open-Source AI Tools',
    lead: 'Every catalog entry explicitly verified as open source across all domains.',
    filterQuery: 'openSource=true',
    match: (tool) => tool.openSource === true,
  },
  {
    slug: 'ai-agents-and-workflows',
    title: 'Autonomous Agents & Workflow Automation',
    lead: 'Multi-step agent frameworks, browser orchestration and task automation platforms.',
    filterQuery: 'category=ai-agents,workflow-and-automation',
    match: (tool) => tool.category === 'ai-agents' || tool.category === 'workflow-and-automation',
  },
  {
    slug: 'research-and-search',
    title: 'AI Search, Citations & Research',
    lead: 'Literature review assistants, answer engines and synthesis tools for technical and academic research.',
    filterQuery: 'category=ai-search-and-research,education-and-learning',
    match: (tool) =>
      tool.category === 'ai-search-and-research' || tool.category === 'education-and-learning',
  },
  {
    slug: 'creative-media-studio',
    title: 'Image, Video & Audio Generation',
    lead: 'Design, visual synthesis, video editing, voice cloning and music generation tools.',
    filterQuery:
      'category=creativity-and-design,video-generation-and-editing,music-and-audio-generation',
    match: (tool) =>
      tool.category === 'creativity-and-design' ||
      tool.category === 'video-generation-and-editing' ||
      tool.category === 'music-and-audio-generation',
  },
  {
    slug: 'recent-community-additions',
    title: 'Community-Contributed Additions',
    lead: 'Tools contributed directly through community pull requests and issues.',
    filterQuery: 'sort=newest',
    match: (tool) => tool.source.kind === 'community',
  },
];

export function toolsForCollection(tools: Tool[], collection: CuratedCollection): Tool[] {
  const matched = tools.filter(collection.match);
  if (collection.slug === 'recent-community-additions') {
    return [...matched].sort((a, b) => toolDate(b).localeCompare(toolDate(a)) || a.order - b.order);
  }
  return matched;
}

export interface GuidedGoal {
  id: string;
  label: string;
  description: string;
  query: string;
  category?: string;
  openSource?: boolean;
}

export const guidedGoals: GuidedGoal[] = [
  {
    id: 'code-faster',
    label: 'Write, review & debug code',
    description: 'IDE copilots, terminal coding agents and code review tools.',
    query: '',
    category: 'code-generation-and-development',
  },
  {
    id: 'oss-stack',
    label: 'Inspect or self-host open-source AI',
    description: 'Tools with public source repositories recorded in the catalog.',
    query: 'oss:yes',
    openSource: true,
  },
  {
    id: 'deep-research',
    label: 'Research papers & synthesize sources',
    description: 'Search engines, citation helpers and document Q&A.',
    query: '',
    category: 'ai-search-and-research',
  },
  {
    id: 'automate-ops',
    label: 'Automate repetitive workflows',
    description: 'AI agents and multi-app automation pipelines.',
    query: '',
    category: 'ai-agents',
  },
  {
    id: 'design-media',
    label: 'Generate images, video or audio',
    description: 'Visual design, video production and speech/music synthesis.',
    query: '',
    category: 'creativity-and-design',
  },
  {
    id: 'write-docs',
    label: 'Draft & edit clear writing',
    description: 'Writing assistants, grammar tools and meeting summarizers.',
    query: '',
    category: 'communication-and-writing',
  },
];
