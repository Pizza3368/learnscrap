const { chromium } = require('playwright');

async function scrapeFlightData(targetDate) {
  // Format the target date to match the URL format (YYYY-MM-DD)
  const formattedDate = targetDate.toISOString().split('T')[0];

  // Construct the URL with the dynamic date
  const url = `https://www.aircanada.com/aeroplan/redeem/availability/outbound?org0=YVR&dest0=ICN&departureDate0=${formattedDate}&ADT=1&YTH=0&CHD=0&INF=0&INS=0&lang=en-CA&tripType=O&marketCode=INT`;

  // Specify the path to your Chrome user profile directory
  const userProfilePath = 'C:\\Users\\User1\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1'; // Update this path

  // Launch Chrome browser with persistent context
  const browser = await chromium.launchPersistentContext(userProfilePath, {
    headless: false,
    channel: 'chrome', // Use the Chrome browser
    args: [
      '--disable-web-security',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  const page = await browser.newPage();

  try {
    // Navigate to the URL and wait until the network is idle
    await page.goto(url, { waitUntil: 'networkidle' });

    // Take a screenshot after the page has loaded to help with debugging
    await page.screenshot({ path: `page_loaded_chrome_${formattedDate}.png`, fullPage: true });
    console.log(`Screenshot taken: page_loaded_chrome_${formattedDate}.png`);

    // Wait for the cabin elements to load
    await page.waitForSelector('.available-cabin', { timeout: 120000 });

    // Extract prices for each cabin class
    const prices = await page.evaluate(() => {
      const results = {};
      const cabins = document.querySelectorAll('.available-cabin');

      cabins.forEach(cabin => {
        const cabinClass = cabin.getAttribute('aria-label') || 'Unknown Class';
        const priceElement = cabin.querySelector('.points-total');
        
        if (priceElement) {
          const price = priceElement.textContent.trim();
          if (!results[cabinClass]) {
            results[cabinClass] = [];
          }
          results[cabinClass].push(price);
        }
      });

      return results;
    });

    // Print prices organized by cabin class
    for (const [cabinClass, pricesArray] of Object.entries(prices)) {
      console.log(`${cabinClass} options are: ${pricesArray.join(', ')}`);
    }

  } catch (error) {
    console.error("Failed to find the selector within the extended timeout period or other error occurred:", error);
  } finally {
    // Close the browser
    await browser.close();
  }
}

// Example usage
const targetDate = new Date('2024-10-21'); // Replace this with any desired date
scrapeFlightData(targetDate);
