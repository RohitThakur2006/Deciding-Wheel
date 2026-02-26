from flask import Flask, request, jsonify
from flask_cors import CORS
from curl_cffi import requests as cffi_requests # <--- The Magic Library
from bs4 import BeautifulSoup

# --- SETUP ---
app = Flask(__name__)
# Enable CORS so your frontend (script.js) can talk to this backend
CORS(app, resources={r"/*": {"origins": "*"}})

# --- HOME PAGE ---
@app.route('/')
def home():
    return "✅ The Server is Running! You can now use the Wheel."

def scrape_site(url):
    print(f"🕵️‍♂️ Attempting to scrape: {url}")

    # 1. Clean the URL (Remove tracking junk)
    if "?" in url:
        url = url.split("?")[0]

    try:
        # 2. THE IMPERSONATION
        # 'impersonate="chrome110"' makes Python act EXACTLY like a real Chrome browser.
        # This bypasses 99% of bot detection on Amazon/Flipkart.
        response = cffi_requests.get(
            url, 
            impersonate="chrome110", 
            timeout=10
        )

        # Check if we got blocked
        if response.status_code != 200:
            print(f"❌ Server returned status: {response.status_code}")
            return None

        # 3. PARSE HTML
        soup = BeautifulSoup(response.text, "html.parser")
        title = ""

        # --- STRATEGY A: META TAGS (Works for Amazon & Flipkart) ---
        # Most reliable method. Sites put the clean title here for sharing on WhatsApp/Facebook.
        meta_title = soup.find("meta", property="og:title")
        if meta_title:
            title = meta_title["content"]
        
        # --- STRATEGY B: FLIPKART SPECIFIC ---
        # Flipkart uses a specific class for titles
        if not title:
            flipkart_h1 = soup.find("span", {"class": "B_NuCI"}) # Common Flipkart Class
            if flipkart_h1:
                title = flipkart_h1.get_text()
            else:
                # Try generic H1 (New Flipkart layout)
                h1 = soup.find("h1")
                if h1:
                    title = h1.get_text()

        # --- STRATEGY C: AMAZON SPECIFIC ---
        if not title:
            amazon_span = soup.find("span", {"id": "productTitle"})
            if amazon_span:
                title = amazon_span.get_text()

        # --- STRATEGY D: PAGE TITLE (Fallback) ---
        if not title and soup.title:
            title = soup.title.string

        # 4. CLEANUP THE TITLE
        if title:
            # Remove "Amazon.in", "Flipkart", and brackets
            clean_title = title.split("(")[0].split("|")[0]
            # Remove "Online at Best Price" junk
            clean_title = clean_title.replace("Online at Best Price", "")
            # Cut to 30 characters
            return clean_title.strip()[:35]
            
        return None

    except Exception as e:
        print(f"❌ Error scraping: {e}")
        return None

@app.route('/get-title', methods=['POST'])
def get_title_api():
    data = request.json
    user_url = data.get('url')

    if not user_url:
        return jsonify({"error": "No URL provided"}), 400

    product_name = scrape_site(user_url)

    if product_name:
        return jsonify({"title": product_name})
    else:
        # If scraping fails, we return a 500 error so the frontend knows
        return jsonify({"error": "Could not find product name, Try Again"}), 500

# --- RUN SERVER ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)