from flask import Flask
from youtube_transcript_api import YouTubeTranscriptApi

# from backend.routes import get_summary
#
# print(
#       get_summary(video_url='https://www.youtube.com/watch?v=74ijsBhbxSQ', languages=['en', 'hi', 'mr'], num_sentences=5))

yt = YouTubeTranscriptApi()

ytt = yt.list('ZzRqDnJ8NVo')
print(ytt.find_generated_transcript(['en-GB', 'en', 'en-US']).fetch())