import os
from dotenv import load_dotenv
load_dotenv()
import google.generativeai as genai
genai.configure(api_key=os.environ.get('GOOGLE_API_KEY'))
print(os.environ.get('GOOGLE_API_KEY'))
try:
    for m in genai.list_models():
        if 'embedContent' in m.supported_generation_methods:
            print(m.name)
except Exception as e:
    print(e)
