import google.generativeai as genai

# import time

API_KEY = ''
genai.configure(api_key=API_KEY)
model = genai.GenerativeModel("tunedModels/yttranscriptionassistant-wdh9ly1qx7f9")

# base_model = "models/gemini-1.5-flash-001-tuning"
# training_data = [
#     {"text_input": "How to generate YouTube summary?",
#      "output": "Paste YouTube URL > Choose extractive/abstractive > Generate"},
#     {"text_input": "What's extractive summary?", "output": "Summary using key phrases from video transcript"},
#     {"text_input": "What's abstractive summary?", "output": "Paraphrased summary generated from transcript"},
#     {"text_input": "Can I download as PDF?", "output": "Yes - PDF available without login"},
#     {"text_input": "How to get DOCX format?", "output": "Sign in required for DOCX/TXT/HTML downloads"},
#     {"text_input": "Why can't I download TXT?", "output": "Non-PDF formats require account authentication"},
#     {"text_input": "Is login needed for PDF?", "output": "No - PDF is free without account"},
#     {"text_input": "How to change summary language?", "output": "Available after signing in (English/Hindi/Marathi)"},
#     {"text_input": "Supported translation languages?", "output": "English, Hindi, Marathi (login required)"},
#     {"text_input": "Why language option locked?", "output": "Activate by signing in to your account"},
#     {"text_input": "Can I process Hindi videos?", "output": "Yes - supports English/Hindi/Marathi content"},
#     {"text_input": "Maximum video duration?", "output": "Videos must be under 2 hours"},
#     {"text_input": "Why was my video rejected?", "output": "Check: 1) ≤2 hours 2) EN/HI/MR language 3) Valid URL"},
#     {"text_input": "Can I process 3 hour video?", "output": "No - maximum 2 hour limit"},
#     {"text_input": "Why DOCX download failed?", "output": "Ensure you're logged in and retry"},
#     {"text_input": "Is Marathi available for free?", "output": "All non-English requires signed-in account"},
#     {"text_input": "How to access HTML exports?", "output": "Register/login to enable HTML downloads"},
#     {"text_input": "Maximum summaries per day?", "output": "Free: 3/day. Login for unlimited"},
#     {"text_input": "Why summary generation limit?", "output": "Free tier restriction - login to remove"},
#     {"text_input": "Why PDF button missing?", "output": "First process valid YouTube URL"},
#     {"text_input": "Why Hindi selection disabled?", "output": "Sign in to activate Hindi/Marathi"},
#     {"text_input": "How to get English summary?", "output": "Default language - no login required"},
#     {"text_input": "Can I translate Hindi to Marathi?", "output": "Yes - available after account login"},
#     {"text_input": "Video language requirements?", "output": "Supports English/Hindi/Marathi audio/subtitles"},
#     {"text_input": "How long does summary take?", "output": "Typically 15-30 seconds after URL validation"}
# ]
#
# operation = genai.create_tuned_model(
#     display_name="yt-transcription-assistant",
#     source_model=base_model,
#     epoch_count=20,
#     batch_size=4,
#     learning_rate=0.001,
#     training_data=training_data,
# )
#
# for status in operation.wait_bar():
#     time.sleep(10)
#
# result = operation.result()

for m in genai.list_tuned_models():
    print(m.name)


def assistant_response(text_input):
    try:
        response = model.generate_content(text_input)
        return response.text
    except (AttributeError, IndexError, KeyError) as e:
        print(f"Response parsing error: {e}")
        return "Could not process the response. Please rephrase your question."
    except Exception as e:
        print(f"API Error: {e}")
        return "Service temporarily unavailable. Please try again later."
