import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightImageZoom from "starlight-image-zoom";
import starlightLinksValidator from "starlight-links-validator";
import starlightScrollToTop from "starlight-scroll-to-top";
import starlightPageActions from "starlight-page-actions";

export default defineConfig({
  site: "https://aliammari1.github.io",
  base: "/awesome-ai-tools/",
  integrations: [
    starlight({
      title: "Awesome AI Tools",
      description:
        "Discover 500+ hand-picked AI tools for productivity, coding, design, writing, music, video, research, and more.",
      favicon: "/favicon.svg",
      disable404Route: true,
      plugins: [
        starlightImageZoom(),
        starlightLinksValidator({
          errorOnRelativeLinks: false,
          errorOnFallbackPages: false,
          errorOnLocalLinks: false,
        }),
        starlightScrollToTop(),
        starlightPageActions({
          baseUrl: "https://aliammari1.github.io/awesome-ai-tools/",
          share: true,
        }),
      ],
      components: {
        Head: "./src/components/Head.astro",
        PageTitle: "./src/components/PageTitle.astro",
      },
      customCss: ["./src/css/custom.css"],
      editLink: {
        baseUrl: "https://github.com/aliammari1/awesome-ai-tools/edit/main/",
      },
      lastUpdated: true,

      // ---------- Internationalization ----------
      defaultLocale: "en",
      locales: {
        en: { label: "English", lang: "en" },
        fr: { label: "Français", lang: "fr" },
        ar: { label: "العربية", lang: "ar", dir: "rtl" },
        es: { label: "Español", lang: "es" },
        de: { label: "Deutsch", lang: "de" },
        zh: { label: "中文", lang: "zh-CN" },
        ja: { label: "日本語", lang: "ja" },
      },

      // ---------- Sidebar ----------
      sidebar: [
        { label: "Productivity", autogenerate: { directory: "productivity" } },
        {
          label: "Creativity & Design",
          autogenerate: { directory: "creativity-design" },
        },
        {
          label: "Communication & Writing",
          autogenerate: { directory: "communication-writing" },
        },
        {
          label: "Data Science & Analytics",
          autogenerate: { directory: "data-science-analytics" },
        },
        {
          label: "Natural Language Processing",
          autogenerate: { directory: "natural-language-processing" },
        },
        {
          label: "Computer Vision",
          autogenerate: { directory: "computer-vision" },
        },
        { label: "Audio & Music", autogenerate: { directory: "audio-music" } },
        { label: "Video & Media", autogenerate: { directory: "video-media" } },
        {
          label: "Code & Development",
          autogenerate: { directory: "code-generation-development" },
        },
        {
          label: "AI Search & Research",
          autogenerate: { directory: "ai-search-research" },
        },
        {
          label: "Large Language Models",
          autogenerate: { directory: "large-language-models" },
        },
        {
          label: "Research & Education",
          autogenerate: { directory: "research-education" },
        },
        {
          label: "Business & Marketing",
          autogenerate: { directory: "business-marketing" },
        },
        {
          label: "Gaming & Entertainment",
          autogenerate: { directory: "gaming-entertainment" },
        },
        {
          label: "No-Code / Low-Code AI",
          autogenerate: { directory: "no-codelow-code-ai" },
        },
        {
          label: "AI Safety & Ethics",
          autogenerate: { directory: "ai-safety-ethics" },
        },
        {
          label: "Miscellaneous",
          autogenerate: { directory: "miscellaneous" },
        },
        {
          label: "Getting Started",
          autogenerate: { directory: "getting-started" },
        },
      ],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/aliammari1/awesome-ai-tools",
        },
        {
          icon: "linkedin",
          label: "LinkedIn",
          href: "https://www.linkedin.com/in/aliammari1/",
        },
        {
          icon: "email",
          label: "Email",
          href: "mailto:contact@aliammari.com",
        },
      ],
    }),
  ],
});
