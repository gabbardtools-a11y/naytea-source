/**
 * Переводы для /partners — партнёрская страница
 * Отдельный файл, чтобы не перегружать основной translations.ts
 */

export type Lang = 'ru' | 'en' | 'zh';

type Trio = { ru: string; en: string; zh: string };

export const partnersContent = {
  // Hero
  title: {
    ru: 'Партнёрам',
    en: 'For Partners',
    zh: '合作伙伴',
  } as Trio,
  subtitle: {
    ru: 'Бесплатный поиск товарных знаков для вашего сайта, ваших клиентов и вашего бизнеса — навсегда',
    en: 'Free trademark search for your website, your clients, and your business — forever',
    zh: '为您的网站、客户和业务提供永久免费的商标搜索服务',
  } as Trio,
  heroBadge: {
    ru: 'Открытая партнёрская программа · без взносов и обязательств',
    en: 'Open partner program · no fees, no obligations',
    zh: '开放合作计划 · 无费用,无义务',
  } as Trio,
  heroCta: {
    ru: 'Получить форму за 5 минут',
    en: 'Get the form in 5 minutes',
    zh: '5 分钟内获取搜索框',
  } as Trio,
  heroSecondaryCta: {
    ru: 'Узнать о всех возможностях',
    en: 'See all features',
    zh: '了解所有功能',
  } as Trio,

  // Why us — главная секция выгод
  whyTitle: {
    ru: 'Почему это выгодно',
    en: 'Why it pays off',
    zh: '为什么这对您有利',
  } as Trio,
  whySubtitle: {
    ru: 'Не нужно платить за разработку, хостинг и поддержку поиска. Мы всё взяли на себя — вы просто ставите код и получаете трафик.',
    en: 'No need to pay for development, hosting, or search maintenance. We took it all on — you just paste the code and get traffic.',
    zh: '无需为搜索的开发、托管和维护付费。我们承担了一切 —— 您只需粘贴代码即可获得流量。',
  } as Trio,

  benefit1Title: {
    ru: 'Бесплатно. Навсегда',
    en: 'Free. Forever',
    zh: '免费,永久',
  } as Trio,
  benefit1Text: {
    ru: 'Никаких подписок, никаких комиссий с поиска. Форма работает на нашем сервере — вы не платите ни за процессор, ни за трафик. Поставили один раз — работает годами.',
    en: 'No subscriptions, no per-search fees. The form runs on our server — you pay nothing for CPU or traffic. Install once, it runs for years.',
    zh: '无需订阅,无单次搜索费用。搜索框运行在我们的服务器上 —— 您无需为 CPU 或流量付费。一次安装,常年运行。',
  } as Trio,

  benefit2Title: {
    ru: '1,15 млн знаков в базе',
    en: '1.15M trademarks in the database',
    zh: '数据库中包含 115 万个商标',
  } as Trio,
  benefit2Text: {
    ru: 'Поиск идёт сразу по 4 базам: linkmark.ru, brand-search.ru, WIPO GBD и открытые реестры Роспатента. Ваш клиент получает результат за 2-3 секунды — без перезагрузки страницы.',
    en: 'Search runs across 4 databases at once: linkmark.ru, brand-search.ru, WIPO GBD, and open Rospatent registries. Your client gets a result in 2-3 seconds — without reloading the page.',
    zh: '搜索同时在 4 个数据库中进行:linkmark.ru、brand-search.ru、WIPO GBD 和俄罗斯专利局开放注册簿。您的客户在 2-3 秒内获得结果 —— 无需刷新页面。',
  } as Trio,

  benefit3Title: {
    ru: '3 минуты на установку',
    en: '3 minutes to install',
    zh: '3 分钟安装',
  } as Trio,
  benefit3Text: {
    ru: 'Копируете один кусок HTML-кода — вставляете в Тильду, WordPress, Bitrix, Joomla, Tilda, обычный HTML — и всё. Не надо программистов, не надо настраивать API, не надо думать про SSL.',
    en: 'Copy one piece of HTML code — paste it into Tilda, WordPress, Bitrix, Joomla, plain HTML — and that\'s it. No programmers needed, no API setup, no SSL headaches.',
    zh: '复制一段 HTML 代码 —— 粘贴到 Tilda、WordPress、Bitrix、Joomla、普通 HTML 中 —— 即可。无需程序员,无需 API 设置,无需 SSL 配置。',
  } as Trio,

  benefit4Title: {
    ru: 'Под вашим брендом',
    en: 'Under your brand',
    zh: '使用您的品牌',
  } as Trio,
  benefit4Text: {
    ru: 'Фон формы прозрачный — она полностью сливается с вашим сайтом. Пользователь даже не поймёт, что поиск идёт на нашем сервере. Никакого «Powered by NayTea» — только ваш логотип, ваши цвета, ваш домен.',
    en: 'The form background is transparent — it blends fully with your site. Users won\'t even realize the search runs on our server. No "Powered by NayTea" — only your logo, your colors, your domain.',
    zh: '表单背景透明 —— 与您的网站完全融合。用户甚至不会意识到搜索运行在我们的服务器上。没有"Powered by NayTea" —— 只有您的徽标、您的颜色、您的域名。',
  } as Trio,

  benefit5Title: {
    ru: '3 языка из коробки',
    en: '3 languages out of the box',
    zh: '开箱即用的 3 种语言',
  } as Trio,
  benefit5Text: {
    ru: 'Поиск работает на русском, английском и китайском. Клиент из Китая увидит китайский интерфейс, клиент из Европы — английский. Вам ничего настраивать не надо.',
    en: 'Search works in Russian, English, and Chinese. A client from China sees a Chinese interface, a European client sees English. You don\'t need to configure anything.',
    zh: '搜索支持俄语、英语和中文。来自中国的客户看到中文界面,来自欧洲的客户看到英语。您无需任何配置。',
  } as Trio,

  benefit6Title: {
    ru: 'Поиск по картинке',
    en: 'Image search',
    zh: '图片搜索',
  } as Trio,
  benefit6Text: {
    ru: 'Юзер перетаскивает логотип в форму — мы находим похожие товарные знаки. Это фишка, которой нет даже у самого Роспатента. Ваши клиенты будут впечатлены.',
    en: 'A user drags a logo into the form — we find similar trademarks. This is a feature even Rospatent itself doesn\'t have. Your clients will be impressed.',
    zh: '用户将徽标拖入表单 —— 我们就能找到相似的商标。这是连俄罗斯专利局都没有的功能。您的客户会感到惊喜。',
  } as Trio,

  // How to install
  installTitle: {
    ru: 'Как поставить форму за 3 минуты',
    en: 'How to install the form in 3 minutes',
    zh: '如何 3 分钟内安装搜索框',
  } as Trio,
  installSubtitle: {
    ru: 'Подходит для Тильды, WordPress, Bitrix, Joomla, Wix, plain HTML — для любого сайта, куда можно вставить HTML-код.',
    en: 'Works with Tilda, WordPress, Bitrix, Joomla, Wix, plain HTML — any site that accepts HTML embeds.',
    zh: '适用于 Tilda、WordPress、Bitrix、Joomla、Wix、普通 HTML —— 任何可以嵌入 HTML 代码的网站。',
  } as Trio,
  step1: {
    ru: 'Скачайте код — это обычный .txt файл с HTML внутри. Никакой регистрации, никаких email, никаких телефон.',
    en: 'Download the code — it\'s a plain .txt file with HTML inside. No registration, no email, no phone.',
    zh: '下载代码 —— 这是一个包含 HTML 的普通 .txt 文件。无需注册,无需邮箱,无需电话。',
  } as Trio,
  step2: {
    ru: 'Откройте файл, скопируйте Вариант 1 (там 3 варианта — для разной ширины сайта).',
    en: 'Open the file, copy Variant 1 (there are 3 variants — for different site widths).',
    zh: '打开文件,复制方案 1(共 3 个方案 —— 适用于不同网站宽度)。',
  } as Trio,
  step3: {
    ru: 'В Тильде: добавьте блок T123 «HTML-код» → вставьте код → опубликуйте. В WordPress: вставьте в Custom HTML widget. В Bitrix: добавьте HTML-компонент.',
    en: 'In Tilda: add a T123 "HTML code" block → paste the code → publish. In WordPress: paste into a Custom HTML widget. In Bitrix: add an HTML component.',
    zh: '在 Tilda 中:添加 T123"HTML 代码"块 → 粘贴代码 → 发布。在 WordPress 中:粘贴到"自定义 HTML"小工具中。在 Bitrix 中:添加 HTML 组件。',
  } as Trio,
  step4: {
    ru: 'Готово. Через 10 секунд проверьте — форма уже работает. Если нет — пишите, поможем за 0 рублей.',
    en: 'Done. Check in 10 seconds — the form is already working. If not — write us, we\'ll help for 0 rubles.',
    zh: '完成。10 秒后检查 —— 搜索框已经在工作了。如果没有 —— 写信给我们,我们免费提供帮助。',
  } as Trio,

  downloadCodeBtn: {
    ru: 'Скачать код (.txt, 5 КБ)',
    en: 'Download code (.txt, 5 KB)',
    zh: '下载代码(.txt, 5 KB)',
  } as Trio,
  viewExampleBtn: {
    ru: 'Посмотреть живой пример',
    en: 'See live example',
    zh: '查看实时示例',
  } as Trio,
  contactUsBtn: {
    ru: 'Связаться с нами',
    en: 'Contact us',
    zh: '联系我们',
  } as Trio,

  // Use cases
  useCasesTitle: {
    ru: 'Кому это реально полезно',
    en: 'Who actually benefits',
    zh: '对谁真正有用',
  } as Trio,
  useCasesSubtitle: {
    ru: 'Не только патентным бюро. Форма работает везде, где люди ищут товарные знаки.',
    en: 'Not just patent bureaus. The form works anywhere people search for trademarks.',
    zh: '不仅是专利局。只要有人搜索商标,这个搜索框就能发挥作用。',
  } as Trio,

  useCase1Title: {
    ru: 'Патентные бюро и поверенные',
    en: 'Patent bureaus and attorneys',
    zh: '专利局和代理人',
  } as Trio,
  useCase1Text: {
    ru: 'Клиент заходит на ваш сайт проверить бренд — вы видите кто и что искал, можете предложить помощь с регистрацией. Поиск приводит к заявке.',
    en: 'A client comes to your site to check a brand — you see who searched what, you can offer registration help. Search leads to a lead.',
    zh: '客户访问您的网站查询品牌 —— 您可以看到谁搜索了什么,从而可以提供注册协助。搜索转化为商机。',
  } as Trio,

  useCase2Title: {
    ru: 'Юридические фирмы',
    en: 'Law firms',
    zh: '律师事务所',
  } as Trio,
  useCase2Text: {
    ru: 'Поиск товарных знаков — точка входа для юридического клиента. Поставьте форму — и каждый, кто ищет «защита бренда», найдёт вас через Яндекс и Гугл.',
    en: 'Trademark search is the entry point for a legal client. Put up the form — and everyone searching for "brand protection" finds you via Yandex and Google.',
    zh: '商标搜索是法律客户的入口。放置搜索框 —— 每个搜索"品牌保护"的人都能通过百度和 Google 找到您。',
  } as Trio,

  useCase3Title: {
    ru: 'Маркетинговые и брендинговые агентства',
    en: 'Marketing and branding agencies',
    zh: '营销和品牌代理机构',
  } as Trio,
  useCase3Text: {
    ru: 'Перед запуском нового бренда клиент спрашивает: «А название свободно?». С формой на сайте вы отвечаете за 2 секунды — и сразу предлагаете нейминг, если занято.',
    en: 'Before launching a new brand, the client asks: "Is the name free?". With the form on your site, you answer in 2 seconds — and offer naming if it\'s taken.',
    zh: '在推出新品牌之前,客户会问:"这个名字可用吗?"。有了网站上的搜索框,您可以在 2 秒内回答 —— 如果被占用,可以提供命名服务。',
  } as Trio,

  useCase4Title: {
    ru: 'Бухгалтерия и аудит',
    en: 'Accounting and audit',
    zh: '会计和审计',
  } as Trio,
  useCase4Text: {
    ru: 'Нематериальные активы — это товарные знаки на балансе. Когда клиент регистрирует ТЗ, вы helping with учётом. Форма = повод для звонка.',
    en: 'Intangible assets are trademarks on the balance sheet. When a client registers a TM, you help with accounting. The form = a reason to call.',
    zh: '无形资产是资产负债表上的商标。当客户注册商标时,您可以帮助处理会计事宜。搜索框 = 致电的理由。',
  } as Trio,

  useCase5Title: {
    ru: 'Бизнес-инкубаторы и акселераторы',
    en: 'Business incubators and accelerators',
    zh: '企业孵化器和加速器',
  } as Trio,
  useCase5Text: {
    ru: 'Стартапы проверяют название сразу — ещё до того как потратят деньги на нейминг и логотип. Поставьте форму на сайт инкубатора — резиденты скажут спасибо.',
    en: 'Startups check the name early — before spending money on naming and logo. Put the form on the incubator site — residents will thank you.',
    zh: '初创公司在花钱做命名和标志之前就会查询名称。将搜索框放在孵化器网站上 —— 入驻者会感谢您。',
  } as Trio,

  useCase6Title: {
    ru: 'Фрилансеры и веб-студии',
    en: 'Freelancers and web studios',
    zh: '自由职业者和网页工作室',
  } as Trio,
  useCase6Text: {
    ru: 'Когда делаете сайт клиенту — добавьте поиск ТЗ как фишку. Это повышает ценность работы в глазах клиента — и вы можете взять за это дополнительные деньги.',
    en: 'When building a site for a client — add TM search as a feature. It raises the perceived value of the work — and you can charge extra for it.',
    zh: '在为客户建站时 —— 将商标搜索作为附加功能。这会提高工作的感知价值 —— 您可以为此收取额外费用。',
  } as Trio,

  // Numbers
  numbersTitle: {
    ru: 'Немного цифр',
    en: 'A few numbers',
    zh: '一些数字',
  } as Trio,
  number1: { ru: '1,15 млн', en: '1.15M', zh: '115 万' } as Trio,
  number1Label: {
    ru: 'знаков в базе',
    en: 'trademarks in DB',
    zh: '数据库中的商标',
  } as Trio,
  number2: { ru: '2-3 сек', en: '2-3 sec', zh: '2-3 秒' } as Trio,
  number2Label: {
    ru: 'скорость поиска',
    en: 'search speed',
    zh: '搜索速度',
  } as Trio,
  number3: { ru: '0 ₽', en: '0 ₽', zh: '0 ₽' } as Trio,
  number3Label: {
    ru: 'стоимость для вас',
    en: 'cost for you',
    zh: '您的成本',
  } as Trio,
  number4: { ru: '3 мин', en: '3 min', zh: '3 分钟' } as Trio,
  number4Label: {
    ru: 'на установку',
    en: 'to install',
    zh: '安装时间',
  } as Trio,
  number5: { ru: '4 базы', en: '4 databases', zh: '4 个数据库' } as Trio,
  number5Label: {
    ru: 'одновременно',
    en: 'at once',
    zh: '同时搜索',
  } as Trio,
  number6: { ru: '3 языка', en: '3 languages', zh: '3 种语言' } as Trio,
  number6Label: {
    ru: 'RU / EN / ZH',
    en: 'RU / EN / ZH',
    zh: '俄/英/中',
  } as Trio,

  // Features comparison
  featuresTitle: {
    ru: 'Что умеет форма',
    en: 'What the form can do',
    zh: '搜索框功能',
  } as Trio,
  feature1: {
    ru: 'Поиск по названию — точное и похожее совпадение',
    en: 'Search by name — exact and similar matches',
    zh: '按名称搜索 —— 精确和相似匹配',
  } as Trio,
  feature2: {
    ru: 'Поиск по номеру свидетельства — для проверки конкретного знака',
    en: 'Search by certificate number — to check a specific mark',
    zh: '按注册证编号搜索 —— 检查特定商标',
  } as Trio,
  feature3: {
    ru: 'Поиск по правообладателю — все знаки компании по ИНН или ОГРН',
    en: 'Search by right holder — all company marks by TIN or PSRN',
    zh: '按权利人搜索 —— 通过纳税人识别号或主体登记号查看公司所有商标',
  } as Trio,
  feature4: {
    ru: 'Поиск по изображению — перетащил логотип, получил похожие знаки',
    en: 'Image search — drag a logo, get similar marks',
    zh: '图片搜索 —— 拖入徽标,获取相似商标',
  } as Trio,
  feature5: {
    ru: 'Фильтр по 45 классам МКТУ — товары, услуги,_ADvertising, IT, food и т.д.',
    en: 'Filter by 45 Nice classes — goods, services, advertising, IT, food, etc.',
    zh: '按 45 个尼斯分类筛选 —— 商品、服务、广告、IT、食品等',
  } as Trio,
  feature6: {
    ru: 'Экспорт результатов в RTF (Word) и SVG — для отчёта клиенту',
    en: 'Export results to RTF (Word) and SVG — for a client report',
    zh: '将结果导出为 RTF(Word)和 SVG —— 用于客户报告',
  } as Trio,
  feature7: {
    ru: 'Оценка рисков — автоматический анализ: высокий / средний / низкий',
    en: 'Risk assessment — automated analysis: high / medium / low',
    zh: '风险评估 —— 自动分析:高/中/低',
  } as Trio,
  feature8: {
    ru: 'Ссылки на другие поисковые системы — Гардиум, Роспатент, Brand-search, TMdex',
    en: 'Links to other search engines — Gardium, Rospatent, Brand-search, TMdex',
    zh: '链接到其他搜索引擎 —— Gardium、俄罗斯专利局、Brand-search、TMdex',
  } as Trio,

  // Comparison with competitors
  compareTitle: {
    ru: 'Чем мы отличаемся',
    en: 'How we\'re different',
    zh: '我们的不同之处',
  } as Trio,
  compareCol1: { ru: 'Параметр', en: 'Feature', zh: '项目' } as Trio,
  compareCol2: { ru: 'NayTea', en: 'NayTea', zh: 'NayTea' } as Trio,
  compareCol3: { ru: 'Другие', en: 'Others', zh: '其他' } as Trio,
  compareRow1F: { ru: 'Цена', en: 'Price', zh: '价格' } as Trio,
  compareRow1N: { ru: '0 ₽', en: '0 ₽', zh: '0 ₽' } as Trio,
  compareRow1O: { ru: 'от 5000 ₽/мес', en: 'from 5000 ₽/mo', zh: '5000 ₽/月起' } as Trio,
  compareRow2F: { ru: 'Встраивание на сайт', en: 'Embedding on site', zh: '嵌入网站' } as Trio,
  compareRow2N: { ru: '1 строка HTML', en: '1 line of HTML', zh: '1 行 HTML' } as Trio,
  compareRow2O: { ru: 'API + программист', en: 'API + programmer', zh: 'API + 程序员' } as Trio,
  compareRow3F: { ru: 'Поиск по картинке', en: 'Image search', zh: '图片搜索' } as Trio,
  compareRow3N: { ru: '✓ есть', en: '✓ yes', zh: '✓ 有' } as Trio,
  compareRow3O: { ru: 'нет', en: 'no', zh: '无' } as Trio,
  compareRow4F: { ru: 'Языки', en: 'Languages', zh: '语言' } as Trio,
  compareRow4N: { ru: 'RU + EN + ZH', en: 'RU + EN + ZH', zh: '俄 + 英 + 中' } as Trio,
  compareRow4O: { ru: 'только RU', en: 'RU only', zh: '仅俄语' } as Trio,
  compareRow5F: { ru: 'Регистрация', en: 'Registration', zh: '注册' } as Trio,
  compareRow5N: { ru: 'не нужна', en: 'not needed', zh: '不需要' } as Trio,
  compareRow5O: { ru: 'обязательна', en: 'required', zh: '必需' } as Trio,
  compareRow6F: { ru: 'Брендирование', en: 'Branding', zh: '品牌化' } as Trio,
  compareRow6N: { ru: 'под ваш сайт', en: 'matches your site', zh: '匹配您的网站' } as Trio,
  compareRow6O: { ru: 'их логотип', en: 'their logo', zh: '他们的徽标' } as Trio,

  // FAQ
  faqTitle: {
    ru: 'Частые вопросы',
    en: 'Common questions',
    zh: '常见问题',
  } as Trio,
  faq1Q: {
    ru: 'А вы точно ничего не будете списывать с моей карты?',
    en: 'Are you really not going to charge my card?',
    zh: '你们真的不会从我的卡上扣款吗?',
  } as Trio,
  faq1A: {
    ru: 'Точно. У нас вообще нет системы оплаты — мы не берём ни копейки. Форма бесплатная и останется бесплатной. Мы зарабатываем на другом — на сервисе регистрации товарных знаков для тех, кто хочет зарегистрировать.',
    en: 'Really. We don\'t even have a payment system — we don\'t take a single kopeck. The form is free and will stay free. We earn elsewhere — on the trademark registration service for those who want to register.',
    zh: '真的。我们根本没有支付系统 —— 我们一分钱都不收。搜索框是免费的,并将保持免费。我们通过其他方式盈利 —— 为想要注册商标的人提供注册服务。',
  } as Trio,
  faq2Q: {
    ru: 'А если ваш сайт упадёт — у меня на сайте тоже форма сломается?',
    en: 'If your site goes down — will the form on my site break too?',
    zh: '如果你们网站宕机 —— 我网站上的搜索框也会坏吗?',
  } as Trio,
  faq2A: {
    ru: 'Форма перестанет работать, да. Но сам ваш сайт будет работать как ни в чём не бывало — форма изолирована в iframe. Мы мониторим сервер 24/7 и аптайм за последний год — 99,7%.',
    en: 'The form will stop working, yes. But your site itself will work as if nothing happened — the form is isolated in an iframe. We monitor the server 24/7 and uptime over the past year is 99.7%.',
    zh: '搜索框会停止工作,是的。但您的网站本身会照常运行 —— 搜索框在 iframe 中隔离。我们 24/7 监控服务器,过去一年的正常运行时间为 99.7%。',
  } as Trio,
  faq3Q: {
    ru: 'А можно убрать ссылку «Powered by NayTea»?',
    en: 'Can I remove the "Powered by NayTea" link?',
    zh: '可以删除"Powered by NayTea"链接吗?',
  } as Trio,
  faq3A: {
    ru: 'Её и так нет. Форма полностью безbrandingовая — ни лого, ни ссылок на нас. Только ваш сайт и поиск. Если хотите нас упомянуть — спасибо, но не обязательно.',
    en: 'It\'s not there to begin with. The form is completely unbranded — no logo, no links to us. Only your site and the search. If you want to mention us — thank you, but not required.',
    zh: '本来就没有。搜索框完全无品牌 —— 没有徽标,没有指向我们的链接。只有您的网站和搜索。如果您想提及我们 —— 谢谢,但不是必需的。',
  } as Trio,
  faq4Q: {
    ru: 'А если я хочу доработать форму — поменять цвета, добавить поля?',
    en: 'What if I want to customize the form — change colors, add fields?',
    zh: '如果我想自定义搜索框 —— 更改颜色,添加字段怎么办?',
  } as Trio,
  faq4A: {
    ru: 'Сейчас форма прозрачная — она наследует цвета вашего сайта. Если нужны глубкие правки — пишите, обсудим. Для нестандартных задач можем сделать отдельную версию под ваш бренд.',
    en: 'The form is transparent — it inherits your site\'s colors. If you need deeper changes — write us, we\'ll discuss. For non-standard tasks we can make a separate version for your brand.',
    zh: '搜索框是透明的 —— 它继承您网站的颜色。如果需要更深入的修改 —— 写信给我们,我们会讨论。对于非标准任务,我们可以为您的品牌制作单独的版本。',
  } as Trio,
  faq5Q: {
    ru: 'А мои клиенты будут видеть, что поиск делает «какой-то левый сервис»?',
    en: 'Will my clients see that the search is done by "some third-party service"?',
    zh: '我的客户会看到搜索是由"某个第三方服务"完成的吗?',
  } as Trio,
  faq5A: {
    ru: 'Нет. iframe изолирован — пользователи видят только результат поиска в вашем дизайне. URL в адресной строке — ваш. История браузера — ваша. Только если они откроют сертификат знака — попадут на сайт ФИПС или linkmark, но это нормально, это и есть первоисточник.',
    en: 'No. The iframe is isolated — users only see the search result in your design. The URL in the address bar is yours. The browser history is yours. Only if they open a mark\'s certificate — they go to FIPS or linkmark, but that\'s normal, that\'s the source.',
    zh: '不会。iframe 是隔离的 —— 用户只看到您设计中的搜索结果。地址栏中的 URL 是您的。浏览器历史是您的。只有当他们打开商标证书时 —— 才会进入 FIPS 或 linkmark,但这是正常的,因为那是原始来源。',
  } as Trio,
  faq6Q: {
    ru: 'А можно ли как-то зарабатывать на форме?',
    en: 'Can I somehow earn money from the form?',
    zh: '我能通过搜索框赚钱吗?',
  } as Trio,
  faq6A: {
    ru: 'Прямо — нет, мы не платим рефералку. Но косвенно — да: каждый кто ищет товарный знак — потенциальный клиент для вашей услуги. Поставьте форму → получайте заявки → продавайте регистрацию, защиту, лицензирование. Один клиент окупает всё, что вы на это потратили (то есть 0 рублей).',
    en: 'Directly — no, we don\'t pay referrals. But indirectly — yes: everyone who searches for a trademark is a potential client for your service. Put up the form → get leads → sell registration, protection, licensing. One client pays back everything you spent (which is 0 rubles).',
    zh: '直接 —— 不能,我们不支付推荐费。但间接 —— 可以:每个搜索商标的人都是您服务的潜在客户。放置搜索框 → 获取商机 → 销售注册、保护、许可服务。一个客户就能收回您投入的所有成本(即 0 卢布)。',
  } as Trio,

  // Final CTA
  finalCtaTitle: {
    ru: 'Готовы попробовать?',
    en: 'Ready to try?',
    zh: '准备好尝试了吗?',
  } as Trio,
  finalCtaSubtitle: {
    ru: 'Это действительно бесплатно. Не надо никаких карт, регистраций, звонков. Просто скачайте код и вставьте на сайт. Если что-то не получится — пишите, поможем.',
    en: 'It\'s really free. No cards, registrations, calls. Just download the code and paste it onto your site. If something doesn\'t work — write us, we\'ll help.',
    zh: '这真的是免费的。无需卡片、注册、电话。只需下载代码并粘贴到您的网站上。如果有任何问题 —— 写信给我们,我们会提供帮助。',
  } as Trio,
  finalCtaBtn1: {
    ru: 'Скачать код формы',
    en: 'Download form code',
    zh: '下载搜索框代码',
  } as Trio,
  finalCtaBtn2: {
    ru: 'Посмотреть live-демо',
    en: 'See live demo',
    zh: '查看实时演示',
  } as Trio,

  // Contact
  contactTitle: {
    ru: 'Связаться с нами',
    en: 'Contact us',
    zh: '联系我们',
  } as Trio,
  contactText: {
    ru: 'Если есть вопросы, идеи, нестандартные задачи — пишите. Отвечаем обычно в течение часа в рабочее время.',
    en: 'If you have questions, ideas, non-standard tasks — write us. We usually reply within an hour during working hours.',
    zh: '如果您有问题、想法、非标准任务 —— 写信给我们。我们通常在工作时间内一小时内回复。',
  } as Trio,
  emailUs: { ru: 'Написать на email', en: 'Email us', zh: '给我们发邮件' } as Trio,
  telegramUs: { ru: 'Написать в Telegram', en: 'Message on Telegram', zh: '在 Telegram 联系我们' } as Trio,

  // Stats for partner program
  programTitle: {
    ru: 'Программа партнёрства — открытая',
    en: 'Open partnership program',
    zh: '开放合作计划',
  } as Trio,
  programText: {
    ru: 'Мы не делаем «эксклюзивных» партнёров и не требуем контрактов. Любой может поставить форму. Любой может уйти. Никаких обязательств с обеих сторон. Это звучит странно для бизнеса, но именно так и работает открытый интернет — и мы верим, что это правильно.',
    en: 'We don\'t make "exclusive" partners and don\'t require contracts. Anyone can put up the form. Anyone can leave. No obligations on either side. That sounds weird for business, but that\'s how the open internet works — and we believe it\'s right.',
    zh: '我们不设"独家"合作伙伴,也不要求合同。任何人都可以放置搜索框。任何人都可以离开。双方都没有义务。这听起来在商业上很奇怪,但这就是开放互联网的运作方式 —— 我们相信这是正确的。',
  } as Trio,
} as const;

export type PartnerKey = keyof typeof partnersContent;

export function pt(key: PartnerKey, lang: Lang): string {
  const entry = partnersContent[key];
  if (!entry) return key;
  return entry[lang] || entry.ru;
}
