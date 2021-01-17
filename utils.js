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

  _getProducts: async function (pg) {
    const selectors = require('./selectors');
    const addsPlusesBetweenKeywords = module.exports.addsPlusesBetweenKeywords;
    const makeUri = module.exports.makeUri;
    const keywords = module.exports.keywords;

    const MAX_PAGE_COUNT = 5;
    const products = [];
    console.log(selectors);

    // Product Constructor - closure

    const Product = (
     product_name,
     sponsored=0,
     price,
     rating,
     review_count,
     brand_name,
     asin,
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
        asin,
        seller,
        url
      } 
    };

  /* FIRST LOOP */

    for(i = 0; i < keywords.length; i++) {
      const keyword = addsPlusesBetweenKeywords(keywords[i]);     
      console.log(`Page Number ${i}`);

    /* SECOND LOOP */

      for(j = 1; j <= MAX_PAGE_COUNT; j++) {
        let uri = makeUri(j, keyword);  
        console.log(`Current URL: ${uri}`);

        await pg.goto(uri, { 'waitUntil': 'networkidle2' });

        const items = await pg.$$(selectors.product);

      // init product object

      /* THIRD LOOP */

        for(k = 0; k < items.length; k++) {

          // init product object
          let prod = Product();

          const isSponsored = await items[k].$(selectors.sponsored);
          const checkReview = await items[k].$eval('span.a-size-base', e => e.innerText);
          console.log(isSponsored);
          isSponsored == null ? prod['sponsored'] = 1 : prod['sponsored'] = 0;
          prod['product_name'] = await items[k].$eval('.a-size-base-plus.a-color-base.a-text-normal', e => e.innerText);
          prod['price'] = await items[k].$eval('span.a-price-whole', e => e.innerText); 
          prod['review_count'] = checkReview ? checkReview : 0; 
          prod['url'] = await items [k].$eval('.a-link-normal.a-text-normal', e => e.href); 
          console.log(prod);
          products.push(prod);
          
        };
      };

    };


    return products;
  },
}
