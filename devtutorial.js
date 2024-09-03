// //original given code
// /**
//  * scraper-javascript.js
//  * To run this script, copy and paste `node scraper-javascript.js` in the terminal
//  */

// const cheerio = require('cheerio');

// (async () => {
//   const url = 'https://www.example.com';
//   const response = await fetch(url);

//   const $ = cheerio.load(await response.text());
//   //console.log($.html());

//   const title = $('h1').text();
//   const text = $('p').text();
//   const link = $('a').attr('href');

//   console.log(title);
//   console.log(text);
//   console.log(link);
// })();


const axios = require('axios');
const cheerio = require('cheerio');  // new addition

async function scrapeSite(keyword) {
    const url = `https://www.google.com/search?gl=us&q=${keyword}&tbm=isch`;
    const { data } = await axios.get(url);

    const $ = cheerio.load(data);

    const results = [];
    $('table.RntSmf').each((i, elem) => {
        const imgSrc = $(elem).find('img').attr('src');
        const text = $(elem).find('span:first-child').text();
        results.push({ imgSrc, text });
    });

    return results;
}
const keyword = "coffee"; // change with any keyword you want


scrapeSite(keyword).then(result => {
    console.log(result)
}).catch(err => console.log(err));
