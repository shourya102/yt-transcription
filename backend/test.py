from backend.routes import get_summary

print(
    get_summary(video_url='https://www.youtube.com/watch?v=74ijsBhbxSQ', languages=['en', 'hi', 'mr'], num_sentences=5))
