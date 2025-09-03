import { load, type CheerioAPI } from 'cheerio';

export type LottoOverview = Array<{ id: string; url: string; date: string }>

export type LottoDetail = {
  date: string;
  endpoint: string;
  prizes: Array<{ id: string; name: string; reward: string; amount: number; number: string[] }>;
  runningNumbers: Array<{ id: string; name: string; reward: string; amount: number; number: string[] }>;
}

const scrapeText = (cheerio: CheerioAPI) => (selector: string) =>
  cheerio(selector)
    .map((_, el) => cheerio(el).text())
    .toArray();

export const getList = async (page: number): Promise<LottoOverview> => {
  const html = await fetch(`https://news.sanook.com/lotto/archive/page/${page}`).then((o) => o.text());
  const $ = load(html);

  const res = (
    $(
      'div.box-cell.box-cell--lotto.content > div > div > div > article.archive--lotto'
    )
      .map((_, element) => {
        const titleElement = $(
          'div.archive--lotto__body > div > a > div > h3.archive--lotto__head-lot',
          element
        );
        const linkElement = $('div > div > a', element);

        const id = linkElement.attr('href')?.split('/')[5] ?? '';
        const rawTitleText = titleElement.text();
        const parsedTitle = rawTitleText.substring(
          rawTitleText.indexOf('ตรวจหวย') + 8
        );

        return {
          id,
          url: `/lotto/${id}`,
          date: parsedTitle,
        };
      })
      .toArray()
  ) as LottoOverview;

  return res;
};

export const getLotto = async (targetId: string | number): Promise<LottoDetail> => {
  const url = `https://news.sanook.com/lotto/check/${targetId}`;
  const html = await fetch(url).then((o) => o.text());
  const $ = load(html);
  const scraper = scrapeText($);

  const [date, prizeFirst, prizeFirstNear, prizeSecond, prizeThird, prizeForth, prizeFifth, runningNumberFrontThree, runningNumberBackThree, runningNumberBackTwo] = await Promise.all([
    $('#contentPrint > header > h2')
      .text()
      .substring($('#contentPrint > header > h2').text().indexOf(' ') + 1),
    scraper('#contentPrint > div.lottocheck__resize > div.lottocheck__sec.lottocheck__sec--bdnone > div.lottocheck__table > div:nth-child(1) > strong.lotto__number'),
    scraper('#contentPrint > div.lottocheck__resize > div.lottocheck__sec.lottocheck__sec--bdnone > div.lottocheck__sec--nearby > strong.lotto__number'),
    scraper('#contentPrint > div.lottocheck__resize > div:nth-child(2) > div > span.lotto__number'),
    scraper('#contentPrint > div.lottocheck__resize > div:nth-child(3) > div > span'),
    scraper('#contentPrint > div.lottocheck__resize > div.lottocheck__sec.lottocheck__sec--font-mini.lottocheck__sec--bdnoneads > div.lottocheck__box-item > span.lotto__number'),
    scraper('#contentPrint > div.lottocheck__resize > div:nth-child(7) > div > span.lotto__number'),
    scraper('#contentPrint > div.lottocheck__resize > div.lottocheck__sec.lottocheck__sec--bdnone > div.lottocheck__table > div:nth-child(2) > strong.lotto__number'),
    scraper('#contentPrint > div.lottocheck__resize > div.lottocheck__sec.lottocheck__sec--bdnone > div.lottocheck__table > div:nth-child(3) > strong.lotto__number'),
    scraper('#contentPrint > div.lottocheck__resize > div.lottocheck__sec.lottocheck__sec--bdnone > div.lottocheck__table > div:nth-child(4) > strong.lotto__number'),
  ]);

  return {
    date,
    endpoint: url,
    prizes: [
      { id: 'prizeFirst', name: 'รางวัลที่ 1', reward: '6000000', amount: prizeFirst.length, number: prizeFirst },
      { id: 'prizeFirstNear', name: 'รางวัลข้างเคียงรางวัลที่ 1', reward: '100000', amount: prizeFirstNear.length, number: prizeFirstNear },
      { id: 'prizeSecond', name: 'รางวัลที่ 2', reward: '200000', amount: prizeSecond.length, number: prizeSecond },
      { id: 'prizeThird', name: 'รางวัลที่ 3', reward: '80000', amount: prizeThird.length, number: prizeThird },
      { id: 'prizeForth', name: 'รางวัลที่ 4', reward: '40000', amount: prizeForth.length, number: prizeForth },
      { id: 'prizeFifth', name: 'รางวัลที่ 5', reward: '20000', amount: prizeFifth.length, number: prizeFifth },
    ],
    runningNumbers: [
      { id: 'runningNumberFrontThree', name: 'รางวัลเลขหน้า 3 ตัว', reward: '4000', amount: runningNumberFrontThree.length, number: runningNumberFrontThree },
      { id: 'runningNumberBackThree', name: 'รางวัลเลขท้าย 3 ตัว', reward: '4000', amount: runningNumberBackThree.length, number: runningNumberBackThree },
      { id: 'runningNumberBackTwo', name: 'รางวัลเลขท้าย 2 ตัว', reward: '2000', amount: runningNumberBackTwo.length, number: runningNumberBackTwo },
    ],
  };
};


