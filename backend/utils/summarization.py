import re

import nltk
import numpy as np
import torch
from nltk.tokenize import sent_tokenize
from sklearn.metrics.pairwise import cosine_similarity
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, AutoModelForMaskedLM


class TextSummarizer:
    def __init__(self):
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.model_mt5_name = "csebuetnlp/mT5_multilingual_XLSum"
        self.model_bert_name = "google-bert/bert-base-multilingual-cased"
        self._initialize_models()

    def _initialize_models(self):
        self.model_mt5 = AutoModelForSeq2SeqLM.from_pretrained(self.model_mt5_name)
        self.tokenizer_mt5 = AutoTokenizer.from_pretrained(self.model_mt5_name)
        self.model_mt5.to(self.device)
        self.model_bert = AutoModelForMaskedLM.from_pretrained(self.model_bert_name)
        self.tokenizer_bert = AutoTokenizer.from_pretrained(self.model_bert_name)
        self.model_bert.to(self.device)
        nltk.download('punkt', quiet=True)
        nltk.download('punkt_tab', quiet=True)

    def _whitespace_handler(self, text):
        return re.sub(r'\s+', ' ', text.strip())

    def _preprocess_text(self, text):
        text = text.replace('\n', ' ')
        text = text.replace('।', '.')
        return text

    def get_extractive_summary(self, text, num_sentences):
        text = self._preprocess_text(text)
        sentences = sent_tokenize(text)
        if len(sentences) <= num_sentences:
            return text
        sentence_embeddings = []
        for sent in sentences:
            inputs = self.tokenizer_bert(sent, return_tensors='pt', truncation=True, max_length=512)
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            with torch.no_grad():
                outputs = self.model_bert(**inputs)
            embedding = torch.mean(outputs.logits[0], dim=0).cpu().data.numpy()
            sentence_embeddings.append(embedding)
        doc_embedding = np.mean(sentence_embeddings, axis=0).reshape(1, -1)
        similarities = cosine_similarity(sentence_embeddings, doc_embedding)
        ranked_sentences = sorted(
            ((sim[0], idx) for idx, sim in enumerate(similarities)),
            reverse=True
        )
        if num_sentences > 0:
            selected_indices = sorted([idx for _, idx in ranked_sentences[:num_sentences]])
        else:
            selected_indices = sorted([idx for _, idx in ranked_sentences])
        summary = [sentences[idx] for idx in selected_indices]
        return ' '.join(summary)

    def get_abstractive_summary(self, text):
        text = self._preprocess_text(text)
        inputs = self.tokenizer_mt5(
            [self._whitespace_handler(text)],
            return_tensors="pt",
            padding="max_length",
            truncation=True,
            max_length=512
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        input_ids = inputs['input_ids']
        with torch.no_grad():
            output_ids = self.model_mt5.generate(
                input_ids=input_ids,
                min_length=40,
                max_length=200,
                no_repeat_ngram_size=2,
                num_beams=4
            )[0]

        summary = self.tokenizer_mt5.decode(
            output_ids,
            skip_special_tokens=True,
            clean_up_tokenization_spaces=False
        )
        return summary

    def summarize(self, text, summary_type='extractive', num_sentences=2):
        if summary_type == 'extractive':
            return self.get_extractive_summary(text, num_sentences)
        else:
            return self.get_abstractive_summary(text)