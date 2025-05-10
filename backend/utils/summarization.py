import re

import nltk
import numpy as np
import torch
from nltk.tokenize import sent_tokenize
from sklearn.metrics.pairwise import cosine_similarity
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, AutoModelForMaskedLM

DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'
MODEL_MT5 = "csebuetnlp/mT5_multilingual_XLSum"
MODEL_BERT = "google-bert/bert-base-multilingual-cased"


def whitespace_handler(text):
    return re.sub(r'\s+', ' ', text.strip())


def get_model_and_tokenizer():
    tokenizer = AutoTokenizer.from_pretrained(MODEL_MT5)
    model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_MT5)
    model.to(DEVICE)
    return model, tokenizer


def get_model_and_tokenizer_bert():
    nltk.download('punkt')
    nltk.download('punkt_tab')
    tokenizer = AutoTokenizer.from_pretrained(MODEL_BERT)
    model = AutoModelForMaskedLM.from_pretrained(MODEL_BERT)
    model.to(DEVICE)
    return model, tokenizer


def get_extractive_summary(text, num_sentences):
    text = text.replace('\n', ' ')
    text = text.replace('।', '.')
    model, tokenizer = get_model_and_tokenizer_bert()
    sentences = sent_tokenize(text)
    sentence_embeddings = []
    for sent in sentences:
        inputs = tokenizer(sent, return_tensors='pt', truncation=True, max_length=512)
        inputs.to(DEVICE)
        with torch.no_grad():
            outputs = model(**inputs)
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


def get_abstractive_summary(text):
    text = text.replace('\n', ' ')
    text = text.replace('।', '.')
    model, tokenizer = get_model_and_tokenizer()
    input = tokenizer([whitespace_handler(text)], return_tensors="pt", padding="max_length", truncation=True,
                      max_length=512)
    input.to(DEVICE)
    input_ids = input['input_ids']
    with torch.no_grad():
        output_ids = \
            model.generate(input_ids=input_ids, min_length=40, max_length=200, no_repeat_ngram_size=2, num_beams=4)[0]
    summary = tokenizer.decode(output_ids, skip_special_tokens=True, clean_up_tokenization_spaces=False)
    return summary


def summarize(text, summary_type='extractive', num_sentences=2):
    if summary_type == 'extractive':
        return get_extractive_summary(text, num_sentences)
    else:
        return get_abstractive_summary(text)
