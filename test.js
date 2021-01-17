const puppeteer = require('puppeteer');

const str = 'hydroponic+nutrient+solution';
const sel = '.sg-col-4-of-12.s-result-item.s-asin.sg-col-4-of-16.sg-col.sg-col-4-of-20';

(async () => {
  const browser = await puppeteer.launch({
	headless: false,
  });
	const page = await browser.newPage({ 'waitUntil': 'networkidle2'});
	await page.goto(`https://www.amazon.in/s?k=${str}&ref=nb_sb_noss_1`);
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        const ele = await page.$$(sel);
        const someprom = await ele[0].$eval('.a-link-normal.a-text-normal', e => e.href);
        console.log(someprom);
        

	await browser.close();
})();
