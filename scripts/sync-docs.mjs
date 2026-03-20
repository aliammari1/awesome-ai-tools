import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const srcDir = path.join(root, "docs");
const outDir = path.join(root, "src", "content", "docs");

// --------------- i18n translations for the landing page ---------------
const locales = {
  en: {
    heroTitle: "The Definitive AI Tools Directory",
    heroTagline: (tc, cc) =>
      `${tc}+ curated AI tools across ${cc} categories — from productivity to creative AI, coding assistants to LLMs. All hand-picked for real-world work.`,
    browseAll: "Browse All Tools",
    viewGitHub: "View on GitHub",
    star: "If you find this useful, give us a star on GitHub!",
    statsTools: "AI Tools Curated",
    statsCategories: "Categories",
    statsUpdated: "Updated",
    statsFree: "Free to Use",
    exploreTitle: "Explore by Category",
    whyTitle: "Why Awesome AI Tools?",
    whyHandCurated: "Hand-Curated",
    whyHandCuratedDesc:
      "Every tool is manually reviewed and vetted for quality, relevance, and real-world utility.",
    whyUpdated: "Always Updated",
    whyUpdatedDesc:
      "Continuously maintained with the latest AI tools, updates, and version releases.",
    whyPricing: "Pricing Clarity",
    whyPricingDesc:
      "Clear pricing indicators — know instantly if a tool is free, freemium, or paid.",
    whyOpenSource: "Open Source",
    whyOpenSourceDesc:
      "Community-driven and open source. Contribute, suggest tools, or report issues.",
    ctaTitle: "Ready to find the right AI tool?",
    ctaDesc:
      "Start exploring the best AI tools available today — curated, categorized, and free to browse.",
    ctaButton: "Get Started",
    categories: {
      productivity: {
        name: "Productivity",
        desc: "Time management, task management, email & communication tools",
      },
      "creativity-design": {
        name: "Creativity & Design",
        desc: "Image generation, design tools, and art creation",
      },
      "communication-writing": {
        name: "Communication & Writing",
        desc: "Writing assistants, content creation, translation",
      },
      "data-science-analytics": {
        name: "Data Science & Analytics",
        desc: "ML platforms, data visualization, research tools",
      },
      "code-generation-development": {
        name: "Code & Development",
        desc: "AI coding assistants, dev tools, code analysis",
      },
      "large-language-models": {
        name: "Large Language Models",
        desc: "GPT, Claude, Gemini, open-source LLMs & frameworks",
      },
      "audio-music": {
        name: "Audio & Music",
        desc: "Music generation, voice synthesis, transcription",
      },
      "video-media": {
        name: "Video & Media",
        desc: "Video creation, editing, enhancement & effects",
      },
      "ai-search-research": {
        name: "AI Search & Research",
        desc: "AI search engines, research & knowledge tools",
      },
      "natural-language-processing": {
        name: "Natural Language Processing",
        desc: "NLP libraries, APIs & language services",
      },
      "computer-vision": {
        name: "Computer Vision",
        desc: "Image recognition, object detection, visual AI",
      },
      "business-marketing": {
        name: "Business & Marketing",
        desc: "CRM, sales intelligence, marketing automation",
      },
      "gaming-entertainment": {
        name: "Gaming & Entertainment",
        desc: "Game dev AI, AI characters, entertainment",
      },
      "no-codelow-code-ai": {
        name: "No-Code / Low-Code AI",
        desc: "AI app builders, chatbot builders, automation",
      },
      "research-education": {
        name: "Research & Education",
        desc: "Educational AI, research platforms, learning",
      },
      "ai-safety-ethics": {
        name: "AI Safety & Ethics",
        desc: "Fairness toolkits, governance, responsible AI",
      },
      miscellaneous: {
        name: "Miscellaneous",
        desc: "MLOps, AI agents, automation, infrastructure",
      },
      "getting-started": {
        name: "Getting Started",
        desc: "Free tools, pro tips, and learning resources",
      },
    },
  },
  fr: {
    heroTitle: "Le répertoire définitif des outils IA",
    heroTagline: (tc, cc) =>
      `${tc}+ outils IA sélectionnés dans ${cc} catégories — de la productivité à l'IA créative, des assistants de code aux LLMs.`,
    browseAll: "Parcourir les outils",
    viewGitHub: "Voir sur GitHub",
    star: "Si vous trouvez cela utile, donnez-nous une étoile sur GitHub !",
    statsTools: "Outils IA sélectionnés",
    statsCategories: "Catégories",
    statsUpdated: "Mis à jour",
    statsFree: "Gratuit",
    exploreTitle: "Explorer par catégorie",
    whyTitle: "Pourquoi Awesome AI Tools ?",
    whyHandCurated: "Sélection manuelle",
    whyHandCuratedDesc:
      "Chaque outil est examiné et vérifié pour sa qualité et sa pertinence.",
    whyUpdated: "Toujours à jour",
    whyUpdatedDesc:
      "Maintenu en continu avec les derniers outils et mises à jour.",
    whyPricing: "Clarté des prix",
    whyPricingDesc:
      "Des indicateurs de prix clairs — gratuit, freemium ou payant.",
    whyOpenSource: "Open Source",
    whyOpenSourceDesc:
      "Communautaire et open source. Contribuez ou signalez des problèmes.",
    ctaTitle: "Prêt à trouver le bon outil IA ?",
    ctaDesc:
      "Explorez les meilleurs outils IA — sélectionnés, classés et gratuits.",
    ctaButton: "Commencer",
    categories: {
      productivity: {
        name: "Productivité",
        desc: "Gestion du temps, des tâches et communication",
      },
      "creativity-design": {
        name: "Créativité & Design",
        desc: "Génération d'images, outils de design, art",
      },
      "communication-writing": {
        name: "Communication & Rédaction",
        desc: "Assistants de rédaction, création de contenu",
      },
      "data-science-analytics": {
        name: "Science des données",
        desc: "Plateformes ML, visualisation de données",
      },
      "code-generation-development": {
        name: "Code & Développement",
        desc: "Assistants de codage IA, outils de dev",
      },
      "large-language-models": {
        name: "Grands modèles de langage",
        desc: "GPT, Claude, Gemini, LLMs open source",
      },
      "audio-music": {
        name: "Audio & Musique",
        desc: "Génération musicale, synthèse vocale",
      },
      "video-media": {
        name: "Vidéo & Médias",
        desc: "Création et édition vidéo",
      },
      "ai-search-research": {
        name: "Recherche IA",
        desc: "Moteurs de recherche IA, outils de recherche",
      },
      "natural-language-processing": {
        name: "Traitement du langage naturel",
        desc: "Bibliothèques NLP, APIs",
      },
      "computer-vision": {
        name: "Vision par ordinateur",
        desc: "Reconnaissance d'images, détection d'objets",
      },
      "business-marketing": {
        name: "Business & Marketing",
        desc: "CRM, intelligence commerciale",
      },
      "gaming-entertainment": {
        name: "Jeux & Divertissement",
        desc: "IA pour jeux, personnages IA",
      },
      "no-codelow-code-ai": {
        name: "IA No-Code / Low-Code",
        desc: "Constructeurs d'apps et chatbots IA",
      },
      "research-education": {
        name: "Recherche & Éducation",
        desc: "IA éducative, plateformes de recherche",
      },
      "ai-safety-ethics": {
        name: "Sécurité & Éthique IA",
        desc: "Équité, gouvernance, IA responsable",
      },
      miscellaneous: {
        name: "Divers",
        desc: "MLOps, agents IA, automatisation",
      },
      "getting-started": {
        name: "Pour commencer",
        desc: "Outils gratuits, conseils, ressources",
      },
    },
  },
  ar: {
    heroTitle: "الدليل الشامل لأدوات الذكاء الاصطناعي",
    heroTagline: (tc, cc) =>
      `أكثر من ${tc} أداة ذكاء اصطناعي مختارة عبر ${cc} فئة — من الإنتاجية إلى الإبداع والبرمجة.`,
    browseAll: "تصفح جميع الأدوات",
    viewGitHub: "عرض على GitHub",
    star: "إذا وجدت هذا مفيدًا، امنحنا نجمة على GitHub!",
    statsTools: "أداة ذكاء اصطناعي",
    statsCategories: "فئة",
    statsUpdated: "محدّث",
    statsFree: "مجاني",
    exploreTitle: "استكشف حسب الفئة",
    whyTitle: "لماذا Awesome AI Tools؟",
    whyHandCurated: "اختيار يدوي",
    whyHandCuratedDesc: "كل أداة تمت مراجعتها يدويًا من حيث الجودة والملاءمة.",
    whyUpdated: "محدّث دائمًا",
    whyUpdatedDesc: "يتم تحديثه باستمرار بأحدث الأدوات والإصدارات.",
    whyPricing: "وضوح الأسعار",
    whyPricingDesc: "مؤشرات واضحة للأسعار — مجاني أو مدفوع.",
    whyOpenSource: "مفتوح المصدر",
    whyOpenSourceDesc: "مشروع مجتمعي مفتوح المصدر.",
    ctaTitle: "مستعد لإيجاد الأداة المناسبة؟",
    ctaDesc: "ابدأ باستكشاف أفضل أدوات الذكاء الاصطناعي المتاحة اليوم.",
    ctaButton: "ابدأ الآن",
    categories: {
      productivity: { name: "الإنتاجية", desc: "إدارة الوقت والمهام والتواصل" },
      "creativity-design": {
        name: "الإبداع والتصميم",
        desc: "إنشاء الصور وأدوات التصميم",
      },
      "communication-writing": {
        name: "التواصل والكتابة",
        desc: "مساعدات الكتابة وإنشاء المحتوى",
      },
      "data-science-analytics": {
        name: "علم البيانات",
        desc: "منصات تعلم الآلة وتحليل البيانات",
      },
      "code-generation-development": {
        name: "البرمجة والتطوير",
        desc: "مساعدات برمجة بالذكاء الاصطناعي",
      },
      "large-language-models": {
        name: "نماذج اللغة الكبيرة",
        desc: "GPT، Claude، Gemini، نماذج مفتوحة",
      },
      "audio-music": {
        name: "الصوت والموسيقى",
        desc: "إنتاج الموسيقى والتوليف الصوتي",
      },
      "video-media": { name: "الفيديو والوسائط", desc: "إنشاء وتحرير الفيديو" },
      "ai-search-research": {
        name: "البحث بالذكاء الاصطناعي",
        desc: "محركات بحث ذكية وأدوات بحث",
      },
      "natural-language-processing": {
        name: "معالجة اللغة الطبيعية",
        desc: "مكتبات وواجهات NLP",
      },
      "computer-vision": {
        name: "الرؤية الحاسوبية",
        desc: "التعرف على الصور والكشف",
      },
      "business-marketing": {
        name: "الأعمال والتسويق",
        desc: "إدارة علاقات العملاء والتسويق",
      },
      "gaming-entertainment": {
        name: "الألعاب والترفيه",
        desc: "ذكاء اصطناعي للألعاب",
      },
      "no-codelow-code-ai": {
        name: "بدون كود / كود منخفض",
        desc: "بناء تطبيقات وروبوتات ذكية",
      },
      "research-education": {
        name: "البحث والتعليم",
        desc: "منصات تعليمية وبحثية",
      },
      "ai-safety-ethics": {
        name: "سلامة وأخلاقيات الذكاء",
        desc: "أدوات الإنصاف والحوكمة",
      },
      miscellaneous: { name: "متنوع", desc: "MLOps، وكلاء ذكاء اصطناعي" },
      "getting-started": {
        name: "البداية",
        desc: "أدوات مجانية ونصائح وموارد",
      },
    },
  },
  es: {
    heroTitle: "El directorio definitivo de herramientas de IA",
    heroTagline: (tc, cc) =>
      `Más de ${tc} herramientas de IA seleccionadas en ${cc} categorías — desde productividad hasta IA creativa.`,
    browseAll: "Explorar herramientas",
    viewGitHub: "Ver en GitHub",
    star: "Si te resulta útil, ¡danos una estrella en GitHub!",
    statsTools: "Herramientas de IA",
    statsCategories: "Categorías",
    statsUpdated: "Actualizado",
    statsFree: "Gratis",
    exploreTitle: "Explorar por categoría",
    whyTitle: "¿Por qué Awesome AI Tools?",
    whyHandCurated: "Selección manual",
    whyHandCuratedDesc:
      "Cada herramienta es revisada manualmente para garantizar calidad y relevancia.",
    whyUpdated: "Siempre actualizado",
    whyUpdatedDesc:
      "Mantenido continuamente con las últimas herramientas y actualizaciones.",
    whyPricing: "Precios claros",
    whyPricingDesc: "Indicadores claros — gratuito, freemium o de pago.",
    whyOpenSource: "Código abierto",
    whyOpenSourceDesc: "Impulsado por la comunidad y de código abierto.",
    ctaTitle: "¿Listo para encontrar la herramienta adecuada?",
    ctaDesc:
      "Comienza a explorar las mejores herramientas de IA disponibles hoy.",
    ctaButton: "Comenzar",
    categories: {
      productivity: {
        name: "Productividad",
        desc: "Gestión del tiempo, tareas y comunicación",
      },
      "creativity-design": {
        name: "Creatividad y diseño",
        desc: "Generación de imágenes y herramientas de diseño",
      },
      "communication-writing": {
        name: "Comunicación y escritura",
        desc: "Asistentes de escritura y creación de contenido",
      },
      "data-science-analytics": {
        name: "Ciencia de datos",
        desc: "Plataformas ML y visualización de datos",
      },
      "code-generation-development": {
        name: "Código y desarrollo",
        desc: "Asistentes de codificación IA",
      },
      "large-language-models": {
        name: "Modelos de lenguaje",
        desc: "GPT, Claude, Gemini, LLMs de código abierto",
      },
      "audio-music": {
        name: "Audio y música",
        desc: "Generación musical y síntesis de voz",
      },
      "video-media": {
        name: "Vídeo y medios",
        desc: "Creación y edición de vídeo",
      },
      "ai-search-research": {
        name: "Búsqueda IA",
        desc: "Motores de búsqueda IA y herramientas",
      },
      "natural-language-processing": {
        name: "Procesamiento de lenguaje",
        desc: "Bibliotecas NLP y APIs",
      },
      "computer-vision": {
        name: "Visión por computadora",
        desc: "Reconocimiento de imágenes y detección",
      },
      "business-marketing": {
        name: "Negocios y marketing",
        desc: "CRM e inteligencia de ventas",
      },
      "gaming-entertainment": {
        name: "Juegos y entretenimiento",
        desc: "IA para desarrollo de juegos",
      },
      "no-codelow-code-ai": {
        name: "IA sin código / bajo código",
        desc: "Constructores de apps y chatbots",
      },
      "research-education": {
        name: "Investigación y educación",
        desc: "IA educativa y plataformas de investigación",
      },
      "ai-safety-ethics": {
        name: "Seguridad y ética IA",
        desc: "Herramientas de equidad y gobernanza",
      },
      miscellaneous: {
        name: "Varios",
        desc: "MLOps, agentes IA y automatización",
      },
      "getting-started": {
        name: "Primeros pasos",
        desc: "Herramientas gratuitas, consejos y recursos",
      },
    },
  },
  de: {
    heroTitle: "Das KI-Werkzeug-Verzeichnis",
    heroTagline: (tc, cc) =>
      `Über ${tc} kuratierte KI-Tools in ${cc} Kategorien — von Produktivität bis kreative KI und LLMs.`,
    browseAll: "Alle Tools durchsuchen",
    viewGitHub: "Auf GitHub ansehen",
    star: "Wenn Sie das nützlich finden, geben Sie uns einen Stern auf GitHub!",
    statsTools: "KI-Tools kuratiert",
    statsCategories: "Kategorien",
    statsUpdated: "Aktualisiert",
    statsFree: "Kostenlos",
    exploreTitle: "Nach Kategorie erkunden",
    whyTitle: "Warum Awesome AI Tools?",
    whyHandCurated: "Handverlesen",
    whyHandCuratedDesc:
      "Jedes Tool wird manuell auf Qualität und Relevanz geprüft.",
    whyUpdated: "Immer aktuell",
    whyUpdatedDesc: "Fortlaufend mit den neuesten Tools und Updates gepflegt.",
    whyPricing: "Preisklarheit",
    whyPricingDesc:
      "Klare Preisangaben — kostenlos, Freemium oder kostenpflichtig.",
    whyOpenSource: "Open Source",
    whyOpenSourceDesc: "Community-getrieben und quelloffen.",
    ctaTitle: "Bereit, das richtige KI-Tool zu finden?",
    ctaDesc:
      "Erkunden Sie die besten verfügbaren KI-Tools — kuratiert und kostenlos.",
    ctaButton: "Loslegen",
    categories: {
      productivity: {
        name: "Produktivität",
        desc: "Zeitmanagement, Aufgabenverwaltung, Kommunikation",
      },
      "creativity-design": {
        name: "Kreativität & Design",
        desc: "Bilderzeugung und Design-Tools",
      },
      "communication-writing": {
        name: "Kommunikation & Schreiben",
        desc: "Schreibassistenten und Inhaltserstellung",
      },
      "data-science-analytics": {
        name: "Data Science & Analytik",
        desc: "ML-Plattformen und Datenvisualisierung",
      },
      "code-generation-development": {
        name: "Code & Entwicklung",
        desc: "KI-Codierassistenten und Dev-Tools",
      },
      "large-language-models": {
        name: "Große Sprachmodelle",
        desc: "GPT, Claude, Gemini, Open-Source LLMs",
      },
      "audio-music": {
        name: "Audio & Musik",
        desc: "Musikgenerierung und Sprachsynthese",
      },
      "video-media": {
        name: "Video & Medien",
        desc: "Videoerstellung und -bearbeitung",
      },
      "ai-search-research": {
        name: "KI-Suche & Forschung",
        desc: "KI-Suchmaschinen und Forschungstools",
      },
      "natural-language-processing": {
        name: "Sprachverarbeitung",
        desc: "NLP-Bibliotheken und APIs",
      },
      "computer-vision": {
        name: "Computer Vision",
        desc: "Bilderkennung und Objekterkennung",
      },
      "business-marketing": {
        name: "Business & Marketing",
        desc: "CRM und Vertriebsintelligenz",
      },
      "gaming-entertainment": {
        name: "Gaming & Unterhaltung",
        desc: "KI für Spieleentwicklung",
      },
      "no-codelow-code-ai": {
        name: "No-Code / Low-Code KI",
        desc: "App- und Chatbot-Builder",
      },
      "research-education": {
        name: "Forschung & Bildung",
        desc: "KI-Bildung und Forschungsplattformen",
      },
      "ai-safety-ethics": {
        name: "KI-Sicherheit & Ethik",
        desc: "Fairness-Tools und Governance",
      },
      miscellaneous: {
        name: "Verschiedenes",
        desc: "MLOps, KI-Agenten und Automatisierung",
      },
      "getting-started": {
        name: "Erste Schritte",
        desc: "Kostenlose Tools, Tipps und Ressourcen",
      },
    },
  },
  zh: {
    heroTitle: "AI 工具权威目录",
    heroTagline: (tc, cc) =>
      `精选 ${tc}+ 个 AI 工具，涵盖 ${cc} 个类别——从生产力到创意 AI、编码助手到大语言模型。`,
    browseAll: "浏览所有工具",
    viewGitHub: "在 GitHub 查看",
    star: "如果觉得有用，请在 GitHub 上给我们一颗星！",
    statsTools: "AI 工具",
    statsCategories: "类别",
    statsUpdated: "已更新",
    statsFree: "免费",
    exploreTitle: "按类别浏览",
    whyTitle: "为什么选择 Awesome AI Tools？",
    whyHandCurated: "人工精选",
    whyHandCuratedDesc: "每个工具都经过人工审核，确保质量和实用性。",
    whyUpdated: "持续更新",
    whyUpdatedDesc: "持续维护，包含最新的AI工具和版本更新。",
    whyPricing: "价格透明",
    whyPricingDesc: "清晰的价格标识——免费、增值或付费一目了然。",
    whyOpenSource: "开源",
    whyOpenSourceDesc: "社区驱动的开源项目，欢迎贡献和反馈。",
    ctaTitle: "准备好找到合适的 AI 工具了吗？",
    ctaDesc: "开始探索当今最好的 AI 工具——精选、分类、免费浏览。",
    ctaButton: "开始探索",
    categories: {
      productivity: { name: "生产力", desc: "时间管理、任务管理和沟通工具" },
      "creativity-design": { name: "创意与设计", desc: "图像生成和设计工具" },
      "communication-writing": {
        name: "沟通与写作",
        desc: "写作助手和内容创作",
      },
      "data-science-analytics": {
        name: "数据科学与分析",
        desc: "机器学习平台和数据可视化",
      },
      "code-generation-development": {
        name: "编程与开发",
        desc: "AI 编程助手和开发工具",
      },
      "large-language-models": {
        name: "大语言模型",
        desc: "GPT、Claude、Gemini、开源 LLM",
      },
      "audio-music": { name: "音频与音乐", desc: "音乐生成和语音合成" },
      "video-media": { name: "视频与媒体", desc: "视频创建和编辑" },
      "ai-search-research": {
        name: "AI 搜索与研究",
        desc: "AI 搜索引擎和研究工具",
      },
      "natural-language-processing": {
        name: "自然语言处理",
        desc: "NLP 库和 API",
      },
      "computer-vision": { name: "计算机视觉", desc: "图像识别和目标检测" },
      "business-marketing": { name: "商业与营销", desc: "CRM 和销售智能" },
      "gaming-entertainment": { name: "游戏与娱乐", desc: "AI 游戏开发" },
      "no-codelow-code-ai": {
        name: "无代码/低代码 AI",
        desc: "应用和聊天机器人构建器",
      },
      "research-education": { name: "研究与教育", desc: "AI 教育和研究平台" },
      "ai-safety-ethics": { name: "AI 安全与伦理", desc: "公平性工具和治理" },
      miscellaneous: { name: "其他", desc: "MLOps、AI 代理和自动化" },
      "getting-started": { name: "入门指南", desc: "免费工具、技巧和学习资源" },
    },
  },
  ja: {
    heroTitle: "AIツール決定版ディレクトリ",
    heroTagline: (tc, cc) =>
      `${cc}カテゴリにわたる${tc}以上の厳選AIツール — 生産性からクリエイティブAI、コーディングアシスタントからLLMまで。`,
    browseAll: "すべてのツールを見る",
    viewGitHub: "GitHubで見る",
    star: "お役に立てましたら、GitHubでスターをお願いします！",
    statsTools: "AIツール",
    statsCategories: "カテゴリ",
    statsUpdated: "更新済み",
    statsFree: "無料",
    exploreTitle: "カテゴリ別に探す",
    whyTitle: "なぜ Awesome AI Tools？",
    whyHandCurated: "手動で厳選",
    whyHandCuratedDesc:
      "すべてのツールが品質と実用性について手動で審査されています。",
    whyUpdated: "常に最新",
    whyUpdatedDesc:
      "最新のAIツールとアップデートで継続的にメンテナンスされています。",
    whyPricing: "料金の透明性",
    whyPricingDesc:
      "明確な料金表示 — 無料、フリーミアム、有料が一目でわかります。",
    whyOpenSource: "オープンソース",
    whyOpenSourceDesc: "コミュニティ主導のオープンソースプロジェクトです。",
    ctaTitle: "最適なAIツールを見つける準備はできましたか？",
    ctaDesc: "今日利用可能な最高のAIツールを探索しましょう。",
    ctaButton: "始める",
    categories: {
      productivity: {
        name: "生産性",
        desc: "時間管理、タスク管理、コミュニケーション",
      },
      "creativity-design": {
        name: "クリエイティビティ＆デザイン",
        desc: "画像生成とデザインツール",
      },
      "communication-writing": {
        name: "コミュニケーション＆ライティング",
        desc: "ライティングアシスタントとコンテンツ作成",
      },
      "data-science-analytics": {
        name: "データサイエンス＆分析",
        desc: "MLプラットフォームとデータ可視化",
      },
      "code-generation-development": {
        name: "コード＆開発",
        desc: "AIコーディングアシスタントと開発ツール",
      },
      "large-language-models": {
        name: "大規模言語モデル",
        desc: "GPT、Claude、Gemini、オープンソースLLM",
      },
      "audio-music": {
        name: "オーディオ＆ミュージック",
        desc: "音楽生成と音声合成",
      },
      "video-media": { name: "ビデオ＆メディア", desc: "動画の作成と編集" },
      "ai-search-research": {
        name: "AI検索＆リサーチ",
        desc: "AI検索エンジンとリサーチツール",
      },
      "natural-language-processing": {
        name: "自然言語処理",
        desc: "NLPライブラリとAPI",
      },
      "computer-vision": {
        name: "コンピュータビジョン",
        desc: "画像認識と物体検出",
      },
      "business-marketing": {
        name: "ビジネス＆マーケティング",
        desc: "CRMとセールスインテリジェンス",
      },
      "gaming-entertainment": {
        name: "ゲーム＆エンターテイメント",
        desc: "AIゲーム開発",
      },
      "no-codelow-code-ai": {
        name: "ノーコード/ローコードAI",
        desc: "アプリとチャットボットビルダー",
      },
      "research-education": {
        name: "研究＆教育",
        desc: "AI教育と研究プラットフォーム",
      },
      "ai-safety-ethics": {
        name: "AI安全性＆倫理",
        desc: "公平性ツールとガバナンス",
      },
      miscellaneous: { name: "その他", desc: "MLOps、AIエージェント、自動化" },
      "getting-started": {
        name: "はじめに",
        desc: "無料ツール、ヒント、学習リソース",
      },
    },
  },
};

