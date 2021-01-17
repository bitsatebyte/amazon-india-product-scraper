const puppeteer = require('puppeteer');
const selectors = require('./selectors');
const utils = require('./utils');

const {
  makeUri,
  addsPlusesBetweenKeywords,
  csvWriter,
  keywords,
} = utils;

const products = [];

const MAX_PAGE_SIZE = 5;

// product object constructor

const Product = (product_name, sponsored=0, price, rating, review_count, brand_name, asin, seller, url) => ({product_name, sponsored, price, rating, review_count, brand_name, asin, seller, url});



