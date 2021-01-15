const fs = require('fs');
const csv = require('fast-csv');
const ws = fs.createWriteStream('amazon_products.csv');


module.exports = function csvWriter(arr) {
 csv.write(arr, { headers: true })
    .pipe(ws);
}
