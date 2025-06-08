import logging
import os
import re

import librosa
import spacy
import torch
from pydub import AudioSegment
from pytubefix import YouTube
from transformers import Speech2TextProcessor, Speech2TextForConditionalGeneration
from youtube_transcript_api import YouTubeTranscriptApi, NoTranscriptFound, NotTranslatable, \
    TranscriptsDisabled

logger = logging.getLogger(__name__)

class Transcription:
    def __init__(self, video_url, languages=None):
        self.video_url = video_url
        self.languages = languages
        self.transcript = YouTubeTranscriptApi()
        if languages is None:
            self.languages = ['en']
        if video_url is not None:
            self.video_id = video_url.split('v=')[1]

    def check_if_available(self):
        try:
            transcript = self.transcript.get_transcript(video_id=self.video_id, languages=self.languages)
            print(transcript)
            print('----Youtube Transcription Available----')
            return True
        except TranscriptsDisabled:
            print('Error: Transcript is not available')
            return False
        except NoTranscriptFound:
            print(f'Error: Transcript not found for the video id {self.video_id}')
            return False
        except NotTranslatable:
            print('Error: Transcript is not translatable')
            return False
        except Exception as e:
            print(f'Error: Unknown error occurred {e}')
            return False

    def list_transcript_languages(self):
        status_dict = {}
        try:
            transcript_list = self.transcript.list(self.video_id)
            for lang in self.languages:
                if lang in transcript_list._manually_created_transcripts:
                    status_dict[lang] = 'manual'
                elif lang in transcript_list._generated_transcripts:
                    status_dict[lang] = 'auto_generated'
                elif any(tl.language_code == lang for tl in transcript_list._translation_languages):
                    status_dict[lang] = 'translated'
                else:
                    status_dict[lang] = 'not_available'
        except (TranscriptsDisabled, NoTranscriptFound):
            for lang in self.languages:
                status_dict[lang] = 'not_available'
        except Exception as e:
            print(f"Error fetching transcript information: {str(e)}")
            for lang in self.languages:
                status_dict[lang] = 'error'
        return status_dict

    def fetch_audio(self):
        yt = YouTube(self.video_url, 'WEB')
        audio_streams = yt.streams.filter(only_audio=True).first()
        audio_file = audio_streams.download(output_path="./temp/", filename="audio.mp4")
        wav_audio = AudioSegment.from_file(audio_file)
        wav_audio.export(output_path="./temp/audio.wav", format="wav")
        os.remove(audio_file)
        return audio_file

    @staticmethod
    def preprocess_text(text, lang="en"):
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'\[.*?\]', '', text)
        if lang == "en":
            try:
                nlp = spacy.load("en_core_web_sm")
                doc = nlp(text)
                sentences = [sent.text.strip() for sent in doc.sents]
                cleaned_sentences = []
                for sent in sentences:
                    sent_clean = re.sub(r'\b(um|uh|like|you know)\b', '', sent, flags=re.IGNORECASE)
                    if sent_clean and len(sent_clean.split()) > 3:
                        cleaned_sentences.append(sent_clean)
                processed_text = '. '.join(cleaned_sentences)
            except Exception:
                return text
            try:
                import coreferee
                if "coreferee" not in nlp.pipe_names:
                    nlp.add_pipe("coreferee")
                doc = nlp(processed_text)
                if doc._.has_coref:
                    resolved_text = doc._.coref_chains.resolve(processed_text)
                    return resolved_text
                else:
                    return processed_text
            except ImportError:
                print("coreferee is not installed. Returning processed text without coreference resolution.")
                return processed_text
        else:
            return text

    def get_transcripts(self):
        transcripts_dict = {}
        try:
            transcript_list = self.transcript.list(self.video_id)
            logger.info(transcript_list)
            for lang in self.languages:
                transcript_text = ""
                source_type = "not_available"
                transcript = None
                candidates = [lang]
                if lang == 'en':
                    candidates = ['en', 'en-GB', 'en-US']
                for candidate in candidates:
                    if candidate in transcript_list._manually_created_transcripts:
                        logging.info(transcript_list._manually_created_transcripts)
                        try:
                            transcript = transcript_list.find_manually_created_transcript(
                                language_codes=[candidate])
                            transcript = transcript.fetch()
                            logging.info(transcript)
                            source_type = "manual"
                            break
                        except Exception as e:
                            print(f"Error fetching manual {candidate} transcript: {str(e)}")
                    if transcript:
                        break
                if not transcript:
                    for candidate in candidates:
                        if candidate in transcript_list._generated_transcripts:
                            try:
                                transcript = transcript_list.find_generated_transcript(
                                    language_codes=[candidate])
                                transcript = transcript.fetch()
                                source_type = "auto_generated"
                                break
                            except Exception as e:
                                print(f"Error fetching auto-generated {candidate} transcript: {str(e)}")
                        if transcript:
                            break
                if not transcript:
                    possible_sources = []
                    for available_transcript in transcript_list:
                        translation_langs = [tlang.language_code for tlang in
                                             available_transcript.translation_languages]
                        if lang in translation_langs:
                            possible_sources.append(available_transcript)
                    preferred_order = ['en-GB', 'en-US', 'en']
                    ordered_sources = []
                    for code in preferred_order:
                        for source in possible_sources:
                            if source.language_code == code:
                                ordered_sources.append(source)
                    for source in possible_sources:
                        if source.language_code not in preferred_order:
                            ordered_sources.append(source)
                    for available_transcript in ordered_sources:
                        try:
                            transcript = available_transcript.translate(lang)
                            transcript = transcript.fetch()
                            source_type = "translated"
                            break
                        except Exception as e:
                            print(f"Error translating to {lang} from {available_transcript.language_code}: {str(e)}")
                if transcript:
                    if lang == 'en':
                        transcript_text = " ".join([entry.text.strip() for entry in transcript])
                    else:
                        transcript_text = ". ".join([entry.text.replace('।', '').strip() for entry in transcript])
                    transcript_text = self.preprocess_text(transcript_text, lang=lang)
                transcripts_dict[lang] = {
                    'text': transcript_text,
                    'source_type': source_type if transcript_text else 'not_available'
                }
        except (TranscriptsDisabled, TranscriptsDisabled) as e:
            print(f"Transcripts disabled or not found: {str(e)}")
            for lang in self.languages:
                transcripts_dict[lang] = {'text': "", 'source_type': 'not_available'}
        except Exception as e:
            print(f"Unexpected error: {str(e)}")
            for lang in self.languages:
                transcripts_dict[lang] = {'text': "", 'source_type': 'error'}
        return transcripts_dict

    def transcribe_with_speech_to_text(self):
        model_name = 'facebook/s2t-medium-mustc-multilingual-st'
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        audio_path = self.fetch_audio()
        processor = Speech2TextProcessor.from_pretrained(model_name)
        model = Speech2TextForConditionalGeneration.from_pretrained(model_name)
        model.to(device)
        waveform, sample_rate = librosa.load(audio_path, sr=16000)
        inputs = processor(waveform, return_tensors="pt", padding=True, sampling_rate=sample_rate)
        with torch.no_grad():
            generated_ids = model.generate(inputs['input_features'])
        transcription = processor.batch_decode(generated_ids[0], skip_special_tokens=True)
        os.remove(audio_path)
        return transcription

    def transcribe(self):
        text = ""
        if self.check_if_available():
            transcript = self.transcript.get_transcript(self.video_id)
            for entry in transcript:
                text += ". " + entry['text'].capitalize()
        else:
            text = self.transcribe_with_speech_to_text()
        return text
