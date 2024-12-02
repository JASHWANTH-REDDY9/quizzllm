from flask import Flask, request, jsonify
from nltk.tokenize import sent_tokenize
from huggingface_hub import hf_hub_download
import requests
from bs4 import BeautifulSoup
from transformers import (
    T5ForConditionalGeneration,
    T5TokenizerFast as T5Tokenizer,
)
from pytorch_lightning import LightningModule
import pytorch_lightning as pl
from torch.optim import AdamW

app = Flask(__name__)

# Constants
MODEL_NAME = 't5-small'
LEARNING_RATE = 0.0001
SOURCE_MAX_TOKEN_LEN = 300
TARGET_MAX_TOKEN_LEN = 80
SEP_TOKEN = '<sep>'
TOKENIZER_LEN = 32101  # After adding the new <sep> token

# Question Generation Model
class QGModel(pl.LightningModule):
    def __init__(self):
        super().__init__()
        self.model = T5ForConditionalGeneration.from_pretrained(MODEL_NAME, return_dict=True)
        self.model.resize_token_embeddings(TOKENIZER_LEN)  # Resize after adding new tokens

    def forward(self, input_ids, attention_mask, labels=None):
        output = self.model(input_ids=input_ids, attention_mask=attention_mask, labels=labels)
        return output.loss, output.logits

    def configure_optimizers(self):
        return AdamW(self.parameters(), lr=LEARNING_RATE)

# Question Generator Class
class QuestionGenerator:
    def __init__(self):
        self.tokenizer = T5Tokenizer.from_pretrained(MODEL_NAME)
        self.tokenizer.add_tokens(SEP_TOKEN)
        checkpoint_path = hf_hub_download(repo_id="rohithbandi1/fine-tuned-t5-aiquiz", filename="model.ckpt")
        self.qg_model = QGModel.load_from_checkpoint(checkpoint_path)
        self.qg_model.freeze()

    def generate(self, question_type: str, context: str) -> str:
        source_encoding = self.tokenizer(
            f'{question_type} {SEP_TOKEN} {context}',
            max_length=SOURCE_MAX_TOKEN_LEN,
            padding='max_length',
            truncation=True,
            return_attention_mask=True,
            add_special_tokens=True,
            return_tensors='pt',
        )
        generated_ids = self.qg_model.model.generate(
            input_ids=source_encoding['input_ids'],
            attention_mask=source_encoding['attention_mask'],
            num_beams=16,
            max_length=TARGET_MAX_TOKEN_LEN,
            repetition_penalty=2.5,
            length_penalty=1.0,
            early_stopping=True,
        )
        preds = [self.tokenizer.decode(generated_id, skip_special_tokens=True, clean_up_tokenization_spaces=True)
                 for generated_id in generated_ids]
        return preds[0]

# Helper Functions
def split_into_chunks(text, max_sentences_per_chunk=5):
    sentences = sent_tokenize(text)
    return [" ".join(sentences[i:i + max_sentences_per_chunk]) for i in range(0, len(sentences), max_sentences_per_chunk)]

def get_geeksforgeeks_content(url):
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            title = soup.find('h1').get_text(strip=True)
            content_section = soup.find('div', {'class': 'entry-content'}) or soup.find('article')
            paragraphs = content_section.find_all('p') if content_section else []
            content = ' '.join([para.get_text(strip=True) for para in paragraphs])
            return f"Title: {title}\n\nContent:\n{content}"
        return f"Failed to retrieve content. HTTP Status Code: {response.status_code}"
    except Exception as e:
        return f"Error occurred: {e}"

