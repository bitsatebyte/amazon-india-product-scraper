module.exports = {
  makeUri: function (pgNo, keyword) {
    if( pgNo == 1 ) {
      return `https://www.amazon.in/s?k=${keyword}&qid=1610892863&ref=sr_pg_1`
    }
    else {
      return `https://www.amazon.in/s?k=${keyword}&page=${pgNo}&qid=1610892863&ref=sr_pg_${pgNo}` 
    }
  },

  addsPlusesBetweenKeywords: function (keyword) {
    return keyword.replace(/\s/g, '+');
  },

  csvWriter: function (arr) {
    const fs = require('fs');
    const csv = require('fast-csv');
    const ws = fs.createWriteStream('amazon_products.csv');

    csv.write(arr, { headers: true })
       .pipe(ws);
  },

  keywords: [
    'hydroponic nutrient solution',
    'nutrient solution',
    'one part nutrients',
    'two part nutrient',
    'leafy nutrients',
  ],

  getBrandName: function(arr) {
    ret = {};
    arr.forEach(el => {
      console.log(el);
      isAsin = el.slice(0, 6) == 'ASIN :' ? true : false; 
      isMan = el.slice(0, 14) == 'Manufacturer :' ? true : false;
      if(isAsin) ret.asin = el.slice(7);
      if(isMan) ret.man = el.slice(15);
      console.log(`isAsin: ${isAsin} \n isMan: ${isMan}`);
    });
    return ret;
  },

  reviewCheck: function(el) {
    if(el == 'No customer reviews') {
      return false;
    }
    return true;
  },

  _getProducts: async function (pg) {
    const selectors = require('./selectors');
    const addsPlusesBetweenKeywords = module.exports.addsPlusesBetweenKeywords;
    const makeUri = module.exports.makeUri;
    const reviewCheck = module.exports.reviewCheck;
    const getBrandName = module.exports.getBrandName;
    const keywords = module.exports.keywords;

    const MAX_PAGE_COUNT = 5;
    const products = [];

    // Product Constructor - closure

    const Product = (
     product_name,
     sponsored=0,
     price,
     rating,
     review_count,
     brand_name,
     seller,
     url
    ) => {
      return {
        product_name,
        sponsored,
        price,
        rating,
        review_count,
        brand_name,
        seller,
        url
      } 
    };

  /* FIRST LOOP */

    for(i = 0; i < keywords.length; i++) {
      const keyword = addsPlusesBetweenKeywords(keywords[i]);     

    /* SECOND LOOP */

      for(j = 1; j <= MAX_PAGE_COUNT; j++) {
        console.log(`Page Number ${j}`);
        let uri = makeUri(j, keyword);  
        console.log(`Current URL: ${uri}`);

        await pg.goto(uri, { 'waitUntil': 'networkidle2' });

        const items = await pg.$$(selectors.product);

      // init product object

      /* THIRD LOOP */

        for(k = 0; k < items.length; k++) {

          let checkReview, checkPrice, prod = Product();
          
          const isSponsored = await items[k].$(selectors.sponsored);

          // Try catch blocks because some products don't have certain fields

          try {
            checkReview = await items[k].$eval(selectors.reviewSel, e => e.innerText);
          }
          catch (e) {
            e ? prod['review_count'] = 0 : prod['review_count'] = checkReview;
          }

          try {
            checkPrice = await items[k].$eval(selectors.price, e => e.innerText);
          }
          catch (e) {
            e ? prod['price'] = 0 : prod['price'] = checkPrice;
          }

          isSponsored == null ? prod['sponsored'] = 0 : prod['sponsored'] = 1;
          prod['product_name'] = await items[k].$eval(selectors.pName, e => e.innerText);
          prod['url'] = await items [k].$eval(selectors.url, e => e.href); 

          await pg.goto(prod['url'], { 'waitUntil': 'networkidle2' });
	
          const isRated = await pg.$eval(selectors.review, e => e.innerText);
	  const details = await pg.$$eval(selectors.misc, el => el.map(e => e.innerText));
	  const manAsin = getBrandName(details); 

          prod['rating'] = reviewCheck(isRated) ? await pg.$eval(selectors.rating, e => e.innerText.slice(0, 3)) : 0;
          prod['seller'] = await pg.$eval(selectors.merchant, e => e.innerText); 
          prod['asin'] = manAsin.asin;
	  prod['brand_name'] = manAsin.man;
          console.log(prod);
          products.push(prod);
        };
      };

    };


    return products;
  },
}
