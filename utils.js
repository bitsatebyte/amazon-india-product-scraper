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

  csvWriter: function(arr) {
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
}
