"""
WhatsApp Sender Backend - Python Module
Handles WhatsApp Web automation using Selenium
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time
import os
import json
from datetime import datetime

# Directories setup
PROFILES_DIR = os.path.join(os.getcwd(), "profiles")
LOGS_DIR = os.path.join(os.getcwd(), "logs")

if not os.path.exists(PROFILES_DIR):
    os.makedirs(PROFILES_DIR)

if not os.path.exists(LOGS_DIR):
    os.makedirs(LOGS_DIR)

class WhatsAppSender:
    """Main class for WhatsApp sending operations"""

    def __init__(self):
        self.profiles = self.list_profiles()
        self.stats = self.load_stats()

    def list_profiles(self):
        """List all available profiles"""
        return [name for name in os.listdir(PROFILES_DIR)
                if os.path.isdir(os.path.join(PROFILES_DIR, name))]

    def create_profile(self, profile_name):
        """Create a new WhatsApp Web profile"""
        profile_path = os.path.join(PROFILES_DIR, profile_name)

        if os.path.exists(profile_path):
            return {"success": False, "message": "Profile already exists"}

        os.makedirs(profile_path)
        options = webdriver.ChromeOptions()
        options.add_argument(f"user-data-dir={profile_path}")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)

        driver = None
        phone_number = "N/A"

        try:
            driver = webdriver.Chrome(options=options)
            driver.get("https://web.whatsapp.com/")

            print(f"Please scan QR code for profile: {profile_name}")
            print("Waiting for login...")

            # Wait for login (up to 5 minutes)
            WebDriverWait(driver, 300).until(
                EC.presence_of_element_located(
                    (By.XPATH, '//div[@contenteditable="true"][@data-tab="10" or @data-tab="6"]')
                )
            )

            print("Login successful! Trying to get phone number...")
            time.sleep(5)

            # Try to get phone number
            try:
                # Click on menu button
                menu_btn = WebDriverWait(driver, 10).until(
                    EC.element_to_be_clickable((By.XPATH, '//div[@title="Menu" or @title="Меню" or @aria-label="Menu"]'))
                )
                menu_btn.click()
                time.sleep(2)

                # Click on profile/settings
                profile_btn = WebDriverWait(driver, 10).until(
                    EC.element_to_be_clickable((By.XPATH, '//div[contains(text(), "Profile") or contains(text(), "Профиль")]'))
                )
                profile_btn.click()
                time.sleep(3)

                # Try to find phone number
                phone_elements = driver.find_elements(By.XPATH, '//span[contains(text(), "+")]')
                if phone_elements:
                    phone_number = phone_elements[0].text
                    print(f"Found phone number: {phone_number}")
            except Exception as e:
                print(f"Could not retrieve phone number: {str(e)}")

            # Save profile info with creation time
            profile_info_path = os.path.join(profile_path, "profile_info.json")
            with open(profile_info_path, 'w') as f:
                json.dump({
                    "name": profile_name,
                    "phone": phone_number,
                    "created_at": datetime.now().isoformat(),
                    "last_used": datetime.now().isoformat()
                }, f)

            print(f"Profile {profile_name} created successfully!")

            return {"success": True, "message": f"Profile {profile_name} created", "phone": phone_number}

        except Exception as e:
            print(f"Error creating profile: {str(e)}")
            return {"success": False, "message": f"Error: {str(e)}"}

        finally:
            if driver:
                driver.quit()

    def wait_for_login(self, driver):
        """Wait for WhatsApp Web login"""
        print("Waiting for WhatsApp Web login...")
        wait = WebDriverWait(driver, 300)
        wait.until(
            EC.presence_of_element_located(
                (By.XPATH, '//div[@contenteditable="true"][@data-tab="10" or @data-tab="6"]')
            )
        )
        print("Login successful!")

    def send_message(self, profile_name, phone_number, message, image_path=None, audio_path=None):
        """Send a single message with optional media"""
        profile_path = os.path.join(PROFILES_DIR, profile_name)

        if not os.path.exists(profile_path):
            return {"success": False, "message": "Profile not found"}

        # Convert to absolute paths and verify files exist
        if image_path:
            image_path = os.path.abspath(image_path)
            if not os.path.exists(image_path):
                print(f"Warning: Image file not found: {image_path}")
                image_path = None
        
        if audio_path:
            audio_path = os.path.abspath(audio_path)
            if not os.path.exists(audio_path):
                print(f"Warning: Audio file not found: {audio_path}")
                audio_path = None

        options = webdriver.ChromeOptions()
        options.add_argument(f"user-data-dir={profile_path}")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)

        driver = None
        try:
            driver = webdriver.Chrome(options=options)
            driver.maximize_window()
            driver.get(
                f'https://web.whatsapp.com/send/?phone={phone_number}'
                f'&text&type=phone_number&app_absent=0'
            )

            self.wait_for_login(driver)
            wait = WebDriverWait(driver, 60)

            # Wait for chat to fully load
            time.sleep(5)

            # Send image if provided
            if image_path and os.path.exists(image_path):
                print(f"Sending image: {image_path}")
                try:
                    # Click attach button using provided XPath
                    attach_btn = wait.until(
                        EC.element_to_be_clickable((By.XPATH, '//*[@id="main"]/footer/div[1]/div/span/div/div[2]/div/div[1]/button'))
                    )
                    attach_btn.click()
                    time.sleep(2)

                    # Find image input and send file
                    image_input_selectors = [
                        '//input[@accept="image/*,video/mp4,video/3gpp,video/quicktime"]',
                        '//input[@type="file" and contains(@accept, "image")]'
                    ]
                    
                    image_input = None
                    for selector in image_input_selectors:
                        try:
                            image_input = wait.until(EC.presence_of_element_located((By.XPATH, selector)))
                            break
                        except:
                            continue
                    
                    if not image_input:
                        raise Exception("Could not find image input")
                    
                    image_input.send_keys(image_path)
                    print("Image file selected, waiting for preview...")
                    time.sleep(3)
                    
                    # Click send button
                    send_btn = wait.until(EC.element_to_be_clickable(
                        (By.XPATH, '//*[@id="app"]/div[1]/div/div[3]/div/div[2]/div[2]/div/span/div/div/div/div[2]/div/div[2]/div[2]/div')
                    ))
                    send_btn.click()
                    print("Image sent successfully (button clicked)")
                    time.sleep(5)
                except Exception as e:
                    print(f"Error sending image: {str(e)}")
                    raise

            # Send audio if provided
            if audio_path and os.path.exists(audio_path):
                print(f"Sending audio: {audio_path}")
                try:
                    # Click attach button using provided XPath
                    attach_btn = wait.until(
                        EC.element_to_be_clickable((By.XPATH, '//*[@id="main"]/footer/div[1]/div/span/div/div[2]/div/div[1]/button'))
                    )
                    attach_btn.click()
                    time.sleep(2)

                    # Find document input (for audio files)
                    doc_input_selectors = [
                        '//input[@accept="*"]',
                        '//input[@type="file" and @accept="*"]'
                    ]
                    
                    doc_input = None
                    for selector in doc_input_selectors:
                        try:
                            doc_input = wait.until(EC.presence_of_element_located((By.XPATH, selector)))
                            break
                        except:
                            continue
                    
                    if not doc_input:
                        raise Exception("Could not find document input")
                    
                    doc_input.send_keys(audio_path)
                    print("Audio file selected, waiting for preview...")
                    time.sleep(3)
                    
                    # Click send button
                    send_btn = wait.until(EC.element_to_be_clickable(
                        (By.XPATH, '//*[@id="app"]/div[1]/div/div[3]/div/div[2]/div[2]/div/span/div/div/div/div[2]/div/div[2]/div[2]/div')
                    ))
                    send_btn.click()
                    print("Audio sent successfully (button clicked)")
                    time.sleep(5)
                except Exception as e:
                    print(f"Error sending audio: {str(e)}")
                    raise

            # Send text message if provided
            if message:
                print(f"Sending text message: {message[:50]}...")
                try:
                    msg_box_selectors = [
                        '//div[@contenteditable="true"][@data-tab="10"]',
                        '//div[@contenteditable="true"][@data-tab="6"]',
                        '//div[@contenteditable="true" and @role="textbox"]'
                    ]
                    
                    msg_box = None
                    for selector in msg_box_selectors:
                        try:
                            msg_box = wait.until(EC.presence_of_element_located((By.XPATH, selector)))
                            break
                        except:
                            continue
                    
                    if not msg_box:
                        raise Exception("Could not find message box")

                    msg_box.click()
                    time.sleep(0.5)
                    msg_box.send_keys(message)
                    time.sleep(1)
                    msg_box.send_keys(Keys.RETURN)
                    time.sleep(3)
                    print("Text message sent successfully")
                except Exception as e:
                    print(f"Error sending text: {str(e)}")
                    raise

            print(f"All messages sent to {phone_number}")

            # Update profile last used time
            self.update_profile_last_used(profile_name)
            
            # Log the message
            self.log_message(profile_name, phone_number, "success")

            return {"success": True, "message": "Message sent successfully"}

        except Exception as e:
            print(f"Error in send_message: {str(e)}")
            self.log_message(profile_name, phone_number, "failed")
            return {"success": False, "message": f"Error: {str(e)}"}

        finally:
            if driver:
                time.sleep(2)
                driver.quit()

    def update_profile_last_used(self, profile_name):
        """Update the last_used timestamp for a profile"""
        profile_path = os.path.join(PROFILES_DIR, profile_name)
        profile_info_path = os.path.join(profile_path, "profile_info.json")
        
        if os.path.exists(profile_info_path):
            try:
                with open(profile_info_path, 'r') as f:
                    info = json.load(f)
                
                info['last_used'] = datetime.now().isoformat()
                
                with open(profile_info_path, 'w') as f:
                    json.dump(info, f)
            except Exception as e:
                print(f"Error updating profile last_used: {str(e)}")

    def mass_send(self, phone_numbers, profiles_config, delay_config, profile_images=None, profile_audios=None):
        """
        Send messages to multiple recipients with optional media

        Args:
            phone_numbers: List of phone numbers
            profiles_config: Dict with profile names as keys and messages as values
            delay_config: Dict with 'random' boolean, 'delay' int (seconds),
                        'auto_pause_enabled' boolean, 'auto_pause_after' int (messages),
                        'auto_pause_duration' int (minutes)
            profile_images: Dict with profile names as keys and image paths as values
            profile_audios: Dict with profile names as keys and audio paths as values
        """
        import random

        results = []
        profile_names = list(profiles_config.keys())
        profile_index = 0
        
        # Auto-pause settings
        auto_pause_enabled = delay_config.get("auto_pause_enabled", False)
        auto_pause_after = delay_config.get("auto_pause_after", 30)
        auto_pause_duration = delay_config.get("auto_pause_duration", 15)

        for idx, phone in enumerate(phone_numbers, 1):
            # Check if we need to auto-pause
            if auto_pause_enabled and idx > 1 and (idx - 1) % auto_pause_after == 0:
                pause_seconds = auto_pause_duration * 60
                print(f"\n🔔 АВТО-ПАУЗА: Отправлено {idx - 1} сообщений. Пауза на {auto_pause_duration} минут...")
                time.sleep(pause_seconds)
                print("Продолжаем рассылку...\n")
            
            # Select profile (rotating)
            profile = profile_names[profile_index % len(profile_names)]
            message = profiles_config[profile]
            image_path = profile_images.get(profile) if profile_images else None
            audio_path = profile_audios.get(profile) if profile_audios else None

            # Send message with media
            result = self.send_message(profile, phone, message, image_path, audio_path)
            results.append({
                "phone": phone,
                "profile": profile,
                "status": result["success"]
            })

            # Apply delay (only if not the last message)
            if idx < len(phone_numbers):
                if delay_config.get("random"):
                    delay_time = random.randint(20, 60)
                else:
                    delay_time = delay_config.get("delay", 30)

                print(f"Waiting {delay_time} seconds before next message...")
                time.sleep(delay_time)

            profile_index += 1

        return {
            "success": True,
            "results": results,
            "total": len(phone_numbers),
            "sent": sum(1 for r in results if r["status"])
        }

    def log_message(self, profile, phone, status):
        """Log sent messages"""
        log_file = os.path.join(LOGS_DIR, "messages.json")

        log_entry = {
            "profile": profile,
            "phone": phone,
            "status": status,
            "timestamp": datetime.now().isoformat()
        }

        logs = []
        if os.path.exists(log_file):
            with open(log_file, 'r') as f:
                logs = json.load(f)

        logs.append(log_entry)

        # Keep only last 1000 logs
        logs = logs[-1000:]

        with open(log_file, 'w') as f:
            json.dump(logs, f, indent=2)

    def load_stats(self):
        """Load statistics from logs"""
        log_file = os.path.join(LOGS_DIR, "messages.json")

        if not os.path.exists(log_file):
            return {
                "total_sent": 0,
                "total_delivered": 0,
                "total_failed": 0,
                "recent_messages": []
            }

        with open(log_file, 'r') as f:
            logs = json.load(f)

        return {
            "total_sent": len(logs),
            "total_delivered": sum(1 for log in logs if log["status"] == "success"),
            "total_failed": sum(1 for log in logs if log["status"] == "failed"),
            "recent_messages": logs[-5:][::-1]  # Last 5 messages, reversed
        }

    def get_profile_stats(self, profile_name):
        """Get statistics for a specific profile"""
        log_file = os.path.join(LOGS_DIR, "messages.json")

        if not os.path.exists(log_file):
            return {"messages_sent": 0}

        with open(log_file, 'r') as f:
            logs = json.load(f)

        profile_logs = [log for log in logs if log["profile"] == profile_name]

        return {
            "messages_sent": len(profile_logs),
            "successful": sum(1 for log in profile_logs if log["status"] == "success"),
            "failed": sum(1 for log in profile_logs if log["status"] == "failed")
        }

    def get_profile_info(self, profile_name):
        """Get full profile information"""
        profile_path = os.path.join(PROFILES_DIR, profile_name)
        
        if not os.path.exists(profile_path):
            raise Exception("Profile not found")
            
        profile_info_path = os.path.join(profile_path, "profile_info.json")
        
        info = {
            "name": profile_name,
            "phone": "N/A",
            "created_at": "Unknown",
            "last_used": "Never"
        }
        
        if os.path.exists(profile_info_path):
            try:
                with open(profile_info_path, 'r') as f:
                    saved_info = json.load(f)
                    info.update(saved_info)
            except Exception as e:
                print(f"Error reading profile info: {str(e)}")
        else:
            # Create profile_info.json if it doesn't exist
            try:
                # Try to get creation time from directory
                created_timestamp = os.path.getctime(profile_path)
                from datetime import datetime
                info['created_at'] = datetime.fromtimestamp(created_timestamp).isoformat()
                
                # Save it for future use
                with open(profile_info_path, 'w') as f:
                    json.dump(info, f)
            except Exception as e:
                print(f"Error creating profile info: {str(e)}")
        
        # Get statistics
        stats = self.get_profile_stats(profile_name)
        info['statistics'] = stats
        
        return info

    def check_numbers(self, profile_name, phone_numbers):
        """Check if phone numbers are registered on WhatsApp"""
        print(f"Checking {len(phone_numbers)} numbers using profile: {profile_name}...")
        
        profile_path = os.path.join(PROFILES_DIR, profile_name)
        
        if not os.path.exists(profile_path):
            return {
                "success": False,
                "message": f"Profile {profile_name} not found",
                "registered": [],
                "unregistered": []
            }
        
        options = webdriver.ChromeOptions()
        options.add_argument(f"user-data-dir={profile_path}")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        
        driver = None
        registered = []
        unregistered = []
        
        try:
            driver = webdriver.Chrome(options=options)
            driver.maximize_window()
            
            # Check each number by directly opening chat URL
            for idx, phone in enumerate(phone_numbers):
                try:
                    print(f"Checking {phone}...")
                    
                    # Navigate directly to the chat URL (same as send_message)
                    chat_url = f'https://web.whatsapp.com/send/?phone={phone}&text&type=phone_number&app_absent=0'
                    driver.get(chat_url)
                    
                    # Wait for login on first number
                    if idx == 0:
                        print("Waiting for WhatsApp Web login...")
                        self.wait_for_login(driver)
                        print("Login successful! Continuing checks...")
                    
                    # Wait for page to load
                    time.sleep(5)
                    
                    # Check if chat opened successfully by looking for message input
                    is_registered = False
                    
                    try:
                        # Try to find the message input box with shorter timeout
                        wait = WebDriverWait(driver, 8)
                        
                        msg_box_selectors = [
                            '//div[@contenteditable="true"][@data-tab="10"]',
                            '//div[@contenteditable="true"][@data-tab="6"]',
                            '//div[@contenteditable="true" and @role="textbox"]',
                        ]
                        
                        for selector in msg_box_selectors:
                            try:
                                msg_box = wait.until(EC.presence_of_element_located((By.XPATH, selector)))
                                if msg_box:
                                    print(f"{phone} - ✓ REGISTERED")
                                    is_registered = True
                                    break
                            except TimeoutException:
                                continue
                        
                        # If no message box found, number is not registered
                        if not is_registered:
                            print(f"{phone} - ✗ NOT REGISTERED")
                    
                    except Exception as e:
                        print(f"{phone} - ✗ NOT REGISTERED (error: {str(e)})")
                    
                    # Add to appropriate list
                    if is_registered:
                        registered.append(phone)
                    else:
                        unregistered.append(phone)
                    
                    # Small delay between checks
                    time.sleep(2)
                    
                except Exception as e:
                    print(f"Error checking {phone}: {str(e)}")
                    # On error, mark as unregistered
                    unregistered.append(phone)
            
            print(f"\nCheck complete! Registered: {len(registered)}, Unregistered: {len(unregistered)}")
            
            return {
                "success": True,
                "registered": registered,
                "unregistered": unregistered,
                "message": f"Checked {len(phone_numbers)} numbers"
            }
            
        except Exception as e:
            print(f"Error during number check: {str(e)}")
            return {
                "success": False,
                "message": f"Error: {str(e)}",
                "registered": registered,
                "unregistered": unregistered
            }
        
        finally:
            if driver:
                driver.quit()

# Example usage
if __name__ == "__main__":
    sender = WhatsAppSender()

    print("WhatsApp Sender Backend")
    print("1. Create new profile")
    print("2. Send single message")
    print("3. Mass send")
    print("4. View stats")

    choice = input("Select option: ")

    if choice == "1":
        name = input("Enter profile name: ")
        result = sender.create_profile(name)
        print(result["message"])

    elif choice == "2":
        profile = input("Enter profile name: ")
        phone = input("Enter phone number: ")
        message = input("Enter message: ")
        result = sender.send_message(profile, phone, message)
        print(result["message"])

    elif choice == "3":
        print("Mass send example")
        # Implementation here

    elif choice == "4":
        stats = sender.load_stats()
        print(json.dumps(stats, indent=2))
