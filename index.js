const puppeteer = require('puppeteer');
const selectors = require('./selectors');
const utils = require('./utils');

const {
  makeUri,
  addsPlusesBetweenKeywords,
  csvWriter,
  keywords,
  extract,
  _getProducts,
} = utils;

const products = [];

const MAX_PAGE_SIZE = 5;

// start puppeteer

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 926 });
  page.on('console', msg => console.log('PAGE LOG: ', msg.text()));

  const p = await _getProducts(page);
  products = [...products, ...p];
  console.log(products);


  await browser.close();
})();

