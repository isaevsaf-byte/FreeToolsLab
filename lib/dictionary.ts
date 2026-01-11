export type Language = "en" | "ru";

export const dictionary = {
  en: {
    nav: {
      tools: "Modules",
      support: "Support Lab"
    },
    hero: {
      badge: "SYSTEM: OPERATIONAL",
      title: "Strategic Intelligence. Democratized.",
      sub: "A suite of local-first cognitive tools. No tracking. No servers. Open access for the sovereign mind.",
      cta: "Access Tools"
    },
    mission: {
      title: "The Manifesto",
      text: "High-level strategic thinking shouldn't be a privilege. We build 'Cognitive Exoskeletons'—tools that help you think clearer, faster, and without bias."
    },
    tools: {
      tender: {
        title: "TenderLens",
        desc: "Weighted Decision Matrix. Mathematically sound sourcing & hiring."
      },
      deep: {
        title: "DeepCure",
        desc: "Root Cause Analysis (5 Whys). Recursive problem solving."
      },
      request: {
        title: "Request Protocol",
        desc: "Suggest a mental model for digitization."
      }
    },
    support_modal: {
      title: "Value for Value",
      text: "FreeToolsLab is a public good. No paywalls. If a tool helped you earn money or clarity, you can fuel the next experiment.",
      coffee: "Buy me a Coffee",
      stripe: "Support via Stripe",
      crypto: "Copy USDT Address"
    }
  },
  ru: {
    nav: {
      tools: "Модули",
      support: "Поддержать"
    },
    hero: {
      badge: "СТАТУС: АКТИВЕН",
      title: "Демократизация Стратегии.",
      sub: "Набор local-first инструментов для мышления. Без слежки. Без серверов. Открытый доступ.",
      cta: "Открыть Инструменты"
    },
    mission: {
      title: "Манифест",
      text: "Стратегическое мышление не должно быть привилегией. Мы создаем «Когнитивные Экзоскелеты» — инструменты, которые убирают шум и эмоции из ваших решений."
    },
    tools: {
      tender: {
        title: "TenderLens",
        desc: "Матрица Решений. Математический подход к найму и выбору."
      },
      deep: {
        title: "DeepCure",
        desc: "Анализ Первопричин (5 Почему). Рекурсивный поиск корня проблемы."
      },
      request: {
        title: "Запрос",
        desc: "Предложить ментальную модель для оцифровки."
      }
    },
    support_modal: {
      title: "Ценность за Ценность",
      text: "Лаборатория бесплатна. Если инструмент помог вам заработать или сэкономить, вы можете поддержать разработку.",
      coffee: "Купить кофе",
      stripe: "Поддержать через Stripe",
      crypto: "Скопировать USDT"
    }
  }
} as const;

export type Dictionary = typeof dictionary.en;