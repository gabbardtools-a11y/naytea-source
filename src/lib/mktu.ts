export interface MktuClass {
  number: number
  title: string
}

export const MKTU_CLASSES: MktuClass[] = [
  { number: 1, title: 'Химические продукты' },
  { number: 2, title: 'Краски, олифа' },
  { number: 3, title: 'Парфюмерия, косметика' },
  { number: 4, title: 'Горючее, масла' },
  { number: 5, title: 'Фармацевтика' },
  { number: 6, title: 'Металлы' },
  { number: 7, title: 'Машины, оборудование' },
  { number: 8, title: 'Ручной инструмент' },
  { number: 9, title: 'Электроника, ПО, приборы' },
  { number: 10, title: 'Медицинская техника' },
  { number: 11, title: 'Осветительные приборы, отопление' },
  { number: 12, title: 'Транспорт' },
  { number: 13, title: 'Оружие, пиротехника' },
  { number: 14, title: 'Ювелирные изделия, часы' },
  { number: 15, title: 'Музыкальные инструменты' },
  { number: 16, title: 'Бумага, печатная продукция' },
  { number: 17, title: 'Резина, асбест' },
  { number: 18, title: 'Кожа, чемоданы' },
  { number: 19, title: 'Строительные материалы' },
  { number: 20, title: 'Мебель, зеркала' },
  { number: 21, title: 'Домашняя утварь' },
  { number: 22, title: 'Канаты, палатки' },
  { number: 23, title: 'Нити текстильные' },
  { number: 24, title: 'Ткани' },
  { number: 25, title: 'Одежда, обувь' },
  { number: 26, title: 'Кружева, пуговицы' },
  { number: 27, title: 'Ковры, линолеум' },
  { number: 28, title: 'Игры, игрушки' },
  { number: 29, title: 'Мясо, рыба' },
  { number: 30, title: 'Кофе, чай, сахар' },
  { number: 31, title: 'Сельхозпродукция' },
  { number: 32, title: 'Пиво, безалкогольные напитки' },
  { number: 33, title: 'Алкогольные напитки' },
  { number: 34, title: 'Табак' },
  { number: 35, title: 'Реклама, торговля, менеджмент' },
  { number: 36, title: 'Финансы, страхование' },
  { number: 37, title: 'Строительство, ремонт' },
  { number: 38, title: 'Телекоммуникации' },
  { number: 39, title: 'Транспортировка, путешествия' },
  { number: 40, title: 'Обработка материалов' },
  { number: 41, title: 'Образование, развлечения' },
  { number: 42, title: 'IT, разработка ПО, научные услуги' },
  { number: 43, title: 'Питание, рестораны' },
  { number: 44, title: 'Медицинские услуги' },
  { number: 45, title: 'Юридические и охранные услуги' },
]

export function getMktuClass(n: number): MktuClass | undefined {
  return MKTU_CLASSES.find((c) => c.number === n)
}
