/** EN/RU strings for payment-terms-lens. Every key must exist in both languages (`npm run check`). */
export default {
  en: {
    name: "Payment Terms Lens",
    tagline: "What a change in payment terms does to you — and to a supplier this size.",
    status: "local-first",
    privacy: "Designed to be usable under strict data policies — nothing leaves your browser. Check your own policy.",
    inputs: {
      title: "Inputs",
      currency: "Currency",
      volume: { label: "Volume", unit: "units / year", source: "Your figure." },
      unit_cost: { label: "Unit cost", unit: "per unit", source: "Your figure." },
      saving: { label: "Expected saving", unit: "%", source: "Illustrative default. Edit it." },
    },
    results: {
      title: "Result",
      annual: "Annual cost today",
      after: "Annual cost after",
      delta: "Saving per year",
    },
    visual: {
      title: "Before vs after",
      before: "Before",
      after: "After",
      note: "{delta} saved per year at {pct}%",
    },
    actions: {
      copy: "Copy result",
      copied: "Copied",
      copy_failed: "Copy failed — select the text manually",
      csv: "Download CSV",
      downloaded: "CSV downloaded",
    },
    assumptions: {
      title: "Assumptions",
      f1: "annual = volume × unit cost",
      f2: "after = annual × (1 − saving %)",
      f3: "saving = annual − after",
      note: "Defaults are illustrative, not benchmarks. Edit every number.",
      disclaimer: "This is a calculator, not advice. Check the numbers against your own data.",
    },
    credit: {
      support: "Support the Lab",
      subscribe: "Get the weekly tool",
    },
    og: {
      kicker: "Free · local-first · no tracking",
      site: "freetoolslab.org",
    },
  },
  ru: {
    name: "Условия оплаты: обе стороны",
    tagline: "Что изменение условий оплаты делает с вами — и с поставщиком такого размера.",
    status: "local-first",
    privacy: "Сделано так, чтобы работать при строгих политиках данных — ничего не покидает ваш браузер. Сверьтесь со своей политикой.",
    inputs: {
      title: "Входные данные",
      currency: "Валюта",
      volume: { label: "Объём", unit: "единиц / год", source: "Ваша цифра." },
      unit_cost: { label: "Стоимость единицы", unit: "за единицу", source: "Ваша цифра." },
      saving: { label: "Ожидаемая экономия", unit: "%", source: "Иллюстративное значение. Измените его." },
    },
    results: {
      title: "Результат",
      annual: "Годовая стоимость сейчас",
      after: "Годовая стоимость после",
      delta: "Экономия в год",
    },
    visual: {
      title: "До и после",
      before: "До",
      after: "После",
      note: "{delta} экономии в год при {pct}%",
    },
    actions: {
      copy: "Скопировать результат",
      copied: "Скопировано",
      copy_failed: "Не скопировалось — выделите текст вручную",
      csv: "Скачать CSV",
      downloaded: "CSV скачан",
    },
    assumptions: {
      title: "Допущения",
      f1: "годовая = объём × стоимость единицы",
      f2: "после = годовая × (1 − экономия %)",
      f3: "экономия = годовая − после",
      note: "Значения по умолчанию иллюстративные, не бенчмарки. Измените каждую цифру.",
      disclaimer: "Это калькулятор, а не рекомендация. Сверьте цифры со своими данными.",
    },
    credit: {
      support: "Поддержать лабораторию",
      subscribe: "Инструмент раз в неделю",
    },
    og: {
      kicker: "Бесплатно · local-first · без трекинга",
      site: "freetoolslab.org",
    },
  },
};
