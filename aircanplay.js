const { firefox } = require('playwright');

(async () => {
  const url = 'https://www.aircanada.com/aeroplan/redeem/availability/outbound?org0=SEA&dest0=ICN&departureDate0=2024-12-26&ADT=1&YTH=0&CHD=0&INF=0&INS=0&lang=en-CA&tripType=O&marketCode=INT';

  // Specify the path to your Firefox user profile directory if needed
  const userProfilePath = 'C:\\Users\\User1\\AppData\\Roaming\\Mozilla\\Firefox\\Profiles\\your-profile'; // Update this path if you want to use a specific profile

  // Launch Firefox browser
  const browser = await firefox.launchPersistentContext(userProfilePath, {
    headless: false,
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
    await page.screenshot({ path: 'page_loaded_firefox.png', fullPage: true });
    console.log("Screenshot taken: page_loaded_firefox.png");

    // Wait for the element that contains the points to load
    await page.waitForSelector('.points-total', { timeout: 120000 });

    // Extract the text content of all elements matching the selector
    const points = await page.$$eval('.points-total', elements => elements.map(el => el.textContent.trim()));

    console.log("Points found:", points);

  } catch (error) {
    console.error("Failed to find the selector within the extended timeout period or other error occurred:", error);
  } finally {
    // Close the browser
    await browser.close();
  }
})();
