// index.js

require('dotenv').config();
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

// --- ১. প্রাথমিক কনফিগারেশন ---
const LOGIN_URL = process.env.LOGIN_URL || "https://www.pikachutools.my.id/user/login";
const TOOL_PAGE_URL = process.env.TOOL_PAGE_URL || "https://pikachutools.my.id/";
const YOUR_EMAIL = process.env.PIKACHU_EMAIL;
const YOUR_PASSWORD = process.env.PIKACHU_PASSWORD;

// --- ২. লোকেটর ---
const LOCATOR = {
    EMAIL_FIELD: By.name('email'),
    PASSWORD_FIELD: By.name('password'),
    LOGIN_BUTTON: By.xpath('/html/body/div/div/div[2]/div/section/div/div/div/div/div[2]/div/div/div/form/div/button'),
    NUMBER_INPUT: By.name('number'),
    AMOUNT_INPUT: By.name('amount'),
    START_BUTTON: By.css("button[type='submit']"),
};

/**
 * লগইন করে টুল পেজে নির্দিষ্ট নাম্বার ও অ্যামাউন্ট দিয়ে START কমান্ড এক্সিকিউট করে।
 * @param {string} targetNumber 
 * @param {number} targetAmount 
 */
async function runPikachuTool(targetNumber, targetAmount) {
    if (!YOUR_EMAIL || !YOUR_PASSWORD) {
        console.error("ERROR: PIKACHU_EMAIL or PIKACHU_PASSWORD not set in .env file.");
        return;
    }

    console.log(`--- Starting Automation for Number: ${targetNumber}, Amount: ${targetAmount} ---`);

    // --- Chrome Options সেটআপ (Render/Headless মোড) ---
    // Render-এ Headless এবং No-Sandbox অপরিহার্য।
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu'); // GPU ডিসেবল করা
    options.addArguments('--window-size=1920,1080');
    
    // Render-এ Chromium-এর এক্সিকিউটেবল পাথ স্বয়ংক্রিয়ভাবে ডিটেক্ট না হলে, 
    // আপনাকে Render-এর এনভায়রনমেন্ট ভেরিয়েবল বা ফিক্সড পাথ ব্যবহার করতে হতে পারে।
    // options.setChromeBinaryPath('/usr/bin/google-chrome'); 
    
    let driver;
    try {
        // WebDriver ইনস্ট্যান্স তৈরি: Render/Cloud এনভায়রনমেন্টের জন্য Builder ব্যবহার
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();

        // --- লগইন প্রক্রিয়া ---
        await driver.get(LOGIN_URL);
        const wait = 20000; // 20 সেকেন্ড

        // ইমেল
        await driver.wait(until.elementLocated(LOCATOR.EMAIL_FIELD), wait);
        await driver.findElement(LOCATOR.EMAIL_FIELD).sendKeys(YOUR_EMAIL);

        // পাসওয়ার্ড
        await driver.findElement(LOCATOR.PASSWORD_FIELD).sendKeys(YOUR_PASSWORD);

        // লগইন বাটন ক্লিক
        await driver.findElement(LOCATOR.LOGIN_BUTTON).click();
        console.log("Login form submitted.");
        
        // লগইন সফল হওয়ার জন্য অপেক্ষা
        await driver.wait(until.urlIs(TOOL_PAGE_URL), wait);
        console.log("Login Successful. Navigating to Tool Page...");

        // --- টুল পেজে টাস্ক এক্সিকিউশন ---
        
        // ১. নাম্বার ইনপুট করা
        await driver.wait(until.elementLocated(LOCATOR.NUMBER_INPUT), wait);
        const numberField = await driver.findElement(LOCATOR.NUMBER_INPUT);
        await numberField.clear(); 
        await numberField.sendKeys(targetNumber);
        console.log(`Number inputted: ${targetNumber}`);

        // ২. অ্যামাউন্ট ইনপুট করা
        const amountField = await driver.findElement(LOCATOR.AMOUNT_INPUT);
        await amountField.clear();
        await amountField.sendKeys(String(targetAmount));
        console.log(`Amount inputted: ${targetAmount}`);

        // ৩. স্টার্ট বাটনে ক্লিক করা
        await driver.findElement(LOCATOR.START_BUTTON).click();
        console.log("Clicked 'START' Button. Tool execution initiated.");

        // ফলাফল দেখার জন্য অপেক্ষা
        await driver.sleep(15000); 
        
        console.log("Automation task completed successfully.");

    } catch (error) {
        console.error(`\nAn error occurred during automation: ${error.message}`);
    } finally {
        if (driver) {
            await driver.quit();
            console.log("Browser closed.");
        }
    }
}

// --- ফাংশন কল করার উদাহরণ (আপনার API এর মতো) ---
(async () => {
    // আপনি যখনই এই স্ক্রিপ্টটি চালান, তখন এই প্যারামিটারগুলো ব্যবহার হবে
    const testNumber = "01XXXXXXXXXX";
    const testAmount = 5000;
    
    await runPikachuTool(testNumber, testAmount);
})();
