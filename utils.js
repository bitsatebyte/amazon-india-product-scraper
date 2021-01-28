module.exports = {

  // Builds the URL
  makeUri: function (pgNo, keyword) {
    if( pgNo == 1 ) {
      return `https://www.amazon.in/s?k=${keyword}&qid=1611691942&ref=sr_pg_1`
    }
    else {
      return `https://www.amazon.in/s?k=${keyword}&page=${pgNo}&qid=1611691942&ref=sr_pg_${pgNo}` 
    }
  },

  // Builds the keyword
  addsPlusesBetweenKeywords: function (keyword) {
    return keyword.replace(/\s/g, '+');
  },

  // Writes to CSV
  csvWriter: function (arr, name) {
    const fs = require('fs');
    const csv = require('fast-csv');
    const ws = fs.createWriteStream(`${name.replace(/\+/g, '_')}.csv`);

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
  getBrandName: function(arr, secondArr, key) {
    let ret;
    if(!key && Array.isArray(arr)) {
      let isMan, isBrand;
      arr.forEach(el => {
      isMan = el.slice(0, 14) == 'Manufacturer :' ? true : false;
      isBrand = el.slice(0, 7) == 'Brand :' ? true : false;
      if(isMan) ret = el.slice(15);
      if(isBrand) ret = el.slice(8);
      });
      return ret;
    } 
    if(Array.isArray(arr)) {
      arr.forEach((el, index) => {
        let isMan, isBrand;
        isMan = el == 'Manufacturer' ? true : false;
        isBrand = el == 'Brand' ? true : false;
        if(isMan || isBrand) ret = secondArr[index]; 
      });
    }
    return ret;
  },

  getAsinIndex: function(uri) {
    console.log(uri);
    const reg = /\/dp\//g;
    const match = reg.exec(uri);
    return match.index;
  },

  // Checks for reviews
  reviewCheck: function(el) {
    if(el == 'No customer reviews') {
      return false;
    }
    return true;
  },

  // Checks if rating is only single number
  isRatingSingle: function(r) {
    if(r[2] == 'o') {
      return r.slice(0,1);
    }
    return r.slice(0,3);
  },

  // Try-Catch functions for all data-points since amazon's shitty product page templates are not standardized.
  tryName: function(pg, sel, item) {
    let ret;
    
    try {
      ret = await items.$eval(sel, e => e.innerText);
    }
    catch (e) {
      ret = false; 
    }

    return ret;
  },

  tryBrand: function(pg, sel) {
    
  },

  tryReviewCount: function(pg, sel) {
    let ret;

    try {
      ret = await items[k].$eval(selectors.reviewSel, e => e.innerText);
    }
    catch (e) {
      ret = 0; 
    }

    return ret;
  },

  tryRating: function(pg, sel) {
    
  },

  tryPrice: function(pg, sel) {
    
  },

  trySponsored: function(pg, sel, item) {
    let ret;

    try {
      ret = await item.$(sel);
    }
    catch (e) {
      ret = null; 
    }

    ret == null ? return 0 : return 1;
  },

  tryMerch: function(pg, sel) {
    /*===============================================================================
    this nested try catch block has to check for different kinds of merchants
    this is because amazon has different kinds of products on its store
    like books(kindle/paperback), or it might be available from a different
    set of sellers altogether.
    The try-catch block below first checks for the basic merchant using sel,
    if not found, then it goes to check whether the given product is a book
    and if it has a merchant using bookSel.
    If product is not a book, it then goes on to select a different sel
    which is otherSel. If the merchant is still not found, dismiss it as third-party 
    =================================================================================*/

    let ret;
    try {
      await pg.waitForSelector(sel[0], { timeout: 5000 });
      ret['merch'] = await pg.$eval(sel[0], e => e.innerText);
      ret['isBook'] = false;
    }
    catch (e) {
      try {
        await pg.waitForSelector(sel[1], { timeout: 5000 });
        ret['merch'] = await pg.$eval(sel[1], e => e.innerText);
        ret['isBook'] = true;
      } 
      catch (e) {
        try {
          await pg.waitForSelector(sel[2], { timeout: 5000 });
          ret['merch'] = await pg.$eval(sel[2], e => e.innerText);
          ret['isBook'] = true;
        }
        catch (e) {
          ret['merch'] = 'Third-Party Store';
          ret['isBook'] = false;
        }
      }
    }

  return ret;
  },

  _getProducts: async function (pg, sPg) {
    // Refs to functions and variables
    const selectors = require('./selectors'),
    addsPlusesBetweenKeywords = module.exports.addsPlusesBetweenKeywords,
    makeUri = module.exports.makeUri,
    reviewCheck = module.exports.reviewCheck,
    getBrandName = module.exports.getBrandName,
    getAsinIndex = module.exports.getAsinIndex,
    isRatingSingle = module.exports.isRatingSingle,
    keywords = module.exports.keywords,
    MAX_PAGE_COUNT = 2,
    products = [];

    // Product Constructor - closure

    const Product = (
     productName,
     sponsored=0,
     price,
     rating,
     reviewCount,
     brand,
     merchant,
     url,
     isBook,
    ) => {
      return {
        productName,
        sponsored,
        price,
        rating,
        reviewCount,
        brand,
        merchant,
        url,
        isBook
      } 
    };

  /* FIRST LOOP */

    for(i = 0; i < keywords.length; i++) {
      const keyword = addsPlusesBetweenKeywords(keywords[i]);     
      const _arr = [];
      _arr.push({ keyword: keywords[i]});

    /* SECOND LOOP */

      for(j = 1; j <= MAX_PAGE_COUNT; j++) {
        console.log(`Page Number ${j}`);
        // construct uri
        let uri = makeUri(j, keyword);  
        console.log(`Current URL: ${uri}`);

        await pg.goto(uri, { 'waitUntil': 'networkidle2' });

        // This gets the product details from the search page
        const items = await pg.$$(selectors.product);


      /* THIRD LOOP */

        for(k = 0; k < items.length; k++) {
     
	  // init product object

          let prod = Product();

          // Try catch blocks because some products don't have certain fields

          let checkPrice;

          // Checks if price is there in the selected product item set
          try {
            checkPrice = await items[k].$eval(selectors.price, e => e.innerText);
          }
          catch (e) {
            console.log('Price not found');
            prod['price'] = 0;
          }
          checkPrice ? prod['price'] = checkPrice : prod['price'] = null;

          prod['url'] = await items [k].$eval(selectors.url, e => e.href);
          /*
          const indexOfAsin = getAsinIndex(prod.url);
          prod['asin'] = prod['url'].substring(indexOfAsin+4, indexOfAsin+14); // slice url to get asin;
          */

          // go to specific product page for other details
          await sPg.goto(prod['url'], { 'waitUntil': 'networkidle2' });

          let isRated;
          try {
            isRated = await sPg.$eval(selectors.review, e => e.innerText);
          }
	  catch (e) {
            prod['rating'] = null;
	  }
          const isItRated = reviewCheck(isRated);
          const rating = isItRated ? isRatingSingle(await sPg.$eval(selectors.rating, e => e.innerText)) : 0; 
          prod['rating'] = rating;
          // another try catch block for getting bullet details/product details
          let details, brand;
          try {
            await sPg.waitForSelector(selectors.details, { timeout: 5000 });
            details = await sPg.$$eval(selectors.details, el => el.map(e => e.innerText));
            brand = getBrandName(details);
          }
          catch (e) {
            try {
              await sPg.waitForSelector(selectors.altDetailsHead, { timeout: 5000 });
              const firstTableHeaders = await sPg.$$eval(selectors.altDetailHead, el => el.map(e => e.innerText));
              const secondTableHeaders = await sPg.$$eval(selectors.altTechHead, el => el.map(e => e.innerText));
              const firstTableData = await sPg.$$eval(selectors.altDetailData, el => el.map(e => e.innerText));
              const secondTableData = await sPg.$$eval(selectors.altTechData, el => el.map(e => e.innerText));
              const _tempHeaders = [...firstTableHeaders, ...secondTableHeaders];
              const _tempData = [...firstTableData, ...secondTableData];
              brand = getBrandName(_tempHeaders, _tempData, 1); 
            } 
            catch (e) {
              try {
	        await sPg.waitForSelector(selectors.brand, { timeout: 5000 });
	        brand = await sPg.$eval(selectors.brand, el => el.innerText.substring(7));
                prod['brand'] = brand;
              }
              catch (e) {
                prod['brand'] = 'Unbranded/Not Found';
              }
            }
          }
	  const manAsin = getBrandName(details); 

           /*===============================================================================
           this nested try catch block has to check for different kinds of merchants
           this is because amazon has different kinds of products on its store
           like books(kindle/paperback), or it might be available from a different
           set of sellers altogether.
           The try-catch block below first checks for the basic merchant using sel,
           if not found, then it goes to check whether the given product is a book
           and if it has a merchant using bookSel.
           If product is not a book, it then goes on to select a different sel
           which is otherSel. If the merchant is still not found, dismiss it as third-party 
           =================================================================================*/

          let checkMerch;
          try {
            await sPg.waitForSelector(selectors.merchant, { timeout: 5000 });
            checkMerch = await sPg.$eval(selectors.merchant, e => e.innerText);
            prod['isBook'] = false;
	  }
          catch (e) {
	    try {
              await sPg.waitForSelector(selectors.bookMerch, { timeout: 5000 });
              checkMerch = await sPg.$eval(selectors.bookMerch, e => e.innerText);
              prod['isBook'] = true;
	    } 
            catch (e) {
              try {
                await sPg.waitForSelector(selectors.bookAuth, { timeout: 5000 });
                checkMerch = await sPg.$eval(selectors.bookAuth, e => e.innerText);
                prod['isBook'] = true;
              }
              catch (e) {
                prod['merchant'] = 'Third-Party Store';
                prod['isBook'] = false;
              }
            }
	  }

          prod['merchant'] = checkMerch; 
	  prod['brand'] = manAsin;

          const checkReview = tryReview(pg, selectors.reviewCountSel, items[k]); 
          (checkReview && !(isNaN(checkReview)) && checkReview != null) ? (prod['reviewCount'] = checkReview) : (prod['reviewCount'] = 0); 

          prod['productName'] = tryName(pg, selectors.pName, items[k]) ? tryName(pg, selectors.pName, items[k]) : 'NA';
          prod['sponsored'] = trySponsored(pg, selectors.sponsored, items[k]);
          prod['price'] = ;
          prod['url'] = await items [k].$eval(selectors.url, e => e.href);

          // go to specific product page in second-page (new-tab)
          await sPg.goto(prod['url'], { 'waitUntil': 'networkidle2' });

          prod['rating'] = ;

          const checkMerch = tryMerch(sPg, [selectors.merchant, selectors.bookMerch, selectors.bookAuth]);
          prod['merchant'] = checkMerch.merch;
          prod['isBook'] = checkMerch.isBook;
          prod['brand'] = ;
          _arr.push(prod);
          console.log(prod);
        };
      };
        products.push(_arr);
	console.log(`pushed keyword: "${keywords[i]}" elements \nLength: ${_arr.length}`);
    };

    return products;
  },
}
