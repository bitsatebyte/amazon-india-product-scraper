const puppeteer = require('puppeteer');
const csvwriter = require('./csv_writer');

const MAX_PAGE_COUNT = 5;
let search_term;
let main_products_array = [];
const selectors = {
  product: 'sg-col-4-of-12 s-result-item s-asin sg-col-4-of-16 sg-col sg-col-4-of-20',
  sponsored: '#a-row a-spacing-micro',
  merchant: '#merchant-info',
  rating: '#reviewsMedley',
  review: '#cm-cr-dp-review-header',
  misc: '#detailBulletsWrapper_feature_div',
}

const prepareUri = (page_number, keyword) => {

  if(page_number === 1) {
    return `https://www.amazon.in/s?k=${keyword}&qid=1610663194&ref=sr_pg_1`
  }
  else {
  return `https://www.amazon.in/s?k=${keyword}&page=${page_number}&qid=1610663194&ref=sr_pg_${page_number}`
  }
}

const reviewCheck = () => {
  const isThereAReview = document.querySelectorAll(selectors.rating)[0].innerText;
  if(isThereAReview == 'No customer reviews') {
    return 0;
  }
  return 1;
}

const addsPlusesBetweenKeywords = (keyword) => keyword.replace(/\s/g, '+');

const Product = (product_name, sponsored=0, price, rating, review_count, brand_name, asin, seller, url) => ({product_name, sponsored, price, rating, review_count, brand_name, asin, seller, url});

const pullsData = () => document.getElementsByClassName(selectors.product);

const pullsOtherData = (selector) => document.querySelectorAll(selector)

const keywords = ['hydroponic nutrient solution', 'nutrient solution', 'leafy nutrients', 'one part nutrients', 'two part nutrients', 'three part nutrients'];


(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 926 });

  for(j = 0; j < keywords.length; j++) {

    let keyword = keywords[j];
    keyword = addsPlusesBetweenKeywords(keyword);

    for(i = 1; i <= MAX_PAGE_COUNT; i++) {

      let url = prepareUri(i, keyword);

      await page.goto(url);
      await page.evaluate(() => console.log(document));
      const products = page.evaluate(pullsData(page, selectors));

      for(i = 0; i < products.length; i++) {
      
        // init product object
      
        let product_data = Product();

        let check_sponsored = products[i].childNodes[0].childNodes[1].childNodes[1].childNodes[1].childNodes[1].childNodes[1].childNodes[5].childNodes[1].className;

        /* -------------------------------
        # Data scraping starts from here
        # -------------------------------*/

        product_data['product_name'] = products[i].childNodes[0].childNodes[1].childNodes[1].childNodes[1].childNodes[5].innerText;
        check_sponsored == selectors.sponsored ? product_data['sponsored'] = 1 : product_data['sponsored'] = 0;
        product_data['price'] = products[i].childNodes[0].childNodes[1].childNodes[1].childNodes[1].childNodes[9].childNodes[1].childNodes[0].childNodes[0].childNodes[1].childNodes[1].childNodes[1].childNodes[1].innerText;
        product_data['review_count'] = products[i].childNodes[0].childNodes[1].childNodes[1].childNodes[1].childNodes[7].childNodes[1].childNodes[3].innerText;
        product_data['url'] = products[i].childNodes[0].childNodes[1].childNodes[1].childNodes[1].childNodes[3].childNodes[1].href;

        // Now go to the specific product page for other product details (rating, brand_name, asin, seller)
        
        await page.goto(product_data['url']);

	const other_products = await page.evaluate(pullsOtherData);

	await page.evaluate(reviewCheck) ? product_data['rating'] = page.$$('#'+selectors.rating)[0].childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes[0].innerText.slice(0, 3)
	              : product_data['rating'] = 0;
        product_data['rating'] = await page.$$('#'+selectors.rating)[0].childNodes[0].childNodes[0].childNodes[1].childNodes[0].childNodes[0].innerText.slice(0, 3) 
	product_data['brand_name'] = other_products[0].childNodes[7].childNodes[1].childNodes[5].childNodes[0].childNodes[3].innerText;
        product_data['asin'] = other_products[0].childNodes[7].childNodes[1].childNodes[7].childNodes[0].childNodes[3].innerText;
        product_data['seller'] = await page.$$('#'+selectors.merchant)[0].childNodes[1].innerText;
	console.log(typeof(product_data));
        
        // push it to the main_products_array
     
        main_products_array.push(product_data);
      }

    }
  }

  await browser.close();
})();

csvwriter(main_products_array);
