module.exports = {

  // Builds the URL
  makeUri: function (pgNo, keyword) {
    if( pgNo == 1 ) {
      return `https://www.amazon.in/s?k=${keyword}&qid=1610892863&ref=sr_pg_1`
    }
    else {
      return `https://www.amazon.in/s?k=${keyword}&page=${pgNo}&qid=1610892863&ref=sr_pg_${pgNo}` 
    }
  },

  // Builds the keyword
  addsPlusesBetweenKeywords: function (keyword) {
    return keyword.replace(/\s/g, '+');
  },

  // Writes to CSV
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

  // Gets brand name and ASIN
  getBrandName: function(arr) {
    ret = {};
    arr.forEach(el => {
      isAsin = el.slice(0, 6) == 'ASIN :' ? true : false; 
      isMan = el.slice(0, 14) == 'Manufacturer :' ? true : false;
      if(isAsin) ret.asin = el.slice(7);
      if(isMan) ret.man = el.slice(15);
    });
    return ret;
  },

  // Checks for reviews
  reviewCheck: function(el) {
    if(el == 'No customer reviews') {
      return false;
    }
    return true;
  },

  _getProducts: async function (pg, sPg) {
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


      /* THIRD LOOP */

        for(k = 0; k < items.length; k++) {
      
	  // init product object

          let prod = Product();
	
	  // init pushable object, and array
          const pushable = {};
	  const _arr = [];
          
          const isSponsored = await items[k].$(selectors.sponsored);

          // Try catch blocks because some products don't have certain fields

	  let checkReview, checkPrice;

          try {
            checkReview = await items[k].$eval(selectors.reviewSel, e => e.innerText);
          }
          catch (e) {
            prod['review_count'] = 0
          }
          checkReview ? prod['review_count'] = checkReview : null; 

          try {
            checkPrice = await items[k].$eval(selectors.price, e => e.innerText);
          }
          catch (e) {
            prod['price'] = 0;
          }
          checkPrice ? prod['price'] = checkPrice : null;

          isSponsored == null ? prod['sponsored'] = 0 : prod['sponsored'] = 1;
          prod['product_name'] = await items[k].$eval(selectors.pName, e => e.innerText);
          prod['url'] = await items [k].$eval(selectors.url, e => e.href); 

          await sPg.goto(prod['url'], { 'waitUntil': 'networkidle2' });

          const isRated = await sPg.$eval(selectors.review, e => e.innerText);
	  const details = await sPg.$$eval(selectors.misc, el => el.map(e => e.innerText));
	  const manAsin = getBrandName(details); 

          prod['rating'] = reviewCheck(isRated) ? await sPg.$eval(selectors.rating, e => e.innerText.slice(0, 3)) : 0;
          prod['seller'] = await sPg.$eval(selectors.merchant, e => e.innerText); 
          prod['asin'] = manAsin.asin;
	  prod['brand_name'] = manAsin.man;
          _arr.push(prod);
          pushable.keyword = keyword[i];
	  pushable._arr = _arr;
          products.push(pushable);
          console.log(pushable);
        };
      };

    };


    return products;
  },
}
