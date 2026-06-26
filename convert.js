const pngToIco = require('png-to-ico');
const fs = require('fs');

pngToIco('icons/icon.png')
  .then(buf => {
    fs.writeFileSync('icons/icon.ico', buf);
    console.log('Icon converted!');
  })
  .catch(console.error);
