const puppeteer = require('puppeteer');
const utils = require('./utils');

const {
  csvWriter,
  keywords,
  _getProducts,
} = utils;

const products = [];

// start puppeteer

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  const secondPage = await browser.newPage();
  page.setViewport({ width: 1280, height: 926 });
  page.on('console', msg => console.log('PAGE LOG: ', msg.text()));

  const p = await _getProducts(page, secondPage);
  products = [...p];
  console.log(products);
  products.forEach(p => {
    fileName = p[0].keyword;
    csvWriter(products[i][1], fileName);
  });

  await browser.close();
})();

