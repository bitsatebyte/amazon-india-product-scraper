const puppeteer = require('puppeteer');

const sel = '#detailBullets_feature_div li .a-list-item';
const newSel = 'span.a-size-medium.a-color-base';
const uri = 'https://www.amazon.in/GreenLoop-Pure-Hydroponic-Nutrients-LEAFY-200/dp/B078BHP7YC/ref=sr_1_5?dchild=1&keywords=hydroponic+nutrients&qid=1610973021&sr=8-5';
const _uri = 'https://www.amazon.in/Watering-Suitable-Terrace-Gardening-Kitchen/dp/B08PVTYLCL/ref=sr_1_47?dchild=1&keywords=hydroponic+nutrients&qid=1610964243&sr=8-47';

(async () => {
  const browser = await puppeteer.launch({
	headless: false,
  });
	const reviewCheck = (pg, el) => {
	  if(el == "No customer reviews") {
	    return null; 
	  }
	  else {
	    return 1;
	  }

	};
  function getBrandName (arr) {
    const ret = {};
    let isAsin, isMan;
    arr.forEach(el => {
      console.log(el);
      isAsin = el.slice(0, 6) == 'ASIN :' ? true : false; 
      isMan = el.slice(0, 14) == 'Manufacturer :' ? true : false;
      if(isAsin) ret.asin = el.slice(7);
      if(isMan) ret.man = el.slice(15);
      console.log(`isAsin: ${isAsin} \n isMan: ${isMan}`);
    });
    console.log(ret);
    
  }


	const page = await browser.newPage({ 'waitUntil': 'networkidle2'});
	await page.goto(uri);
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
	const ele = await page.$$eval(newSel, el => el.map(e => e.innerText));
	console.log(ele);

	await browser.close();
})();

