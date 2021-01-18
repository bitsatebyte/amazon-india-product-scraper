const puppeteer = require('puppeteer');

const sel = 'span.a-size-medium.a-color-base';

(async () => {
  const browser = await puppeteer.launch({
	headless: false,
  });
	const page = await browser.newPage({ 'waitUntil': 'networkidle2'});
	await page.goto('https://www.amazon.in/GreenLoop-Pure-Hydroponic-Nutrients-LEAFY-200/dp/B078BHP7YC/ref=sr_1_5?dchild=1&keywords=hydroponic+nutrients&qid=1610926814&sr=8-5');
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        const ele = await page.$eval(sel, e => e.innerText);
        console.log(ele);
        

	await browser.close();
})();