const categoryIcons = {
  productivity: "💼",
  "creativity-design": "🎨",
  "communication-writing": "💬",
  "data-science-analytics": "📊",
  "code-generation-development": "💻",
  "large-language-models": "🤖",
  "audio-music": "🎵",
  "video-media": "🎥",
  "ai-search-research": "🔍",
  "natural-language-processing": "🧠",
  "computer-vision": "👁️",
  "business-marketing": "🏢",
  "gaming-entertainment": "🎮",
  "no-codelow-code-ai": "⚡",
  "research-education": "🧪",
  "ai-safety-ethics": "🛡️",
  miscellaneous: "🌐",
  "getting-started": "🚀",
};

// --------------- Helpers ---------------
function titleFromFile(fileName) {
  const stem = fileName.replace(/\.md$/i, "");
  return stem
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function convertPageRefTags(markdown) {
  return markdown.replace(
    /\{\%\s*page-ref\s+page=\"([^\"]+)\"\s*\%\}/g,
    (_m, file) => {
      const label = titleFromFile(file);
      const target = file.replace(/\.md$/i, "/");
      return `- [${label}](${target})`;
    },
  );
}

function ensureTitleFrontmatter(markdown, fallbackTitle) {
  if (/^---\r?\n[\s\S]*?\r?\n---\r?\n/.test(markdown)) {
    return markdown;
  }
  const headingMatch = markdown.match(/^#\s+(.+)$/m);
  const title = (headingMatch?.[1] || fallbackTitle)
    .replace(/\s+/g, " ")
    .trim();
  return `---\ntitle: ${JSON.stringify(title)}\n---\n\n${markdown}`;
}

async function copyMarkdownTree(fromDir, toDir) {
  const entries = await fs.readdir(fromDir, { withFileTypes: true });
  await fs.mkdir(toDir, { recursive: true });

  for (const entry of entries) {
    const fromPath = path.join(fromDir, entry.name);
    const toName =
      entry.isFile() && entry.name.toLowerCase() === "readme.md"
        ? "index.md"
        : entry.name;
    const toPath = path.join(toDir, toName);

    if (entry.isDirectory()) {
      await copyMarkdownTree(fromPath, toPath);
      continue;
    }

    if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".md")) continue;

    const raw = await fs.readFile(fromPath, "utf8");
    const fallbackTitle = titleFromFile(toName);
    const transformed = ensureTitleFrontmatter(
      convertPageRefTags(raw),
      fallbackTitle,
    );
    await fs.mkdir(path.dirname(toPath), { recursive: true });
    await fs.writeFile(toPath, transformed, "utf8");
  }
}

async function cleanGeneratedDocs() {
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });
}

