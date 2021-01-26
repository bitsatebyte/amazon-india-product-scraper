const puppeteer = require('puppeteer');

const an = '#merchant-info';
const sel = '#productDetails_detailBullets_sections1 th';
const newSel = '#productDetails_techSpec_section_1 th';
const _an = '#productDetails_techSpec_section_1 td';
const _san = '#productDetails_detailBullets_sections1 td';
const uri = 'https://www.amazon.in/Twin-Cities-Salto-Papad-Rings/dp/B082SYXGXH/ref=sr_1_83?almBrandId=More&dchild=1&fpw=alm&keywords=one+part+nutrients&qid=1610892863&sr=8-83';
const _uri = 'https://www.amazon.in/Watering-Suitable-Terrace-Gardening-Kitchen/dp/B08PVTYLCL/ref=sr_1_47?dchild=1&keywords=hydroponic+nutrients&qid=1610964243&sr=8-47';

(async () => {
  const browser = await puppeteer.launch({
	headless: false,
  });

  function getBrandName (arr, secondArr, key) {
    let ret;
    if(!key) {
      let isMan, isBrand;
      arr.forEach(el => {
      isMan = el.slice(0, 14) == 'Manufacturer :' ? true : false;
      isBrand = el.slice(0, 7) == 'Brand :' ? true : false;
      if(isMan) ret = el.slice(15);
      if(isBrand) ret = el.slice(8);
      });
      return ret;
    } 
    arr.forEach((el, index) => {
      let isMan, isBrand;
      isMan = el == 'Manufacturer' ? true : false;
      isBrand = el == 'Brand' ? true : false;
      if(isMan || isBrand) ret = secondArr[index]; 
    });
    return ret;
  }


	const page = await browser.newPage({ 'waitUntil': 'networkidle2'});
	await page.goto(_uri);
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
	let checkBrand, w, x, y, z;
	try {
	  checkBrand = await page.$$eval(an, el => el.map(e => e.innerText));
	}
	catch (e) {
	  console.log('executing catch block');
        }
        
	console.log(checkBrand[0]);
	if(!checkBrand.length) {
        const w = await page.$$eval(sel, el => el.map(e => e.innerText));
	const x = await page.$$eval(newSel, el => el.map(e => e.innerText));
	const y = await page.$$eval(_san, el => el.map(e => e.innerText));
	const z = await page.$$eval(_an, el => el.map(e => e.innerText));

	const arr = [...w, ...x];
	const _arr = [...y, ...z];
        console.log(arr);
        console.log(_arr);
        const a = getBrandName(arr, _arr, 1);
	console.log(a);
	}

	await browser.close();
})();

