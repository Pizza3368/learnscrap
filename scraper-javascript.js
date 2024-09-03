//original given code
/**
 * scraper-javascript.js
 * To run this script, copy and paste `node scraper-javascript.js` in the terminal
 */

const cheerio = require('cheerio');

(async () => {
  const url = 'https://www.aircanada.com/aeroplan/redeem/availability/outbound?org0=SEA&dest0=ICN&departureDate0=2024-12-26&ADT=1&YTH=0&CHD=0&INF=0&INS=0&lang=en-CA&tripType=O&marketCode=INT';
  const response = await fetch(url);

  const $ = cheerio.load(await response.text());
  console.log($.html());

  //const title = $('h1').text();
  //const text = $('p').text();
  //const link = $('a').attr('href');

  //console.log(title);
  //console.log(text);
  //console.log(link);
})();