async function countTools() {
  const readme = await fs.readFile(path.join(root, "README.md"), "utf8");
  const toolLinks = readme.match(/^- \[/gm);
  return toolLinks ? toolLinks.length : 500;
}

async function countCategories() {
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).length;
}

// --------------- Generate index page for a locale ---------------
function generateIndex(locale, toolCount, catCount) {
  const t = locales[locale] || locales.en;
  const base = "/awesome-ai-tools";
  const prefix = `/${locale}`;

  const escapeHtmlAttribute = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const categoryCards = Object.entries(t.categories)
    .map(([slug, cat]) => {
      const icon = categoryIcons[slug] || "📦";
      const cardText = escapeHtmlAttribute(
        `${cat.name} ${cat.desc}`.toLowerCase(),
      );
      return `  <a class="category-card" href="${base}${prefix}/${slug}/" data-category-card data-category-slug="${slug}" data-category-text="${cardText}">
    <div class="category-icon">${icon}</div>
    <div class="category-info">
      <h3>${cat.name}</h3>
      <p>${cat.desc}</p>
    </div>
  </a>`;
    })
    .join("\n");

  const quickFilterSlugs = [
    "productivity",
    "code-generation-development",
    "large-language-models",
    "creativity-design",
    "ai-search-research",
    "research-education",
  ];

  const quickFilters = quickFilterSlugs
    .map(
      (slug) =>
        `    <button class="filter-chip" type="button" data-filter-chip="${slug}">${t.categories[slug].name}</button>`,
    )
    .join("\n");

  return `---
title: "Awesome AI Tools"
description: "${t.heroTagline(toolCount, catCount)}"
template: splash
hero:
  title: "${t.heroTitle}"
  tagline: "${t.heroTagline(toolCount, catCount)}"
  image:
    html: '<img src="${base}/og-image.png" alt="Awesome AI Tools" style="border-radius:12px;border:1px solid var(--pro-border,#e2e8f0);max-width:480px;width:100%;" />'
  actions:
    - text: "${t.browseAll}"
      link: ${base}${prefix}/productivity/
      icon: right-arrow
    - text: "${t.viewGitHub}"
      link: https://github.com/aliammari1/awesome-ai-tools
      icon: external
      variant: minimal
      attrs:
        rel: noopener
banner:
  content: |
    ⭐ ${t.star.replace(/<[^>]+>/g, "")} <a href="https://github.com/aliammari1/awesome-ai-tools">GitHub</a>
---

<div class="category-grid">
${categoryCards}
</div>

<style>
  .popular-this-week-widget {
    margin: 3rem 0 2rem 0;
    padding: 2rem;
    background: var(--pro-surface);
    border: 1px solid var(--pro-border);
    border-radius: 12px;
  }

  .popular-header {
    margin-bottom: 1.5rem;
  }

  .popular-header h2 {
    margin: 0 0 0.35rem 0 !important;
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--sl-color-white) !important;
    border: none !important;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .popular-icon {
    font-size: 1.5rem;
    line-height: 1;
  }

  .popular-subtitle {
    margin: 0 !important;
    font-size: 0.85rem;
    color: var(--sl-color-gray-3);
    font-weight: 500;
  }

  .popular-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
  }

  .popular-item {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--sl-color-bg);
    border: 1px solid var(--pro-border);
    border-radius: 8px;
    text-decoration: none !important;
    color: var(--sl-color-text) !important;
    transition: border-color 200ms ease, box-shadow 200ms ease, transform 150ms ease;
  }

  .popular-item:hover {
    border-color: var(--pro-primary);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
    transform: translateY(-2px);
  }

  .popular-rank {
    font-weight: 700;
    font-size: 1.1rem;
    color: var(--pro-primary);
  }

  .popular-content {
    flex: 1;
  }

  .popular-name {
    margin: 0 !important;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--sl-color-white) !important;
    line-height: 1.3;
  }

  .popular-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
    font-size: 0.8rem;
    flex-wrap: wrap;
  }

  .popular-badge {
    padding: 0.25rem 0.5rem;
    background: rgba(59, 130, 246, 0.15);
    color: var(--pro-primary);
    border-radius: 4px;
    font-weight: 600;
    white-space: nowrap;
  }

  .popular-count {
    color: var(--sl-color-gray-3);
    white-space: nowrap;
  }

  .popular-arrow {
    align-self: flex-start;
    color: var(--pro-primary);
    font-weight: 700;
  }

  .popular-loading,
  .popular-empty {
    grid-column: 1 / -1;
    padding: 2rem;
    text-align: center;
    color: var(--sl-color-gray-3);
    font-size: 0.9rem;
  }

  @media (max-width: 48rem) {
    .popular-this-week-widget {
      margin: 2rem -1rem 1.5rem -1rem;
      border-radius: 0;
      padding: 1.5rem;
    }

    .popular-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 48rem) and (max-width: 75rem) {
    .popular-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (min-width: 75rem) {
    .popular-grid {
      grid-template-columns: repeat(5, 1fr);
    }
  }
</style>

## ${t.whyTitle}

<div class="features-grid">
  <div class="feature-card">
    <div class="feature-icon">🔍</div>
    <div class="feature-title">${t.whyHandCurated}</div>
    <div class="feature-desc">${t.whyHandCuratedDesc}</div>
  </div>
  <div class="feature-card">
    <div class="feature-icon">🔄</div>
    <div class="feature-title">${t.whyUpdated}</div>
    <div class="feature-desc">${t.whyUpdatedDesc}</div>
  </div>
  <div class="feature-card">
    <div class="feature-icon">💰</div>
    <div class="feature-title">${t.whyPricing}</div>
    <div class="feature-desc">${t.whyPricingDesc}</div>
  </div>
  <div class="feature-card">
    <div class="feature-icon">🌍</div>
    <div class="feature-title">${t.whyOpenSource}</div>
    <div class="feature-desc">${t.whyOpenSourceDesc}</div>
  </div>
</div>

<div class="cta-section">
  <h2>${t.ctaTitle}</h2>
  <p>${t.ctaDesc}</p>
  <a href="${base}${prefix}/productivity/" style="color: white !important;" class="cta-button">${t.ctaButton}</a>
</div>
`;
}

