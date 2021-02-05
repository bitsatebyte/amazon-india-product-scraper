const puppeteer = require('puppeteer');
const utils = require('./utils');
const keywords = require('./utils/config').keywords;

const {
  csvWriter,
  _getProducts,
} = utils;

let products = [];

// start puppeteer

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  /*----------------------------------------------------------------------*
    create two pages:                                                     *
      * one for scraping the generic records from the search results page *
      * another for navigating to the specific product page               *
  *----------------------------------------------------------------------*/
  const page = await browser.newPage();
  const secondPage = await browser.newPage();
  page.setViewport({ width: 1280, height: 926 });
  page.on('console', msg => console.log('PAGE LOG: ', msg.text()));

  const p = await _getProducts(page, secondPage);
  products = [...p];
  console.log(products);
  keywords.forEach((kw, index) => {
    fileName = kw;
    csvWriter(products[index], fileName);
  });

  await browser.close();
})();

