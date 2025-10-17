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

// --- ২. লোকেটর (পূর্বের মতোই) ---
const LOCATOR = {
    EMAIL_FIELD: By.name('email'),
    // ... অন্যান্য লোকেটর অপরিবর্তিত ...
    PASSWORD_FIELD: By.name('password'),
    LOGIN_BUTTON: By.xpath('/html/body/div/div/div[2]/div/section/div/div/div/div/div[2]/div/div/div/form/div/button'),
    NUMBER_INPUT: By.name('number'),
    AMOUNT_INPUT: By.name('amount'),
    START_BUTTON: By.css("button[type='submit']"),
};

// ... runPikachuTool ফাংশনটি আগের মতোই থাকবে ...

async function runPikachuTool(targetNumber, targetAmount) {
    if (!YOUR_EMAIL || !YOUR_PASSWORD) {
        console.error(`[JOB FAIL - ${targetNumber}] Credentials not set.`);
        return;
    }

    console.log(`[JOB START] Initializing for Number: ${targetNumber}, Amount: ${targetAmount}`);

    // --- Chrome Options সেটআপ (Headless মোড) ---
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
        
        await driver.wait(until.urlIs(TOOL_PAGE_URL), waitTime);
        console.log(`[JOB - ${targetNumber}] Login Successful. Starting task...`);

        // --- টাস্ক এক্সিকিউশন ---
        await driver.wait(until.elementLocated(LOCATOR.NUMBER_INPUT), waitTime);
        await driver.findElement(LOCATOR.NUMBER_INPUT).clear(); 
        await driver.findElement(LOCATOR.NUMBER_INPUT).sendKeys(targetNumber);

        await driver.findElement(LOCATOR.AMOUNT_INPUT).clear();
        await driver.findElement(LOCATOR.AMOUNT_INPUT).sendKeys(String(targetAmount));

        await driver.findElement(LOCATOR.START_BUTTON).click();
        console.log(`[JOB - ${targetNumber}] Clicked 'START' Button. Waiting for completion...`);

        await driver.sleep(15000); 
        
        console.log(`[JOB END SUCCESS] Task completed for ${targetNumber}.`);
        return { status: 'success', number: targetNumber };

    } catch (error) {
        console.error(`[JOB END FAIL] Error for ${targetNumber}: ${error.message}`);
        return { status: 'error', number: targetNumber, error: error.message };
    } finally {
        if (driver) {
            await driver.quit();
        }
    }
}


// --- ৩. Express Web Service সেটআপ ---
const app = express();
app.use(bodyParser.json());

// স্বাস্থ্য পরীক্ষা রুট
app.get('/', (req, res) => {
    res.status(200).send({ 
        status: 'ok', 
        message: `Pikachu Automation Service is running. Use GET /run/:number/:amount to trigger.` 
    });
});

// 🔑 নতুন GET API রুট (URL Path Parameter ব্যবহার করে) 🔑
app.get('/run/:number/:amount', (req, res) => {
    const number = req.params.number;
    const amount = req.params.amount;
    
    // ইনপুট যাচাই
    if (!number || !amount) {
        return res.status(400).send({ 
            status: 'error', 
            message: 'Missing required parameters in URL path: /run/:number/:amount' 
        });
    }
    
    const targetNumber = String(number);
    const targetAmount = Number(amount);
    
    // টাস্কটিকে ব্যাকগ্রাউন্ডে চালানো
    runPikachuTool(targetNumber, targetAmount)
        .then(result => {
            console.log(`Job final result log:`, result);
        })
        .catch(err => {
            console.error(`Job execution promise error:`, err);
        });

    // ক্লায়েন্টকে সাথে সাথে সাড়া দেওয়া
    res.status(202).send({ 
        status: 'accepted', 
        message: 'Automation job accepted and started in the background (via GET method). Check server logs for completion status.',
        jobDetails: { number: targetNumber, amount: targetAmount }
    });
});


// সার্ভার শুরু করা
app.listen(PORT, () => {
    console.log(`Web Service running on port ${PORT}`);
});
