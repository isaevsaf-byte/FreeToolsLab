export type Language = "en" | "ru";

export const dictionary = {
  en: {
    nav: {
      tools: "Modules",
      support: "Support",
      lang: "Switch language",
      theme_dark: "Switch to dark theme",
      theme_light: "Switch to light theme",
    },
    hero: {
      badge: "SYSTEM: OPERATIONAL",
      title: "Strategic Intelligence. Democratized.",
      sub: "A suite of local-first tools for business decisions. No tracking. No servers. Nothing leaves your browser.",
      cta: "Access Tools",
    },
    mission: {
      title: "The Manifesto",
      text: "High-level strategic thinking shouldn't be a privilege. We build 'Cognitive Exoskeletons': tools that help you think clearer, faster, and without bias.",
    },
    modules: {
      title: "Modules",
      sub: "Free, local-first tools. Designed to be usable under strict data policies. Nothing leaves your browser. Check your own policy.",
      live: "Live",
      coming: "Coming next",
      empty: "No tools yet.",
      submit: "Submit a tool idea",
      status: {
        live: "live",
        next: "next",
        planned: "planned",
        idea: "idea",
        retired: "retired",
      },
    },
    support: {
      title: "Support the Lab",
      kofi: "Ko-fi, one-off or monthly",
      github: "GitHub Sponsors",
      bmc: "Buy Me a Coffee",
      not_set: "Support links are not set up yet.",
      byok_title: "Your key vs your coffee",
      byok_text:
        "Smart features use your own Anthropic API key: calls go from your browser to Anthropic directly, nothing passes through the lab. Your key pays for your own usage. Your coffee pays for building the next tool.",
      covers_title: "What the money covers",
      shipped: "Tools shipped this month: {n}",
    },
    subscribe: {
      title: "Get the weekly tool",
      text: "One new tool every Tuesday. One email a week, no tracking pixels, unsubscribe in one click. The newsletter lives on its own page, never inside a tool.",
      cta: "Subscribe",
      not_set: "The newsletter is not set up yet.",
    },
    footer: {
      support: "Support the Lab",
      subscribe: "Get the weekly tool",
      submit: "Submit a tool idea",
    },
  },
  ru: {
    nav: {
      tools: "Модули",
      support: "Поддержать",
      lang: "Переключить язык",
      theme_dark: "Тёмная тема",
      theme_light: "Светлая тема",
    },
    hero: {
      badge: "СТАТУС: АКТИВЕН",
      title: "Демократизация Стратегии.",
      sub: "Набор local-first инструментов для бизнес-решений. Без слежки. Без серверов. Ничего не покидает ваш браузер.",
      cta: "Открыть Инструменты",
    },
    mission: {
      title: "Манифест",
      text: "Стратегическое мышление не должно быть привилегией. Мы создаём «Когнитивные Экзоскелеты»: инструменты, которые убирают шум и эмоции из ваших решений.",
    },
    modules: {
      title: "Модули",
      sub: "Бесплатные local-first инструменты. Сделаны так, чтобы работать при строгих политиках данных. Ничего не покидает ваш браузер. Сверьтесь со своей политикой.",
      live: "Работают",
      coming: "Дальше",
      empty: "Инструментов пока нет.",
      submit: "Предложить инструмент",
      status: {
        live: "работает",
        next: "следующий",
        planned: "в плане",
        idea: "идея",
        retired: "в архиве",
      },
    },
    support: {
      title: "Поддержать лабораторию",
      kofi: "Ko-fi, разово или ежемесячно",
      github: "GitHub Sponsors",
      bmc: "Buy Me a Coffee",
      not_set: "Ссылки для поддержки ещё не настроены.",
      byok_title: "Ваш ключ и ваш кофе",
      byok_text:
        "Умные функции работают на вашем собственном ключе Anthropic: запросы идут из вашего браузера напрямую в Anthropic, через лабораторию ничего не проходит. Ваш ключ оплачивает ваше использование. Ваш кофе оплачивает создание следующего инструмента.",
      covers_title: "На что идут деньги",
      shipped: "Инструментов за этот месяц: {n}",
    },
    subscribe: {
      title: "Инструмент раз в неделю",
      text: "Один новый инструмент каждый вторник. Одно письмо в неделю, без трекинг-пикселей, отписка в один клик. Рассылка живёт на отдельной странице, никогда внутри инструмента.",
      cta: "Подписаться",
      not_set: "Рассылка ещё не настроена.",
    },
    footer: {
      support: "Поддержать лабораторию",
      subscribe: "Инструмент раз в неделю",
      submit: "Предложить инструмент",
    },
  },
} as const;

export type Dictionary = typeof dictionary.en;
