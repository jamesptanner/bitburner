const fs = require('node:fs');
const {dist} = require('./config');

if (!fs.existsSync(dist)){
  fs.mkdirSync(dist);
}