# Route to fetch content from the URL
@app.route('/fetch-content', methods=['POST'])
def fetch_content():
    data = request.get_json()
    category = data.get('category')
    topic = data.get('topic')

    urls = {
    # Topics for OS
    "OS": {
        "OS Basics": "https://www.geeksforgeeks.org/what-is-an-operating-system/?ref=lbp",
        "Structure of Operating Systems": "https://www.geeksforgeeks.org/operating-system-services/?ref=lbp",
        "Types of OS": "https://www.geeksforgeeks.org/batch-processing-operating-system/?ref=lbp",
        "Process Management": "https://www.geeksforgeeks.org/introduction-of-process-management/?ref=lbp",
        "CPU Scheduling in OS": "https://www.geeksforgeeks.org/cpu-scheduling-in-operating-systems/?ref=lbp",
        "Threads in OS": "https://www.geeksforgeeks.org/thread-in-operating-system/?ref=lbp",
        "Process Synchronization": "https://www.geeksforgeeks.org/introduction-of-process-synchronization/?ref=lbp",
        "Critical Section Problem Execution": "https://www.geeksforgeeks.org/petersons-algorithm-in-process-synchronization/?ref=lbp",
        "Deadlocks & Deadlock Handling Methods": "https://www.geeksforgeeks.org/introduction-of-deadlock-in-operating-system/?ref=lbp",
        "Memory Management": "https://www.geeksforgeeks.org/memory-management-in-operating-system/?ref=lbp",
        "Page Replacement Algorithms": "https://www.geeksforgeeks.org/page-replacement-algorithms-in-operating-systems/?ref=lbp",
        "Storage Management": "https://www.geeksforgeeks.org/storage-management/?ref=lbp"
    },
    # Topics for DBMS
    "DBMS": {
        "Basics of DBMS": "https://www.geeksforgeeks.org/introduction-of-dbms-database-management-system-set-1/?ref=lbp",
        "Entity Relationship Model": "https://www.geeksforgeeks.org/introduction-of-er-model/?ref=lbp",
        "Relational Model": "https://www.geeksforgeeks.org/introduction-of-relational-model-and-codd-rules-in-dbms/?ref=lbp",
        "Relational Algebra": "https://www.geeksforgeeks.org/introduction-of-relational-algebra-in-dbms/?ref=lbp",
        "Functional Dependencies": "https://www.geeksforgeeks.org/functional-dependency-and-attribute-closure/?ref=lbp",
        "Normalisation": "https://www.geeksforgeeks.org/introduction-of-database-normalization/?ref=lbp",
        "Transactions and Concurrency Control": "https://www.geeksforgeeks.org/concurrency-control-in-dbms/?ref=lbp",
        "Indexing, B and B+ Trees": "https://www.geeksforgeeks.org/indexing-in-databases-set-1/?ref=lbp",
        "File Organisation": "https://www.geeksforgeeks.org/file-organization-in-dbms-set-1/?ref=lbp"
    }
}

    if category and topic and category in urls and topic in urls[category]:
        url = urls[category][topic]
        content = get_geeksforgeeks_content(url)
        if "Failed" in content or "Error occurred" in content:
            return jsonify({"error": content}), 400
        chunks = split_into_chunks(content, max_sentences_per_chunk=3)
        return jsonify({"chunks": chunks})

    return jsonify({"error": "Invalid category or topic"}), 400

# Route to generate questions
@app.route('/generate-questions', methods=['POST'])
def generate_questions():
    data = request.get_json()
    question_type = data.get('question_type')
    num_questions = int(data.get('num_questions', 1))
    chunks = data.get('chunks', [])

    if not question_type or not chunks:
        return jsonify({"error": "Missing question type or content chunks"}), 400

    qg = QuestionGenerator()
    question_types = ["mcq", "True_or_false", "short_qa", "fill_in_the_blanks"]
    all_generated_questions = {q_type: [] for q_type in question_types}

    for i, chunk in enumerate(chunks[:num_questions]):  # Limit to the selected number of chunks
        for q_type in question_types:
            question = qg.generate(q_type, chunk)
            all_generated_questions[q_type].append((chunk, question))  # Pair with the context for reference

    return jsonify(all_generated_questions)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5002)