// --------------- Main ---------------
async function main() {
  await cleanGeneratedDocs();

  const toolCount = await countTools();
  const catCount = await countCategories();

  // Copy English docs to the en/ locale directory
  const enOutDir = path.join(outDir, "en");
  await copyMarkdownTree(srcDir, enOutDir);

  // Write the English index
  const enIndexPath = path.join(enOutDir, "index.md");
  await fs.writeFile(
    enIndexPath,
    generateIndex("en", toolCount, catCount),
    "utf8",
  );

  // For non-English locales, copy translated docs if they exist, plus the landing content
  for (const locale of Object.keys(locales)) {
    if (locale === "en") continue;
    const locDir = path.join(outDir, locale);
    await fs.mkdir(locDir, { recursive: true });

    // Copy translated markdown tree if it exists
    const translatedSrcDir = path.join(root, `docs-${locale}`);
    try {
      await fs.access(translatedSrcDir);
      await copyMarkdownTree(translatedSrcDir, locDir);
    } catch (e) {
      console.log(
        `ℹ️ No translation folder found for ${locale} at docs-${locale}. Only index will be generated.`,
      );
    }

    const indexPath = path.join(locDir, "index.md");
    await fs.writeFile(
      indexPath,
      generateIndex(locale, toolCount, catCount),
      "utf8",
    );
  }

  console.log(
    `✅ Synced docs with i18n landing pages (${Object.keys(locales).length} locales, ${toolCount} tools).`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
