/**
 * Tool parser utility for extracting tool data from markdown content
 * Parses tool entries from category markdown files
 */

export interface Tool {
  name: string;
  website: string;
  description: string;
  pricing: string;
  difficulty?: string;
  features?: string[];
}

/**
 * Parse tool entries from markdown content
 * Format: ### ToolName\n- **Website**: url\n- **Description**: desc\n- **Pricing**: emoji
 */
export function parseToolsFromMarkdown(content: string): Tool[] {
  const tools: Tool[] = [];
  
  // Split by h3 headers (### Tool Name)
  const toolBlocks = content.split(/^###\s+(.+?)$/m);
  
  // Skip the first empty element and process pairs (name + content)
  for (let i = 1; i < toolBlocks.length; i += 2) {
    const name = toolBlocks[i]?.trim();
    const toolContent = toolBlocks[i + 1] || '';
    
    if (!name) continue;
    
    // Extract Website
    const websiteMatch = toolContent.match(/\*\*Website\*\*:\s*\[([^\]]+)\]\(([^)]+)\)/);
    const website = websiteMatch?.[2] || '';
    
    // Extract Description
    const descMatch = toolContent.match(/\*\*Description\*\*:\s*([^\n]+)/);
    const description = descMatch?.[1]?.trim() || '';
    
    // Extract Pricing
    const pricingMatch = toolContent.match(/\*\*Pricing\*\*:\s*([^\n]+)/);
    const pricing = pricingMatch?.[1]?.trim() || '';
    
    if (name && website && description) {
      tools.push({
        name,
        website,
        description,
        pricing,
        difficulty: determineDifficulty(description),
        features: extractFeatures(description)
      });
    }
  }
  
  return tools;
}

/**
 * Determine difficulty level from description
 * Basic heuristic: looks for keywords like "beginner", "advanced", "pro", etc.
 */
function determineDifficulty(description: string): string {
  const text = description.toLowerCase();
  if (text.includes('beginner') || text.includes('easy')) return 'Beginner';
  if (text.includes('advanced') || text.includes('professional') || text.includes('pro')) return 'Advanced';
  if (text.includes('expert')) return 'Expert';
  return 'Intermediate';
}

/**
 * Extract key features from description
 * Looks for common feature keywords
 */
function extractFeatures(description: string): string[] {
  const features: string[] = [];
  const keywords = [
    'AI', 'automation', 'collaboration', 'real-time', 'mobile',
    'API', 'integration', 'cloud', 'open-source', 'self-hosted',
    'analytics', 'reporting', 'web', 'desktop', 'browser'
  ];
  
  keywords.forEach(keyword => {
    if (description.toLowerCase().includes(keyword.toLowerCase())) {
      features.push(keyword);
    }
  });
  
  return features.slice(0, 5); // Limit to 5 features
}

/**
 * Get pricing level from pricing emoji string
 * 🆓 = Free, 💰 = Paid, 🆓/💰 = Freemium
 */
export function getPricingLevel(pricing: string): 'free' | 'paid' | 'freemium' {
  if (!pricing) return 'paid';
  
  if (pricing.includes('🆓') && pricing.includes('💰')) return 'freemium';
  if (pricing.includes('💰')) return 'paid';
  if (pricing.includes('🆓')) return 'free';
  
  return 'paid';
}

/**
 * Format tool data for CSV export
 */
export function formatToolsAsCSV(tools: Tool[]): string {
  const headers = ['Name', 'Pricing', 'Difficulty', 'Features', 'Website'];
  
  const rows = tools.map(tool => [
    `"${tool.name.replace(/"/g, '""')}"`,
    `"${tool.pricing.replace(/"/g, '""')}"`,
    `"${(tool.difficulty || 'N/A').replace(/"/g, '""')}"`,
    `"${(tool.features?.join(', ') || 'N/A').replace(/"/g, '""')}"`,
    `"${tool.website.replace(/"/g, '""')}"`
  ]);
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
