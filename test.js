const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
	headless: false,
  });
	const page = await browser.newPage();
	await page.goto('https://www.amazon.in/');
	await page.evaluate(() => {
	console.log(document)	
	});
	

	await browser.close();
})();
