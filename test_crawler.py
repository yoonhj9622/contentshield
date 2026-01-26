import requests
import json

url = "http://localhost:8000/crawl/youtube"
payload = {"url": "https://www.youtube.com/watch?v=jNQXAC9IVRw"}
headers = {"Content-Type": "application/json"}

try:
    print(f"Sending POST request to {url}...")
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    try:
        data = response.json()
        print("Response JSON:")
        print(json.dumps(data, indent=2, ensure_ascii=False))
    except json.JSONDecodeError:
        print("Response Text (Not JSON):")
        print(response.text)
except Exception as e:
    print(f"Error: {e}")
