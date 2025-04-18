import requests
from bs4 import BeautifulSoup

def analyze_website(url):
    try:
        response = requests.get(url)
        soup = BeautifulSoup(response.text, 'html.parser')

        title = soup.title.string if soup.title else "No title found"
        meta_desc = soup.find("meta", attrs={"name": "description"})
        description = meta_desc["content"] if meta_desc else "No meta description"

        return {
            "url": url,
            "title": title,
            "description": description,
            "status": "Success"
        }
    except Exception as e:
        return {"error": str(e), "status": "Failed"}
