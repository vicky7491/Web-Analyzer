from flask import Blueprint, request, jsonify
import requests
from utils.analyzer import analyze_website

api_blueprint = Blueprint('api', __name__)

@api_blueprint.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    url = data.get("url")

    if not url:
        return jsonify({"error": "URL is required"}), 400

    analysis_result = analyze_website(url)
    return jsonify(analysis_result)
