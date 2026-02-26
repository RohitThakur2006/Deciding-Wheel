import requests

# 1. The Address of your Restaurant (Server)
url = "http://127.0.0.1:5000/get-title"

# 2. The Order (We send a real Amazon link inside the envelope)
# You can change this URL to test different products
payload = {
    "url":"https://www.flipkart.com/veeba-peanut-butter-creamy/p/itm362eb9592b12c?pid=JASFXH5TG5GKUSZV&marketplace=GROCERY" 
}

print(f"Sending order to {url}...")

try:
    # 3. Send the POST request (The Sealed Envelope)
    response = requests.post(url, json=payload)

    # 4. Read the Reply
    print("Server replied!")
    print(f"Status Code: {response.status_code}")
    print(f"Data: {response.json()}")

except Exception as e:
    print(f"Error: {e}")
    print("Make sure 'app.py' is running in a separate terminal!")