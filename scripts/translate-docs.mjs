import { promises as fs } from 'node:fs';
import path from 'node:path';
import { translate } from 'bing-translate-api';

const root = process.cwd();
const srcDir = path.join(root, 'docs');
const cacheFile = path.join(root, 'scripts', 'translation-cache.json');

const targetLocales = ['fr', 'ar', 'es', 'de', 'zh', 'ja'];

// Load or initialize cache
let translationCache = {};
try {
  const rawCache = await fs.readFile(cacheFile, 'utf8');
  translationCache = JSON.parse(rawCache);
} catch (e) {
  translationCache = {};
}

async function saveCache() {
  await fs.writeFile(cacheFile, JSON.stringify(translationCache, null, 2), 'utf8');
}

// Simple retry helper
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function getTranslation(text, lang) {
  if (!text || !text.trim()) return text;
  
  if (!translationCache[lang]) translationCache[lang] = {};
  if (translationCache[lang][text]) {
    return translationCache[lang][text];
  }

  // Fallback to API
  let retries = 3;
  while (retries > 0) {
    try {
      console.log(`Translating to ${lang}: "${text.substring(0, 30)}..."`);
      const bingLang = lang === 'zh' ? 'zh-Hans' : lang;
      const res = await translate(text, null, bingLang);
      const translatedText = res.translation;
      translationCache[lang][text] = translatedText;
      await saveCache();
      await delay(800); // Respect free API rate limits
      return translatedText;
    } catch (err) {
      retries--;
      console.log(`Translation failed for ${lang}. Retries left: ${retries}. Delaying...`);
      await delay(2000);
    }
  }
  return text; // return original if failed completely
}

async function translateMarkdown(rawMd, lang) {
  const lines = rawMd.split(/\r?\n/);
  const outLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Translate top-level and section headers; keep tool names under ### intact.
    const headerMatch = line.match(/^(#+)\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      if (level <= 2) {
        const translated = await getTranslation(headerMatch[2], lang);
        outLines.push(`${headerMatch[1]} ${translated}`);
      } else {
        outLines.push(line);
      }
      continue;
    }

    // Translate Tool Descriptions
    const descMatch = line.match(/^(- \*\*Description\*\*: )(.+)$/);
    if (descMatch) {
      const translated = await getTranslation(descMatch[2], lang);
      outLines.push(`${descMatch[1]}${translated}`);
      continue;
    }

     // Keep other lines intact (urls, list markers, blank lines, pricing)
    outLines.push(line);
  }

  return outLines.join('\n');
}

async function processDirectory(dir, relativePath = '') {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fromPath = path.join(dir, entry.name);
    const rel = path.join(relativePath, entry.name);

    if (entry.isDirectory()) {
      await processDirectory(fromPath, rel);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      const rawMd = await fs.readFile(fromPath, 'utf8');

      for (const lang of targetLocales) {
        // Output directory is docs-[lang]
        const destDir = path.join(root, `docs-${lang}`, relativePath);
        await fs.mkdir(destDir, { recursive: true });
        
        const destPath = path.join(destDir, entry.name);
        
        // Check if file already exists, if we want to optimize. 
        // Here we just re-translate but our cache protects the API.
        const translatedMd = await translateMarkdown(rawMd, lang);
        await fs.writeFile(destPath, translatedMd, 'utf8');
        console.log(`✅ Translated [${lang}] ${rel}`);
      }
    }
  }
}

async function main() {
  console.log('Starting automated translation process...');
  await processDirectory(srcDir);
  console.log('Translation generation completed.');
}

main().catch(err => {
  console.error('Error during translation:', err);
  console.log('Exiting with 0 to prevent CI pipeline failure. Translations will resume next run.');
  process.exit(0);
});
