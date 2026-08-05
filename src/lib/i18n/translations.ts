/**
 * i18n система для NayTea.ru — RU/EN/ZH переключатель
 *
 * Логика (как в iznaki.ru):
 * - Cookie `lang` хранит выбор пользователя ('ru' | 'en' | 'zh')
 * - URL /en/... или /zh/... middleware rewrite → тот же компонент, но lang=zh
 * - useLanguage() hook читает cookie и возвращает t() функцию
 * - Server Components через getLang() читают cookie напрямую
 */

export type Lang = 'ru' | 'en' | 'zh';

export const DEFAULT_LANG: Lang = 'ru';

export const LANGUAGES: { code: Lang; label: string; nativeName: string; flag: string }[] = [
  { code: 'ru', label: 'RU', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'EN', nativeName: 'English', flag: '🇬🇧' },
  { code: 'zh', label: '中', nativeName: '中文', flag: '🇨🇳' },
];

/** Словарь переводов — все ключи и их RU/EN/ZH значения */
export const translations = {
  // ===== Header =====
  'header.services': { ru: 'Услуги', en: 'Services', zh: '服务' },
  'header.partners': { ru: 'Партнёрам', en: 'For partners', zh: '合作伙伴' },
  'header.contacts': { ru: 'Контакты', en: 'Contacts', zh: '联系方式' },
  'header.themeToggle': { ru: 'Переключить тему', en: 'Toggle theme', zh: '切换主题' },
  'header.close': { ru: 'Закрыть', en: 'Close', zh: '关闭' },

  // ===== Hero =====
  'hero.badge': {
    ru: 'Бесплатный поиск по открытым реестрам Роспатента',
    en: 'Free search across open Rospatent registries',
    zh: '免费搜索俄罗斯专利局开放注册簿',
  },
  'hero.h1Prefix': {
    ru: 'Проверка товарного знака',
    en: 'Trademark Check',
    zh: '商标查询',
  },
  'hero.h1Highlight': {
    ru: 'Онлайн AI',
    en: 'Online AI',
    zh: '在线 AI',
  },
  'hero.description': {
    ru: 'Проверьте бренд на возможность регистрации в Роспатенте. Поиск по всем актуальным базам и реестрам ФИПС — бесплатно и без регистрации.',
    en: 'Check your brand for registration availability in Rospatent. Search across all current FIPS databases and registries — free and no registration required.',
    zh: '在俄罗斯专利局查询您的品牌是否可注册。搜索所有最新的 FIPS 数据库和注册簿 —— 免费且无需注册。',
  },
  'hero.showDescription': { ru: 'Показать описание', en: 'Show description', zh: '显示说明' },

  // ===== Database freshness =====
  'db.freshness': { ru: 'База от 2026-04-10', en: 'Database as of 2026-04-10', zh: '数据库截至 2026-04-10' },

  // ===== Search modes =====
  'mode.name': { ru: 'По названию', en: 'By name', zh: '按名称' },
  'mode.number': { ru: 'По номеру', en: 'By number', zh: '按编号' },
  'mode.owner': { ru: 'По владельцу', en: 'By owner', zh: '按持有人' },

  // ===== Database source switcher (above search mode tabs) =====
  'db.label': { ru: 'Источник:', en: 'Source:', zh: '数据源:' },
  'db.all': { ru: 'Все базы', en: 'All databases', zh: '所有数据库' },
  'db.d1': { ru: 'Роспатент (D1)', en: 'Rospatent (D1)', zh: '俄罗斯专利局 (D1)' },
  'db.linkmark': { ru: 'linkmark.ru', en: 'linkmark.ru', zh: 'linkmark.ru' },
  'db.brandsearch': { ru: 'brand-search.ru', en: 'brand-search.ru', zh: 'brand-search.ru' },
  'db.wipo': { ru: 'WIPO GBD', en: 'WIPO GBD', zh: 'WIPO GBD' },
  'db.d1Hint': {
    ru: '1,15 млн знаков из реестров Роспатента — мгновенный поиск',
    en: '1.15M trademarks from Rospatent registries — instant search',
    zh: '来自俄罗斯专利局注册簿的 115 万个商标 —— 即时搜索',
  },

  // ===== Search input =====
  'search.placeholder.name': {
    ru: 'Укажите товарный знак или название',
    en: 'Enter a trademark or brand name',
    zh: '请输入商标或品牌名称',
  },
  'search.placeholder.number': {
    ru: 'Номер свидетельства (например, 80445)...',
    en: 'Certificate number (e.g., 80445)...',
    zh: '注册证编号(例如 80445)...',
  },
  'search.placeholder.owner': {
    ru: 'Наименование владельца...',
    en: 'Owner name...',
    zh: '持有人名称...',
  },
  'search.placeholder.subjectTin': {
    ru: 'Поиск по ИНН/ОГРН — название не требуется',
    en: 'Search by TIN/PSRN — name not required',
    zh: '按纳税人识别号/主体登记号搜索 — 无需名称',
  },
  'search.button': { ru: 'Проверить', en: 'Check', zh: '查询' },
  'search.imageSearching': {
    ru: 'Ищем по изображению…',
    en: 'Searching by image…',
    zh: '正在按图片搜索…',
  },
  'search.imageDrop': {
    ru: 'Поиск по изображению — перетащите или нажмите',
    en: 'Image search — drag and drop or click',
    zh: '图片搜索 — 拖拽或点击',
  },
  'search.otherSystems': {
    ru: 'Поиск в других поисковых системах',
    en: 'Search in other engines',
    zh: '在其他搜索引擎中搜索',
  },
  'search.emptyQuery': {
    ru: 'Введите название или ИНН/ОГРН',
    en: 'Enter a name or TIN/PSRN',
    zh: '请输入名称或纳税人识别号/主体登记号',
  },
  'search.loading': {
    ru: 'Ищем по реестрам Роспатента…',
    en: 'Searching Rospatent registries…',
    zh: '正在搜索俄罗斯专利局注册簿…',
  },
  'search.noResults': {
    ru: 'Ничего не найдено. Попробуйте изменить запрос.',
    en: 'Nothing found. Try refining your query.',
    zh: '未找到结果。请尝试修改搜索条件。',
  },
  'search.error': { ru: 'Ошибка поиска', en: 'Search error', zh: '搜索错误' },
  'search.errorImage': {
    ru: 'Ошибка поиска по изображению',
    en: 'Image search error',
    zh: '图片搜索错误',
  },

  // ===== Filters =====
  'filter.mktuFull': { ru: 'Классы МКТУ', en: 'Nice classes', zh: '尼斯分类' },
  'filter.mktuShort': { ru: 'МКТУ', en: 'Nice', zh: '分类' },
  'filter.okved': { ru: 'ОКВЭД', en: 'OKVED', zh: '经济活动分类' },
  'filter.subjectFull': { ru: 'ИНН / ОГРН', en: 'TIN / PSRN', zh: '识别号 / 登记号' },
  'filter.subjectShort': { ru: 'ИНН', en: 'TIN', zh: '识别号' },
  'filter.classSearch': { ru: 'Поиск класса...', en: 'Search class...', zh: '搜索类别...' },
  'filter.activitySearch': {
    ru: 'Поиск вида деятельности...',
    en: 'Search activity...',
    zh: '搜索经济活动...',
  },
  'filter.tinPlaceholder': {
    ru: 'ИНН (10 или 12 цифр)',
    en: 'TIN (10 or 12 digits)',
    zh: '纳税人识别号(10或12位数字)',
  },
  'filter.psrnPlaceholder': {
    ru: 'ОГРН / ОГРНИП (опционально)',
    en: 'PSRN / PSRNI (optional)',
    zh: '主体登记号(可选)',
  },
  'filter.mktuPanelTitle': {
    ru: 'Классы МКТУ (Ниццкая классификация)',
    en: 'Nice classes (Nice Classification)',
    zh: '尼斯分类',
  },
  'filter.okvedPanelTitle': {
    ru: 'Разделы ОКВЭД',
    en: 'OKVED sections',
    zh: '经济活动分类',
  },
  'filter.subjectPanelTitle': {
    ru: 'Поиск по правообладателю',
    en: 'Search by right holder',
    zh: '按权利人搜索',
  },
  'filter.clearMktu': {
    ru: 'Очистить',
    en: 'Clear',
    zh: '清除',
  },
  'filter.subjectHint': {
    ru: 'Поиск по ИНН/ОГРН найдёт всех товарных знаков, зарегистрированных на данного правообладателя.',
    en: 'TIN/PSRN search finds all trademarks registered to a given right holder.',
    zh: '按识别号/登记号搜索可找到该权利人名下注册的所有商标。',
  },
  'filter.aiMktuHint': {
    ru: 'Определить классы МКТУ с помощью умного сервиса с ИИ',
    en: 'Determine Nice classes with a smart AI service',
    zh: '使用智能 AI 服务确定尼斯分类',
  },

  // ===== Results =====
  'results.found': { ru: 'Найдено', en: 'Found', zh: '找到' },
  'results.foundMatches': { ru: 'найдено совпадений', en: 'matches found', zh: '找到匹配项' },
  'results.inLinkmark': { ru: 'в linkmark', en: 'in linkmark', zh: '在 linkmark' },
  'results.showRisk': {
    ru: 'Показать оценку рисков',
    en: 'Show risk assessment',
    zh: '显示风险评估',
  },
  'results.hideRisk': {
    ru: 'Скрыть оценку рисков',
    en: 'Hide risk assessment',
    zh: '隐藏风险评估',
  },
  'results.loadMore': { ru: 'Загрузить ещё', en: 'Load more', zh: '加载更多' },
  'results.additionalLinkmark': {
    ru: 'Дополнительные результаты из linkmark.ru',
    en: 'Additional results from linkmark.ru',
    zh: '来自 linkmark.ru 的更多结果',
  },
  'results.noImage': { ru: 'нет изображения', en: 'no image', zh: '无图片' },
  'results.tmNumber': { ru: 'ТЗ №', en: 'TM №', zh: '商标编号' },
  'results.useFullAggregator': {
    ru: 'Для полного поиска используйте',
    en: 'For full search, use the',
    zh: '如需完整搜索,请使用',
  },
  'results.fullAggregatorLink': {
    ru: 'полный агрегатор →',
    en: 'full aggregator →',
    zh: '完整聚合器 →',
  },

  // ===== Risk assessment =====
  'risk.high.title': { ru: 'Высокий риск отказа', en: 'High refusal risk', zh: '高风险' },
  'risk.medium.title': { ru: 'Средний риск', en: 'Medium risk', zh: '中等风险' },
  'risk.low.title': { ru: 'Низкий риск', en: 'Low risk', zh: '低风险' },
  'risk.high.desc': {
    ru: 'Найдено много похожих знаков. Регистрация может быть оспорена.',
    en: 'Many similar trademarks found. Registration may be challenged.',
    zh: '找到许多相似商标。注册可能受到质疑。',
  },
  'risk.medium.desc': {
    ru: 'Есть похожие знаки. Рекомендуем консультацию патентного поверенного.',
    en: 'Similar trademarks exist. We recommend consulting a patent attorney.',
    zh: '存在相似商标。建议咨询专利代理人。',
  },
  'risk.low.desc': {
    ru: 'Похожих знаков не найдено. Можно подавать заявку.',
    en: 'No similar trademarks found. You can file an application.',
    zh: '未找到相似商标。可以提交申请。',
  },

  // ===== Features (Возможности сервиса) =====
  'features.title': { ru: 'Возможности сервиса', en: 'Features', zh: '服务功能' },
  'features.free.title': { ru: 'Бесплатный поиск', en: 'Free search', zh: '免费搜索' },
  'features.free.text': {
    ru: 'Проверка по открытым реестрам Роспатента (ФИПС). Без регистрации и смс.',
    en: 'Search across open Rospatent (FIPS) registries. No registration or SMS required.',
    zh: '查询俄罗斯专利局(FIPS)开放注册簿。无需注册或短信验证。',
  },
  'features.risk.title': { ru: 'Оценка рисков', en: 'Risk assessment', zh: '风险评估' },
  'features.risk.text': {
    ru: 'Автоматический анализ: высокий / средний / низкий риск отказа в регистрации.',
    en: 'Automated analysis: high / medium / low refusal risk.',
    zh: '自动分析:高/中/低风险。',
  },
  'features.mktu.title': { ru: 'Классы МКТУ', en: 'Nice classes', zh: '尼斯分类' },
  'features.mktu.text': {
    ru: 'Фильтр по 45 классам товаров и услуг. Найдите знаки в нужной категории.',
    en: 'Filter by 45 classes of goods and services. Find marks in the right category.',
    zh: '按 45 个商品和服务类别筛选。找到所需类别的商标。',
  },
  'features.export.title': { ru: 'Экспорт в RTF и SVG', en: 'Export to RTF and SVG', zh: '导出 RTF 和 SVG' },
  'features.export.text': {
    ru: 'Скачайте результаты в .rtf (Word) или .svg (вектор, любой масштаб). Текстовые знаки — как чёткий SVG-текст.',
    en: 'Download results as .rtf (Word) or .svg (vector, any scale). Text marks as crisp SVG text.',
    zh: '将结果下载为 .rtf(Word)或 .svg(矢量,任意缩放)。文字商标以清晰 SVG 文本呈现。',
  },
  'features.fast.title': { ru: 'Быстро', en: 'Fast', zh: '快速' },
  'features.fast.text': {
    ru: 'Поиск занимает 2-3 секунды. Результаты сразу — без ожидания.',
    en: 'Search takes 2-3 seconds. Results are instant — no waiting.',
    zh: '搜索仅需 2-3 秒。即时结果 — 无需等待。',
  },
  'features.accurate.title': { ru: 'Точные данные', en: 'Accurate data', zh: '准确数据' },
  'features.accurate.text': {
    ru: 'Прямой доступ к tm-api.codeontime.ru — тому же API, что у Гардиум и Garant.',
    en: 'Direct access to tm-api.codeontime.ru — the same API used by Gardium and Garant.',
    zh: '直接访问 tm-api.codeontime.ru — 与 Gardium 和 Garant 使用的相同 API。',
  },

  // ===== How it works =====
  'how.title': { ru: 'Как это работает', en: 'How it works', zh: '工作原理' },
  'how.step1.title': { ru: 'Введите название', en: 'Enter a name', zh: '输入名称' },
  'how.step1.text': {
    ru: 'Укажите бренд или товарный знак, который хотите проверить.',
    en: 'Provide the brand or trademark you want to check.',
    zh: '输入您要查询的品牌或商标。',
  },
  'how.step2.title': { ru: 'Выберите классы МКТУ', en: 'Choose Nice classes', zh: '选择尼斯分类' },
  'how.step2.text': {
    ru: 'Опционально: отфильтруйте по классам товаров и услуг.',
    en: 'Optional: filter by classes of goods and services.',
    zh: '可选:按商品和服务类别筛选。',
  },
  'how.step3.title': {
    ru: 'Нажмите «Проверить»',
    en: 'Click "Check"',
    zh: '点击"查询"',
  },
  'how.step3.text': {
    ru: 'Поиск по реестрам Роспатента займёт 2-3 секунды.',
    en: 'Searching Rospatent registries takes 2-3 seconds.',
    zh: '搜索俄罗斯专利局注册簿需 2-3 秒。',
  },
  'how.step4.title': { ru: 'Получите результат', en: 'Get the result', zh: '获取结果' },
  'how.step4.text': {
    ru: 'Оценка рисков + список похожих знаков + экспорт в RTF.',
    en: 'Risk assessment + list of similar marks + RTF export.',
    zh: '风险评估 + 相似商标列表 + RTF 导出。',
  },

  // ===== CTA =====
  'cta.title': { ru: 'Агрегатор поисковых систем', en: 'Search aggregator', zh: '搜索聚合器' },
  'cta.description': {
    ru: 'Сборник разных поисковых систем от топовых компаний по товарным знакам России и международным товарным знакам, действующим на территории Российской Федерации',
    en: 'A collection of various search engines from top trademark companies in Russia and international trademarks effective in the Russian Federation',
    zh: '汇集俄罗斯顶级商标公司和在俄罗斯联邦境内有效的国际商标的多种搜索引擎',
  },
  'cta.openFullSearch': { ru: 'Открыть полный поиск', en: 'Open full search', zh: '打开完整搜索' },

  // ===== FIPS button =====
  'fips.buttonFull': {
    ru: 'Проверить на официальном сайте ФИПС Роспатента',
    en: 'Check on the official FIPS Rospatent website',
    zh: '在 FIPS 俄罗斯专利局官方网站查询',
  },
  'fips.buttonShort': {
    ru: 'Проверить на сайте ФИПС',
    en: 'Check on FIPS website',
    zh: '在 FIPS 网站查询',
  },

  // ===== Footer =====
  'footer.tagline': {
    ru: 'Агрегатор поиска товарных знаков по открытым реестрам',
    en: 'Trademark search aggregator across open registries',
    zh: '商标搜索聚合器(基于开放注册簿)',
  },
  'footer.sources': {
    ru: 'Источники: brand-search.ru · linkmark.ru · WIPO GBD · Роспатент · TMview',
    en: 'Sources: brand-search.ru · linkmark.ru · WIPO GBD · Rospatent · TMview',
    zh: '数据源:brand-search.ru · linkmark.ru · WIPO GBD · 俄罗斯专利局 · TMview',
  },
  'footer.partnerHidden': {
    ru: 'Лендинг партнёра',
    en: 'Partner landing',
    zh: '合作伙伴页面',
  },

  // ===== Toast messages =====
  'toast.noExportData': {
    ru: 'Нет данных для экспорта',
    en: 'No data to export',
    zh: '无可导出数据',
  },
  'toast.svgGenerating': {
    ru: 'Генерация SVG...',
    en: 'Generating SVG...',
    zh: '正在生成 SVG...',
  },
  'toast.svgLoadingImages': {
    ru: 'Загружаем изображения — подождите',
    en: 'Loading images — please wait',
    zh: '正在加载图片 — 请稍候',
  },
  'toast.loadError': {
    ru: 'Ошибка загрузки',
    en: 'Loading error',
    zh: '加载错误',
  },
} as const;

export type TranslationKey = keyof typeof translations;

/** Получить перевод по ключу и языку */
export function t(key: TranslationKey, lang: Lang): string {
  const entry = translations[key];
  if (!entry) return key;
  return entry[lang] || entry.ru;
}

/** Извлечь язык из cookie-строки */
export function parseLang(cookieStr: string | null): Lang {
  if (!cookieStr) return DEFAULT_LANG;
  const match = cookieStr.match(/(?:^|;\s*)lang=(ru|en|zh)(?:;|$)/);
  return (match?.[1] as Lang) || DEFAULT_LANG;
}
