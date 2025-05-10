import datetime
import logging
from functools import wraps

import jwt
from flask import Blueprint, request, jsonify
from flask_mail import Message
from pytubefix import YouTube

from __init__ import mail
from assistant import assistant_response
from models import User, db
from utils.summarization import summarize
from utils.transcription import Transcription

routes = Blueprint('routes', __name__)
SECRET_KEY = "your_secret_key"
YOUR_EMAIL_TO_SEND_FEEDBACK_TO = ''


def send_email(to, subject, message_body):
    msg = Message(subject, recipients=[to])
    msg.body = message_body
    mail.send(msg)
    return "Email sent successfully!"


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"msg": "Bad Authorization header. Expected 'Authorization: Bearer <JWT>'"}), 401
        try:
            token = auth_header.split(" ")[1]
            decoded_data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            return f(decoded_data, *args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({"msg": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"msg": "Invalid token"}), 401

    return decorated


def generate_token(user_id):
    payload = {
        "user_id": user_id,
        "exp": datetime.datetime.now() + datetime.timedelta(hours=24)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


@routes.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Missing fields"}), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Email already registered"}), 400
    user = User(username=data['username'], email=data['email'])
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "User registered successfully"}), 201


@routes.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data.get('username') or not data.get('password'):
        return jsonify({"error": "Missing fields"}), 400
    user = User.query.filter_by(username=data['username']).first()
    if not user or not user.check_password(data['password']):
        return jsonify({"error": "Invalid credentials"}), 401
    access_token = generate_token(user_id=user.id)
    return jsonify(access_token=access_token, username=user.get_username())


@routes.route('/assistant', methods=['POST'])
def assistant():
    text_input = request.get_json().get('text_input')
    print(text_input)
    response = assistant_response(text_input)
    return jsonify(response=response)


@routes.route('/list_transcripts', methods=['GET'])
def list_transcripts():
    video_url = request.get_json().get('video_url')
    transcription = Transcription(video_url, ['en', 'hi', 'mr'])
    dct = transcription.list_transcript_languages()
    for i in dct:
        if dct[i] == 'manual' or dct[i] == 'auto_generated' or dct[i] == 'translated':
            dct[i] = True
        else:
            dct[i] = False
    return jsonify(dct)


@routes.route('/profile/update', methods=['POST'])
@token_required
def update_profile(f):
    username = request.get_json().get('username')
    old_password = request.get_json().get('old_password')
    user = User.query.filter_by(id=f['user_id']).first()
    if not user or not user.check_password(old_password):
        return jsonify({"error": "Invalid credentials"}), 401
    if request.get_json().get('new_password') != '':
        password = request.get_json().get('new_password')
        user.change_password(old_password, password)
    user.change_username(username)
    return jsonify({"username": user.get_username(), "email": user.email, "search_history": user.get_search_history(),
                    "download_history": user.get_download_history()})


@routes.route('/profile', methods=['POST'])
@token_required
def get_profile(f):
    username = request.get_json().get('username')
    user = User.query.filter_by(username=username).first()
    return jsonify({"username": user.get_username(), "email": user.email, "search_history": user.get_search_history(),
                    "download_history": user.get_download_history()})


@routes.route('/search', methods=['POST'])
@token_required
def add_search(f):
    query = request.get_json().get('query')
    user = User.query.filter_by(id=f['user_id']).first()
    user.add_search(query)
    return jsonify({"message": "Search added successfully"})


@routes.route('/download', methods=['POST'])
@token_required
def add_download(f):
    item = request.get_json().get('item')
    user = User.query.filter_by(id=f['user_id']).first()
    user.add_download(item)
    return jsonify({"message": "Download added successfully"})


@routes.route('/feedback', methods=['POST'])
@token_required
def send_feedback(f):
    feedback = request.get_json().get('feedback')
    user = User.query.filter_by(id=f['user_id']).first()
    send_email(YOUR_EMAIL_TO_SEND_FEEDBACK_TO, 'Feedback', f'Feedback from {user.get_username()}: {feedback}')
    return jsonify({"message": "Feedback sent successfully"})


def get_summary(languages=None, video_url=None, num_sentences=2):
    logging.info(video_url)
    try:
        yt = YouTube(video_url, 'WEB')
        if yt.length > 7600:
            print(yt.length)
            return jsonify(error='Video too long'), 500
        transcription = Transcription(video_url, languages)
        transcripts = transcription.get_transcripts()
        summaries = {}
        for lang in languages:
            transcript_data = transcripts.get(lang, {'text': '', 'source_type': 'not_available'})
            lang_entry = dict()
            if transcript_data['source_type'] != 'not_available':
                input_text = transcript_data['text']
                lang_entry['transcript'] = input_text
                lang_entry['extractive'] = summarize(input_text, summary_type='extractive', num_sentences=num_sentences)
                lang_entry['abstractive'] = summarize(input_text, summary_type='abstractive')
            else:
                lang_entry['transcript'] = ''
                lang_entry['extractive'] = ''
                lang_entry['abstractive'] = ''
            summaries[lang] = lang_entry
        return jsonify(summaries)
    except Exception as e:
        return jsonify(error=str(e)), 500


@routes.route('/summary/english', methods=['POST'])
def summary_english():
    data = request.get_json()
    video_url = data.get('video_url')
    num_sentences = data.get('num_sentences', 5)
    return get_summary(['en'], video_url, num_sentences)


@routes.route('/summary/all', methods=['POST'])
def summary_all():
    data = request.get_json()
    video_url = data.get('video_url')
    languages = data.get('languages', ['en', 'hi', 'mr'])
    num_sentences = data.get('num_sentences', 5)
    return get_summary(languages, video_url, num_sentences)
