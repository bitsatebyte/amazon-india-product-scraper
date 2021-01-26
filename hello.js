const puppeteer = require('puppeteer');

const an = '#merchant-info';
const sel = '#productDetails_detailBullets_sections1 th';
const newSel = '#productDetails_techSpec_section_1 th';
const _an = '#productDetails_techSpec_section_1 td';
const _san = '#productDetails_detailBullets_sections1 td';
const _asan = '.print-sold-by td:nth-child(2)';
const uri = 'https://www.amazon.in/Twin-Cities-Salto-Papad-Rings/dp/B082SYXGXH/ref=sr_1_83?almBrandId=More&dchild=1&fpw=alm&keywords=one+part+nutrients&qid=1610892863&sr=8-83';
const _uri = 'https://www.amazon.in/Watering-Suitable-Terrace-Gardening-Kitchen/dp/B08PVTYLCL/ref=sr_1_47?dchild=1&keywords=hydroponic+nutrients&qid=1610964243&sr=8-47';
const _auri = 'https://www.amazon.in/Brillx-MicroPro-Nutrients-Hydroponics-Soilless/dp/B0773JSMYS/ref=sr_1_159?dchild=1&keywords=hydroponic+nutrients&qid=1611673368&sr=8-159';
const text = 'these sellers.';

(async () => {
  const browser = await puppeteer.launch({
	headless: false,
  });



	const page = await browser.newPage({ 'waitUntil': 'networkidle2'});
	await page.goto(_auri);
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
	let checkSeller, w, x, y, z;
	try {
	  await page.waitForSelector(an, { timeout: 5000 });
          console.log('executed first try block');
	}
	catch (e) {
	  console.log('executed first catch block');
	  try {
            await page.waitForSelector(_asan, { timeout: 5000 });
	    console.log('executed the second try block');
          } catch (e) {
            console.log('executed second catch block');
            try {
              await page.waitForSelector(somevar, { timeout: 5000 });
              console.log('executed third try block');
            }
            catch (e) {
              console.log('executing third catch block');
            }
	  }
        }
        const a = await page.waitForFunction(text => document.querySelector('body').innerText.includes(text), {}, text);
        console.log(a);

	await browser.close();
})();

