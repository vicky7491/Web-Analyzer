import os

import urllib.parse
from dotenv import load_dotenv
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

# Load environment variables
load_dotenv()


app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
CORS(app, resources={r"/analyze": {"origins": "http://localhost:3000"}})  # Specific CORS

GOOGLE_API_KEY = "AIzaSyBhL-W9S4SmSyBN4E6oaLG2wFB2vA4anMM"

def analyze_page_speed(url):
    """Fetch performance & SEO data from Google PageSpeed API"""
    try:
        # Encode URL for API request
        encoded_url = urllib.parse.quote(url, safe='')
        api_url = f"https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={encoded_url}&key={GOOGLE_API_KEY}&category=performance&category=seo"
        
        response = requests.get(api_url, timeout=15)
        response.raise_for_status()
        result = response.json()

        if 'lighthouseResult' not in result:
            return {"error": "Invalid response from PageSpeed API"}

        lighthouse = result['lighthouseResult']
        audits = lighthouse['audits']

        return {
            "performance": round(lighthouse["categories"]["performance"]["score"] * 100),
            "seo": round(lighthouse["categories"]["seo"]["score"] * 100),
            "description": audits.get('meta-description', {}).get('details', {}).get('items', [{}])[0].get('value', "No meta description"),
            "title": lighthouse["finalUrl"],
            "issues": {
                "unused_css_js": audits.get('unused-css-rules', {}).get('score', 1) < 1,
                "slow_server_response": audits.get('server-response-time', {}).get('score', 1) < 1
            }
        }
    except Exception as e:
        return {"error": f"PageSpeed analysis failed: {str(e)}"}

def analyze_security(url):
    """Check security headers with proper error handling"""
    try:
        if not url.startswith(('http://', 'https://')):
            test_url = f'https://{url}'
        else:
            test_url = url

        response = requests.get(
            test_url, 
            allow_redirects=True,
            verify=True,
            timeout=10
        )
        
        security_issues = []
        headers = response.headers

        # Check HTTPS enforcement
        if not response.url.startswith('https://'):
            security_issues.append("Does not enforce HTTPS")

        # Check security headers
        required_headers = {
            "Strict-Transport-Security": "Missing HSTS header",
            "Content-Security-Policy": "Missing CSP header",
            "X-Content-Type-Options": "Missing X-Content-Type-Options header"
        }

        for header, message in required_headers.items():
            if header not in headers:
                security_issues.append(message)

        return security_issues

    except requests.exceptions.SSLError:
        return ["SSL certificate error"]
    except Exception as e:
        return [f"Security check failed: {str(e)}"]

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    url = data.get('url')

    if not url:
        return jsonify({"error": "URL is required"}), 400

    try:
        # Get PageSpeed data
        page_speed_data = analyze_page_speed(url)
        if 'error' in page_speed_data:
            return jsonify({"error": page_speed_data["error"]}), 500

        # Get security data
        security_data = analyze_security(url)

        return jsonify({
            "url": url,
            "title": page_speed_data.get("title", url),
            "description": page_speed_data.get("description", "No description available"),
            "scores": {
                "performance": page_speed_data.get("performance", 0),
                "seo": page_speed_data.get("seo", 0),
                "security": 100 if len(security_data) == 0 else 50
            },
            "issues": {
                "critical": [
                    issue for issue in [
                        "Unused CSS/JS" if page_speed_data["issues"]["unused_css_js"] else None,
                        "Slow server response" if page_speed_data["issues"]["slow_server_response"] else None
                    ] if issue
                ],
                "warnings": []
            },
            "security_issues": security_data,
            "recommendations": [
                "Minify CSS/JS files",
                "Optimize server response times",
                "Implement proper security headers"
            ]
        })

    except Exception as e:
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)