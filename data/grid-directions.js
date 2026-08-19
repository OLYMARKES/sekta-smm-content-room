window.SEKTA_GRID_DIRECTIONS = {
  profile: {
    source: "data/typography/font-taste.json",
    likedFrames: 208,
    sourceFamilies: 294,
    sha256: "a586b30fa032abcbc796ea499e08b266bfb98d38324474d08106cbebd31e28b6"
  },
  posts: [
    { id: "minute", label: "Практика", headline: "Начните с одной минуты", image: "assets/proposed-covers/base/05-short-cardio-base.png", layout: "plate" },
    { id: "prime", label: "Продукт", headline: "Летний прайм", image: "assets/proposed-covers/base/01-summer-prime-base.png", layout: "band" },
    { id: "course", label: "Партнёрство", headline: "Забирайте свой курс", image: "assets/ideal/20_halo.jpg", layout: "clean" },
    { id: "tired", label: "Узнавание", headline: "Тренировка для тех, кто устал", image: "assets/proposed-covers/base/08-bootcamp-results-base.png", layout: "split" },
    { id: "desk", label: "Польза", headline: "Разминка во время рабочего дня", image: "assets/proposed-covers/base/11-standing-core-base.png", layout: "stack" },
    { id: "return", label: "Возвращение", headline: "Пропустили пять дней?", image: "assets/proposed-covers/base/12-soft-or-strong-base.png", layout: "plate" },
    { id: "seven", label: "Практика", headline: "7 минут — это тренировка", image: "assets/ideal/18_gym.jpg", layout: "band" },
    { id: "enough", label: "Позиция", headline: "Спорт не должен добивать", image: "assets/ideal/21_balance.jpg", layout: "clean" },
    { id: "slow", label: "Комьюнити", headline: "Можно медленно", image: "assets/ideal/22_runners.jpg", layout: "split" }
  ],
  directions: [
    {
      id: "pulse",
      number: "A",
      name: "Пульс",
      descriptor: "максимальная заметность",
      headlineFont: "Dela Gothic One",
      headlineFrame: "Dela Gothic One|upper",
      bodyFont: "Golos Text",
      bodyFrame: "Golos Text|lower",
      brightness: 100,
      register: "КАПС для 2–5 слов",
      palette: ["#3514ff", "#d9ff2f", "#ff5faf", "#fffdf7", "#171522"],
      thesis: "Громкий городской фитнес-журнал: человек, цвет и короткая команда считываются раньше деталей фотографии.",
      rhythm: "3 фото с плашкой · 2 сплита · 2 чистых фото · 2 цветовых плаката",
      rules: [
        "Заголовок — 2–5 слов, максимум четыре строки.",
        "В каждом ряду одна электрическая карточка, не три подряд.",
        "Лайм сообщает действие, розовый — человеческую интонацию, синий держит бренд.",
        "Dela Gothic One только на обложке; объяснения и карусель — Golos Text."
      ],
      goodFor: "Охват, челленджи, короткие тренировки, запуски.",
      risk: "Если каждый пост кричит одинаково, живые фотографии начинают казаться рекламными баннерами."
    },
    {
      id: "motion",
      number: "B",
      name: "Живое движение",
      descriptor: "рекомендуемый баланс",
      headlineFont: "Commissioner",
      headlineFrame: "Commissioner|lower",
      bodyFont: "Manrope",
      bodyFrame: "Manrope|lower",
      brightness: 82,
      register: "строчные, КАПС только в метке",
      palette: ["#3155e4", "#efadc4", "#d4f04a", "#ffffff", "#17221f"],
      thesis: "Одна гибкая спортивно-редакционная система: достаточно яркая для охвата, достаточно взрослая для позиции и доверия.",
      rhythm: "4 живых фото · 2 цветовых поля · 2 сплита · 1 почти чистый кадр",
      rules: [
        "Главный заголовок набирается строчными и держит естественную интонацию речи.",
        "Каждый третий пост получает чистое цветовое поле или широкий цветовой блок.",
        "Commissioner меняет плотность, но не гарнитуру: 760 для действия, 620 для истории.",
        "Manrope обслуживает даты, CTA и длинные слайды без декоративных акцентов."
      ],
      goodFor: "Основная сетка #Sekta: Reels, польза, позиция, комьюнити и продукт.",
      risk: "Нужна дисциплина в размере и цвете: гибкость Commissioner легко превратить в пять разных голосов."
    },
    {
      id: "editorial",
      number: "C",
      name: "Тело как редакция",
      descriptor: "спокойнее и взрослее",
      headlineFont: "Cormorant Garamond",
      headlineFrame: "Cormorant Garamond|lower",
      bodyFont: "Golos Text",
      bodyFrame: "Golos Text|lower",
      brightness: 56,
      register: "строчные; курсив — только смысл",
      palette: ["#173d35", "#f2b7cc", "#f5f0e8", "#ff654f", "#1b1b19"],
      thesis: "Не фитнес-реклама, а современный журнал о теле и жизни — с крупной антиквой, честной фотографией и резкими цветовыми паузами.",
      rhythm: "5 фото почти без вмешательства · 2 редакционных сплита · 2 типографические паузы",
      rules: [
        "Антиква появляется только крупно; мелкие подписи всегда Golos Text.",
        "Заголовок занимает свободное поле или отдельную плоскость, но не ложится на лицо.",
        "Один коралловый акцент на три поста не даёт сетке стать бежевой и тихой.",
        "Курсив отмечает одно слово или поворот мысли, а не весь заголовок."
      ],
      goodFor: "Истории, отношения с телом, позиционные тексты, интервью и комьюнити.",
      risk: "Слабее продаёт быстрые тренировки и может выглядеть слишком авторски для ежедневного аккаунта школы."
    },
    {
      id: "tempo",
      number: "D",
      name: "Темп",
      descriptor: "спортивная система",
      headlineFont: "PT Sans Narrow",
      headlineFrame: "PT Sans Narrow|upper",
      bodyFont: "Manrope",
      bodyFrame: "Manrope|lower",
      brightness: 72,
      register: "КАПС, короткие вертикальные блоки",
      palette: ["#f7f8f4", "#1f4fd8", "#ff5b4d", "#b9dfef", "#18212d"],
      thesis: "Функциональная графика спортивной секции: скорость, номера, узкие заголовки и много места для движения тела.",
      rhythm: "4 полноэкранных движения · 3 информационные полосы · 2 строгих плаката",
      rules: [
        "Узкий КАПС стоит вертикальным прямоугольником, а не растягивается на всю ширину.",
        "Белый остаётся активным цветом; синий и красный работают как сигналы.",
        "Даты, минуты и номера становятся частью навигации, не декором.",
        "В одном ряду только одна карточка с плотным текстовым блоком."
      ],
      goodFor: "Тренировки, инструкции, расписания, челленджи и беговое комьюнити.",
      risk: "Меньше теплоты для личных историй; их придётся вытаскивать фотографией и живой подписью."
    },
    {
      id: "warmth",
      number: "E",
      name: "Свои люди",
      descriptor: "мягкая дерзость",
      headlineFont: "Comfortaa",
      headlineFrame: "Comfortaa|lower",
      bodyFont: "Golos Text",
      bodyFrame: "Golos Text|lower",
      brightness: 66,
      register: "строчные и короткие вопросы",
      palette: ["#ff70aa", "#6b5ce7", "#d7f36a", "#fff7ee", "#25312c"],
      thesis: "Дружелюбная школа без фитнес-давления: округлая типографика, живые лица и цвет, который не превращается в детский wellness.",
      rhythm: "5 человеческих фото · 2 цветные реплики · 1 сплит · 1 типографическая карточка",
      rules: [
        "Comfortaa работает короткими вопросами и разговорными фразами до семи слов.",
        "Розовый и фиолетовый не накрывают фото — только отдельные плашки и поля.",
        "Лайм появляется у практического действия, а не как общий фон ленты.",
        "Golos Text возвращает взрослую ясность в инструкции и длинные карусели."
      ],
      goodFor: "Комьюнити, возвращение после паузы, самоирония, истории участников.",
      risk: "Для жёстких экспертных заявлений округлая пластика может оказаться слишком дружелюбной."
    }
  ]
};
