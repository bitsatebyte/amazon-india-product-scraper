module.exports = {

  // Builds the URL
  makeUri: function (pgNo, keyword) {
    if (pgNo == 1) {
      return `https://www.amazon.in/s?k=${keyword}&qid=1611858134&ref=sr_pg_1`
    }
    else {
      return `https://www.amazon.in/s?k=${keyword}&page=${pgNo}&qid=1611858134&ref=sr_pg_${pgNo}`
    }
  },

  // Builds the keyword to give to makeUri func
  addsPlusesBetweenKeywords: function (keyword) {
    return keyword.replace(/\s/g, '+');
  },

  // Writes to CSV
  csvWriter: function (arr, name) {
    const fs = require('fs');
    const csv = require('fast-csv');
    const ws = fs.createWriteStream(`${name.replace(/\s/g, '_')}.csv`);

    csv.write(arr, { headers: true })
      .pipe(ws);
  },

  // Gets brand name
  getBrandName: function (arr, secondArr, key) {
    let ret;
    if (!key && Array.isArray(arr)) {
      let isMan, isBrand;
      arr.forEach(el => {
        isMan = el.slice(0, 14) == 'Manufacturer :' ? true : false;
        isBrand = el.slice(0, 7) == 'Brand :' ? true : false;
        if (!ret && isMan) ret = el.slice(15);
        if (isBrand) ret = el.slice(8);
      });
      return ret;
    }
    if (key && Array.isArray(arr)) {
      arr.forEach((el, index) => {
        let isMan, isBrand;
        isMan = el == 'Manufacturer' ? true : false;
        isBrand = el == 'Brand' ? true : false;
        if (isMan || isBrand) ret = secondArr[index];
      });
    }
    if (!ret) return null;

    return ret;
  },

  getAsinIndex: function (uri) {
    console.log(uri);
    const reg = /\/dp\//g;
    const match = reg.exec(uri);
    return match.index;
  },

  // Checks for reviews
  reviewCheck: function (el) {
    if (el == 'No customer reviews') {
      return false;
    }
    return true;
  },

  // Checks if rating is only single number
  isRatingSingle: function (r) {
    if (r[2] == 'o') {
      return r.slice(0, 1);
    }
    return r.slice(0, 3);
  },

  // Try-Catch functions for all data-points since amazon's shitty product page templates are not standardized.
  tryName: async function (sel, item) {
    let ret;

    try {
      ret = await item.$eval(sel, e => e.innerText);
    }
    catch (e) {
      ret = false;
    }

    return ret;
  },

  tryBrand: async function (pg, sel) {
    let ret = {};
    try {
      await pg.waitForSelector(sel[0], { timeout: 3000 });
      ret['details'] = await pg.$$eval(sel[0], el => el.map(e => e.innerText));
      ret['brand'] = await pg.$$eval(sel[5], el => el.innerText.substring(7));
    }
    catch (e) {
      try {
        await pg.waitForSelector(sel[1], { timeout: 3000 });
        const firstTableHeaders = await pg.$$eval(sel[1], el => el.map(e => e.innerText)),
          secondTableHeaders = await pg.$$eval(sel[2], el => el.map(e => e.innerText)),
          firstTableData = await pg.$$eval(sel[3], el => el.map(e => e.innerText)),
          secondTableData = await pg.$$eval(sel[4], el => el.map(e => e.innerText)),
          _tempHeaders = [...firstTableHeaders, ...secondTableHeaders],
          _tempData = [...firstTableData, ...secondTableData];
        ret['brand'] = getBrandName(_tempHeaders, _tempData, 1);
      }
      catch (e) {
        try {
          await pg.waitForSelector(sel[5], { timeout: 3000 });
          ret['brand'] = await pg.$eval(sel[5], el => el.innerText.substring(7));
        }
        catch (e) {
          ret['brand'] = null;
        }
      }
    }

    return ret
  },

  // Checks for review count (eg: 120 reviews)
  tryReviewCount: async function (sel, item) {
    let ret;

    try {
      ret = await item.$eval(sel, e => e.innerText);
    }
    catch (e) {
      ret = 0;
    }

    return ret;
  },

  /*=================================================
   * For some weird reason, tryReviewCount is unable*
   * to get the reviewCount all the time.           *
   * This is why, reviewCount is checked twice, once*
   * on the search results page, and again on the   *
   * specific product page.                         *
   *================================================*/
  tryForReviewCountAgain: async function (pg, sel) {
    let ret;

    try {
      ret = await pg.$eval(sel, e => e.innerText);
    }
    catch (e) {
      ret = null;
    }

    if (ret != null) return ret.substring(0, (ret.indexOf('g') - 1));
    return ret;
  },

  // Checks for the Rating (eg: 4.3, 4, 3.2, 5, 1.3)
  tryRating: async function (pg, sel) {
    let ret;

    try {
      ret = await pg.$eval(sel[0], e => e.innerText);
    }
    catch (e) {
      try {
        ret = await pg.$eval(sel[1], e => e.innerText);
      }
      catch (e) {
        ret = null;
      }
    }

    return ret;
  },

  // Checks for the price of the product
  tryPrice: async function (sel, item) {
    let ret;

    try {
      ret = await item.$eval(sel, e => e.innerText);
    }
    catch (e) {
      ret = 0;
    }

    return ret;
  },

  // Checks if the product is sponsored
  trySponsored: async function (sel, item) {
    let ret;

    try {
      ret = await item.$(sel);
    }
    catch (e) {
      ret = null;
    }

    if (ret == null) return 0;
    return 1;
  },

  // Tries to fetch the merchant/seller of the product
  tryMerch: async function (pg, sel) {

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

    let ret = {};
    try {
      ret['isBook'] = false;
      await pg.waitForSelector(sel[0], { timeout: 3000 });
      ret['merch'] = await pg.$eval(sel[0], e => e.innerText);
    }
    catch (e) {
      try {
        ret['isBook'] = true;
        await pg.waitForSelector(sel[1], { timeout: 3000 });
        ret['merch'] = await pg.$eval(sel[1], e => e.innerText);
      }
      catch (e) {
        try {
          ret['isBook'] = true;
          await pg.waitForSelector(sel[2], { timeout: 3000 });
          ret['merch'] = await pg.$eval(sel[2], e => e.innerText);
        }
        catch (e) {
          ret['isBook'] = false;
          ret['merch'] = 'Third-Party Store';
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
      keywords = require('./config.js').keywords,
      PAGE_COUNT = require('./config.js').PAGE_COUNT,
      products = [];

    /*==========================================================
     *---------------------------------------------------------*
     *                 TRY CATCH FUNCTION REFS                 *
     *---------------------------------------------------------*
     *=========================================================*/

    const tryName = module.exports.tryName,
      tryPrice = module.exports.tryPrice,
      trySponsored = module.exports.trySponsored,
      tryBrand = module.exports.tryBrand,
      tryMerch = module.exports.tryMerch,
      tryRating = module.exports.tryRating,
      tryReviewCount = module.exports.tryReviewCount,
      tryForReviewCountAgain = module.exports.tryForReviewCountAgain;



    // Product Constructor - closure

    const Product = (
      productName,
      sponsored = 0,
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

    for (i = 0; i < keywords.length; i++) {
      const keyword = addsPlusesBetweenKeywords(keywords[i]);
      const _arr = [];

      /* SECOND LOOP */

      for (j = 1; j <= PAGE_COUNT; j++) {
        console.log(`Page Number ${j}`);
        // construct uri
        let uri = makeUri(j, keyword);
        console.log(`Current URL: ${uri}`);

        await pg.goto(uri, { 'waitUntil': 'networkidle2' });

        // This gets the product details from the search page
        const items = await pg.$$(selectors.product);


        /* THIRD LOOP */

        for (k = 0; k < items.length; k++) {

          // pull out the current item

          const item = items[k]

          // init product object

          let prod = Product();

          // Scraping work starts here 

          console.log(`Current Element: ${k + 1} of ${items.length}`);

          const checkName = await tryName(selectors.pName, item),
            checkSponsored = await trySponsored(selectors.sponsored, item),
            checkPrice = await tryPrice(selectors.price, item);



          prod['url'] = await item.$eval(selectors.url, e => e.href);
          prod['productName'] = checkName || 'NA';
          prod['sponsored'] = checkSponsored;
          prod['price'] = checkPrice || 0;

          // go to specific product page in second-page (new-tab)
          await sPg.goto(prod['url'], { 'waitUntil': 'networkidle2' });

          const checkRating = await tryRating(sPg, [selectors.rating, selectors.noRating]),
            checkReview = await tryReviewCount(selectors.reviewCountSel, item),
            checkReviewAgain = await tryForReviewCountAgain(sPg, selectors.ratingDataHook);
          checkMerch = await tryMerch(sPg, [
            selectors.merchant,
            selectors.bookMerch,
            selectors.bookAuth
          ]),
            checkBrand = await tryBrand(sPg, [
              selectors.details,
              selectors.altDetailHead,
              selectors.altTechHead,
              selectors.altDetailData,
              selectors.altTechData,
              selectors.brand
            ]);

          let isItRated;
          if (checkRating) isItRated = reviewCheck(checkRating)
          else prod['rating'] = 0;
          const rating = isItRated ? isRatingSingle(checkRating) : 0;
          prod['rating'] = rating;
          prod['reviewCount'] = (checkReview && !(isNaN(checkReview))) ? checkReview : (checkReviewAgain || 0);
          prod['merchant'] = checkMerch.merch;
          prod['isBook'] = checkMerch.isBook;
          prod['brand'] = getBrandName(checkBrand.details) || (checkBrand.brand || 'NA');
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
