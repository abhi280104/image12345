import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load API key from .env file
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Test the Gemini API
try:
    model = genai.GenerativeModel("gemini-1.5-pro-latest")
    response = model.generate_content("Hello! Describe yourself.")
    print("✅ Gemini API Response:", response.text)
except Exception as e:
    print("❌ Error:", str(e))
