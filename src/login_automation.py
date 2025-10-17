from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options 
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import os
from dotenv import load_dotenv
import time

# .env ফাইল থেকে ভেরিয়েবল লোড করা
load_dotenv()

# --- ১. প্রাথমিক কনফিগারেশন ---
LOGIN_URL = "https://www.pikachutools.my.id/user/login"
# লগইন সফল হওয়ার পর যে টুল পেজে যাবে
TOOL_PAGE_URL = "https://pikachutools.my.id/" 
# .env ফাইল থেকে ক্রেডেনশিয়াল লোড করা
YOUR_EMAIL = os.getenv("PIKACHU_EMAIL") 
YOUR_PASSWORD = os.getenv("PIKACHU_PASSWORD") 

# --- ২. লোকেটর ---
EMAIL_FIELD_LOCATOR = (By.NAME, "email") 
PASSWORD_FIELD_LOCATOR = (By.NAME, "password") 
LOGIN_BUTTON_LOCATOR = (By.XPATH, "/html/body/div/div/div[2]/div/section/div/div/div/div/div[2]/div/div/div/form/div/button") 
NUMBER_INPUT_LOCATOR = (By.NAME, "number")       
AMOUNT_INPUT_LOCATOR = (By.NAME, "amount")       
START_BUTTON_LOCATOR = (By.CSS_SELECTOR, "button[type='submit']") 

# --- ৩. Termux কনফিগারেশন ---
# pkg install chromedriver সফল হলে, এটিই এর ডিফল্ট এক্সিকিউটেবল নাম।
CHROMIUM_EXECUTABLE_PATH = "chromedriver" 


def run_pikachu_tool(target_number: str, target_amount: int):
    """
    লগইন করে টুল পেজে নির্দিষ্ট নাম্বার ও অ্যামাউন্ট দিয়ে START কমান্ড এক্সিকিউট করে।
    """
    if not YOUR_EMAIL or not YOUR_PASSWORD:
        print("ERROR: PIKACHU_EMAIL or PIKACHU_PASSWORD not set in .env file.")
        return

    print(f"--- Starting Automation for Number: {target_number}, Amount: {target_amount} ---")
    
    # --- Chrome Options সেটআপ (Headless মোড) ---
    chrome_options = Options()
    chrome_options.add_argument("--headless")              # Termux-এ ব্রাউজার দৃশ্যমান হবে না
    chrome_options.add_argument("--no-sandbox")            # Termux-এর জন্য প্রয়োজনীয়
    chrome_options.add_argument("--disable-dev-shm-usage") # মেমরি ব্যবহারের জন্য প্রয়োজনীয়
    
    driver = None
    try:
        # WebDriver ইনস্ট্যান্স তৈরি: Termux-এ ম্যানুয়াল পাথ ব্যবহার
        driver = webdriver.Chrome(
            executable_path=CHROMIUM_EXECUTABLE_PATH,
            options=chrome_options
        )
        
        # --- লগইন প্রক্রিয়া ---
        driver.get(LOGIN_URL)
        wait = WebDriverWait(driver, 20)

        email_field = wait.until(EC.presence_of_element_located(EMAIL_FIELD_LOCATOR))
        email_field.send_keys(YOUR_EMAIL)

        password_field = driver.find_element(*PASSWORD_FIELD_LOCATOR)
        password_field.send_keys(YOUR_PASSWORD)

        login_button = driver.find_element(*LOGIN_BUTTON_LOCATOR)
        login_button.click()

        wait.until(EC.url_changes(LOGIN_URL))
        time.sleep(3) 

        if LOGIN_URL in driver.current_url:
            print("\nLogin Failed! Check credentials or website changes.")
            return

        print("\nLogin Successful. Navigating to Tool Page...")
        
        # --- টুল পেজে নেভিগেট ও টাস্ক এক্সিকিউশন ---
        driver.get(TOOL_PAGE_URL) 
        time.sleep(3) 
        
        print(f"Inputting Number: {target_number}...")
        number_field = wait.until(EC.presence_of_element_located(NUMBER_INPUT_LOCATOR))
        number_field.clear() 
        number_field.send_keys(target_number)

        print(f"Inputting Amount: {target_amount}...")
        amount_field = driver.find_element(*AMOUNT_INPUT_LOCATOR)
        amount_field.clear()
        amount_field.send_keys(str(target_amount))

        print("Clicking 'START' Button...")
        start_button = driver.find_element(*START_BUTTON_LOCATOR)
        start_button.click()

        print("\nTool execution initiated. Waiting for result...")
        time.sleep(15) 
        
        print("Automation task completed successfully.")

    except Exception as e:
        print(f"\nAn error occurred during automation: {e}")
    finally:
        if driver:
            driver.quit()
            print("Browser closed.")

# --- ফাংশন কল করার উদাহরণ (আপনার API এর মতো) ---
if __name__ == "__main__":
    # টেস্টিং এর জন্য আপনার কাঙ্খিত নাম্বার ও অ্যামাউন্ট দিন
    test_number = "01XXXXXXXXXX"  
    test_amount = 5000 
    
    run_pikachu_tool(test_number, test_amount)
