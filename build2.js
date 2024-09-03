const { chromium } = require('playwright');
const { MongoClient } = require('mongodb');

// Function to generate dates within a given range
function generateDateRange(startDate, endDate) {
    const dates = [];
    let currentDate = new Date(startDate);

    while (currentDate <= new Date(endDate)) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1); // Increment day by day
    }

    return dates;
}

// Function to clear cookies and cache
async function clearCookiesAndCache(page) {
    const client = await page.context().newCDPSession(page);
    await client.send('Network.clearBrowserCookies');
    await client.send('Network.clearBrowserCache');
    console.log('Cleared cookies and cache.');
}

async function scrapeFlightData(departure, destination, dateRange) {
    // MongoDB local connection string
    const uri = 'mongodb://127.0.0.1:27017'; // Connects to MongoDB running locally
    const client = new MongoClient(uri);

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
        // Clear cookies and cache
        await clearCookiesAndCache(page);

        // Connect to MongoDB
        await client.connect();
        const database = client.db('flightData');
        const flightsCollection = database.collection('flights');

        for (const targetDate of dateRange) {
            // Format the target date to match the URL format (YYYY-MM-DD)
            const formattedDate = targetDate.toISOString().split('T')[0];

            // Construct the URL with dynamic date, departure, and destination
            const url = `https://www.aircanada.com/aeroplan/redeem/availability/outbound?marketCode=INT&lang=en-CA&tripType=O&org0=${departure}&dest0=${destination}&departureDate0=${formattedDate}&ADT=1&YTH=0&CHD=0&INF=0&INS=0&isFlexible=false`;
            // Navigate to the URL and wait until the network is idle
            await page.goto(url, { waitUntil: 'networkidle' });

            // Wait for the cabin elements to load
            await page.waitForSelector('.available-cabin', { timeout: 120000 });

            // Extract prices for each cabin class
            const prices = await page.evaluate(() => {
                const results = [];
                const cabins = document.querySelectorAll('.available-cabin');

                cabins.forEach(cabin => {
                    const cabinClass = cabin.getAttribute('aria-label') || 'Unknown Class';
                    const priceElement = cabin.querySelector('.points-total');

                    if (priceElement) {
                        const priceText = priceElement.textContent.trim();
                        let mileage = parseFloat(priceText.replace(/[^\d.]/g, '')); // Remove any non-numeric characters

                        // Convert mileage from 'K' to actual numeric value
                        if (priceText.includes('K')) {
                            mileage *= 1000;
                        }
                        
                        // Filter by business class and mileage under 100k
                        if (cabinClass.toLowerCase().includes('business') && mileage < 100000) { 
                            results.push({
                                class: cabinClass,
                                mileage: priceText
                            });
                            console.log('Ticket found: ', cabinClass, priceText);
                        }
                    }
                });

                return results;
            });

            // Prepare documents to insert into MongoDB
            const documents = prices.map(priceData => ({
                date: formattedDate,
                class: priceData.class,
                mileage: priceData.mileage,
                departure: departure,
                destination: destination
            }));

            // Insert the documents into MongoDB if there are valid results
            if (documents.length > 0) {
                await flightsCollection.insertMany(documents);
            }
        }
    } catch (error) {
        console.error("Failed to find the selector within the extended timeout period or other error occurred:", error);
    } finally {
        // Close the MongoDB client
        await client.close();
        // Close the browser
        await browser.close();
    }
}

// Example usage
const startDate = new Date('2025-01-01');
const endDate = new Date('2025-01-02');
const dateRange = generateDateRange(startDate, endDate);

scrapeFlightData('YVR', 'ICN', dateRange);
