from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import os
from dotenv import load_dotenv
import time

# .env ফাইল থেকে ভেরিয়েবল লোড করা
load_dotenv()

# --- ১. প্রাথমিক কনফিগারেশন ---
LOGIN_URL = "https://www.pikachutools.my.id/user/login"
# লগইন সফল হওয়ার পর যে টুল পেজে যাবে (HTML দেখে এটিই মূল ইউআরএল মনে হচ্ছে)
TOOL_PAGE_URL = "https://pikachutools.my.id/" 
YOUR_EMAIL = os.getenv("PIKACHU_EMAIL") 
YOUR_PASSWORD = os.getenv("PIKACHU_PASSWORD") 

# --- ২. লগইন ফর্ম লোকেটর ---
EMAIL_FIELD_LOCATOR = (By.NAME, "email") 
PASSWORD_FIELD_LOCATOR = (By.NAME, "password") 
LOGIN_BUTTON_LOCATOR = (By.XPATH, "/html/body/div/div/div[2]/div/section/div/div/div/div/div[2]/div/div/div/form/div/button") 

# --- ৩. টুল পেজের নতুন লোকেটর (আপনার HTML অনুযায়ী আপডেট করা হয়েছে) ---
NUMBER_INPUT_LOCATOR = (By.NAME, "number")       # <input type="text" name="number">
AMOUNT_INPUT_LOCATOR = (By.NAME, "amount")       # <input type="number" name="amount">
# Start বাটনটি একটি submit বাটন, তাই আমরা তার CSS Selector ব্যবহার করব
START_BUTTON_LOCATOR = (By.CSS_SELECTOR, "button[type='submit']") 


def run_pikachu_tool(target_number: str, target_amount: int):
    """
    লগইন করে টুল পেজে নির্দিষ্ট নাম্বার ও অ্যামাউন্ট দিয়ে START কমান্ড এক্সিকিউট করে।
    """
    if not YOUR_EMAIL or not YOUR_PASSWORD:
        print("ERROR: PIKACHU_EMAIL or PIKACHU_PASSWORD not set in .env file.")
        return

    print(f"--- Starting Automation for Number: {target_number}, Amount: {target_amount} ---")
    driver = None
    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service)
        driver.maximize_window()
        
        # --- লগইন প্রক্রিয়া (১ম ধাপ) ---
        driver.get(LOGIN_URL)
        wait = WebDriverWait(driver, 20)

        email_field = wait.until(EC.presence_of_element_located(EMAIL_FIELD_LOCATOR))
        email_field.send_keys(YOUR_EMAIL)

        password_field = driver.find_element(*PASSWORD_FIELD_LOCATOR)
        password_field.send_keys(YOUR_PASSWORD)

        login_button = driver.find_element(*LOGIN_BUTTON_LOCATOR)
        login_button.click()

        # লগইন সফল হওয়ার জন্য অপেক্ষা (২য় ধাপ)
        wait.until(EC.url_changes(LOGIN_URL))
        time.sleep(3) 

        # যাচাই করা লগইন সফল হয়েছে কিনা
        if LOGIN_URL in driver.current_url:
            print("\nLogin Failed! Check credentials or website changes.")
            return

        print("\nLogin Successful. Navigating to Tool Page...")
        
        # --- টুল পেজে নেভিগেট করা (৩য় ধাপ) ---
        driver.get(TOOL_PAGE_URL) 
        time.sleep(3) 
        
        # --- কমান্ড/টাস্ক এক্সিকিউশন (৪র্থ ধাপ) ---
        
        # ১. নাম্বার ইনপুট করা
        print(f"Inputting Number: {target_number}...")
        number_field = wait.until(EC.presence_of_element_located(NUMBER_INPUT_LOCATOR))
        number_field.clear() 
        number_field.send_keys(target_number)

        # ২. অ্যামাউন্ট ইনপুট করা
        print(f"Inputting Amount: {target_amount}...")
        amount_field = driver.find_element(*AMOUNT_INPUT_LOCATOR)
        amount_field.clear()
        amount_field.send_keys(str(target_amount))

        # ৩. স্টার্ট বাটনে ক্লিক করা
        # এখানে Start বাটনটি ফর্ম সাবমিট করবে
        print("Clicking 'START' Button...")
        start_button = driver.find_element(*START_BUTTON_LOCATOR)
        start_button.click()

        print("\nTool execution initiated. Waiting for result...")
        time.sleep(15) # কমান্ড শেষ হওয়ার জন্য অপেক্ষা

        # যদি কোনো Success/Error মেসেজ আসে, তা এখানে চেক করতে পারেন
        
        print("Automation task completed successfully.")

    except Exception as e:
        print(f"\nAn error occurred during automation: {e}")
    finally:
        if driver:
            driver.quit()
            print("Browser closed.")

# --- ফাংশন কল করার উদাহরণ (আপনার API এর মতো) ---
if __name__ == "__main__":
    
    # টেস্টিং এর জন্য উদাহরণ মান
    test_number = "01314546986"  
    test_amount = 5000 
    
    # অটোমেশন চালান
    run_pikachu_tool(test_number, test_amount) 
