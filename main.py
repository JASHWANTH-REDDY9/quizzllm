import textwrap
from app.mcq_generation import MCQGenerator

def show_result(generated: str, answer: str, context: str, original_question: str = ''):
    print('Context:')
    for wrap in textwrap.wrap(context, width=120):
        print(wrap)
    print()
    print('Question:')
    print(generated)
    print('Answer:')
    print(answer)
    print('-----------------------------')

MCQ_Generator = MCQGenerator(True)

# Read context from file
with open('context.txt', 'r') as f:
    context = f.read()

MCQ_Generator.generate_mcq_questions(context, 10)