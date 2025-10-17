// index.js

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

// --- ১. প্রাথমিক কনফিগারেশন ---
const PORT = process.env.PORT || 3000;
const LOGIN_URL = "https://www.pikachutools.my.id/user/login";
const TOOL_PAGE_URL = "https://pikachutools.my.id/";
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
 * Selenium Automation ফাংশন
 */
async function runPikachuTool(targetNumber, targetAmount) {
    if (!YOUR_EMAIL || !YOUR_PASSWORD) {
        return { status: 'error', message: 'Credentials not set in .env file.' };
    }

    console.log(`[JOB START] Number: ${targetNumber}, Amount: ${targetAmount}`);

    // --- Chrome Options সেটআপ (Render/Headless মোড) ---
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu'); 
    options.addArguments('--window-size=1920,1080');
    
    let driver;
    try {
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();

        // --- লগইন প্রক্রিয়া ---
        await driver.get(LOGIN_URL);
        const waitTime = 20000; 

        await driver.wait(until.elementLocated(LOCATOR.EMAIL_FIELD), waitTime);
        await driver.findElement(LOCATOR.EMAIL_FIELD).sendKeys(YOUR_EMAIL);
        await driver.findElement(LOCATOR.PASSWORD_FIELD).sendKeys(YOUR_PASSWORD);
        await driver.findElement(LOCATOR.LOGIN_BUTTON).click();
        
        // লগইন সফল হওয়ার জন্য অপেক্ষা
        await driver.wait(until.urlIs(TOOL_PAGE_URL), waitTime);
        console.log("Login Successful. Starting task...");

        // --- টাস্ক এক্সিকিউশন ---
        await driver.wait(until.elementLocated(LOCATOR.NUMBER_INPUT), waitTime);
        await driver.findElement(LOCATOR.NUMBER_INPUT).clear(); 
        await driver.findElement(LOCATOR.NUMBER_INPUT).sendKeys(targetNumber);

        await driver.findElement(LOCATOR.AMOUNT_INPUT).clear();
        await driver.findElement(LOCATOR.AMOUNT_INPUT).sendKeys(String(targetAmount));

        await driver.findElement(LOCATOR.START_BUTTON).click();
        console.log("Clicked 'START' Button.");

        // ফলাফল দেখার জন্য অপেক্ষা
        await driver.sleep(15000); 
        
        console.log("[JOB END] Task completed successfully.");
        return { status: 'success', message: 'Automation task executed successfully.', number: targetNumber, amount: targetAmount };

    } catch (error) {
        console.error(`[JOB FAIL] Error: ${error.message}`);
        return { status: 'error', message: `Automation failed: ${error.message}` };
    } finally {
        if (driver) {
            await driver.quit();
        }
    }
}

// --- ৩. Express Web Service সেটআপ ---
const app = express();
app.use(bodyParser.json());

// স্বাস্থ্য পরীক্ষা (Health Check) রুট
app.get('/', (req, res) => {
    res.status(200).send({ 
        status: 'ok', 
        message: `Pikachu Automation Service is running on port ${PORT}. Use POST /run to trigger automation.` 
    });
});

// মূল API রুট
app.post('/run', async (req, res) => {
    const { number, amount } = req.body;

    if (!number || !amount) {
        return res.status(400).send({ 
            status: 'error', 
            message: 'Missing required parameters: number and amount in request body.' 
        });
    }

    try {
        // টাস্কটিকে ব্যাকগ্রাউন্ডে চালানো
        const result = await runPikachuTool(String(number), Number(amount));
        
        // ক্লায়েন্টকে দ্রুত সাড়া দেওয়া
        res.status(result.status === 'success' ? 200 : 500).send(result);
        
    } catch (e) {
        console.error(`Unhandled error: ${e.message}`);
        res.status(500).send({ status: 'error', message: 'Internal server error during job execution.' });
    }
});

// সার্ভার শুরু করা
app.listen(PORT, () => {
    console.log(`Web Service running on port ${PORT}`);
});
