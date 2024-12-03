import React, { useState } from 'react';
import Header from './components/header';
import Footer from './components/footer';

const Quiz = () => {
    const [topic, setTopic] = useState('');
    const [subTopic, setSubTopic] = useState('');
    const [questionType, setQuestionType] = useState('');
    const [numQuestions, setNumQuestions] = useState('');
    const [questions, setQuestions] = useState([]);
    const [error, setError] = useState('');

    const topicMapping = {
        OS: ["OS Basics", "Structure of OS", "Types of OS", "Process Management", "CPU Scheduling", "Threads", "Process Synchronization", "Critical Section Problem", "Deadlocks", "Memory Management", "Page Replacement", "Storage Management"],
        DBMS: ["Basics of DBMS", "ER Model", "Relational Model", "Relational Algebra", "Functional Dependencies", "Normalisation", "TnC Control", "Indexing, B and B+ Trees", "File Organisation"],
        Java: ["Data Types", "OOPs Concepts", "Exception Handling"],
        JavaScript: ["Data Types", "Functions", "Loops"]
    };

    const handleSubmit = async () => {
        setError('');
        if (!topic || !subTopic || !questionType || !numQuestions) {
            setError('Please select all fields');
            return; // Prevent submitting the form if any field is missing
        }
      
        try {
            const response = await fetch('http://localhost:5001/api/generate-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, subTopic, questionType, numQuestions }),
            });
      
            if (response.ok) {
                const data = await response.json();
                console.log('Received data:', data); // Log the response to inspect it
      
                // Check if data and questions are valid
                if (data && Array.isArray(data.questions)) {
                    console.log('Questions:', data.questions);  // Log the questions array to inspect
                    
                    // Map through each question and extract necessary details
                    const parsedQuestions = data.questions.map((q, index) => {
                        console.log(`Raw Question Data ${index}:`, q);  // Log each question in raw form
    
                        // Check if q is an object and contains the necessary properties
                        if (q && typeof q === 'object') {
                            return {
                                question: q.question || 'No question text available',
                                answer: q.answer || 'No answer available',
                                // context: q.context || 'No context available',
                            };
                        } else {
                            return {
                                question: 'No question text available',
                                answer: 'No answer available',
                                context: 'No context available',
                            };
                        }
                    });
    
                    setQuestions(parsedQuestions); // Set questions state if valid
                } else {
                    setError('No questions generated or invalid data format.');
                }
            } else {
                setError('Failed to fetch questions');
            }
        } catch (error) {
            setError('Error fetching data: ' + error.message);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header />
            <section style={{ flex: 1, padding: '0', paddingTop: '6%' }}>
                <div style={styles.formContainer}>
                    <select style={styles.dropdown} value={topic} onChange={(e) => { 
                        setTopic(e.target.value); 
                        setSubTopic(''); // Reset subTopic when topic changes
                    }}>
                        <option value="">Select Topic</option>
                        {Object.keys(topicMapping).map((key) => (
                            <option key={key} value={key}>{key}</option>
                        ))}
                    </select>
                    <select style={styles.dropdown} value={subTopic} onChange={(e) => setSubTopic(e.target.value)}>
                        <option value="">Select Subtopic</option>
                        {topic && topicMapping[topic].map((sub, index) => (
                            <option key={index} value={sub}>{sub}</option>
                        ))}
                    </select>
                    <select style={styles.dropdown} value={questionType} onChange={(e) => setQuestionType(e.target.value)}>
                        <option value="">Select Question Type</option>
                        <option value="mcq">MCQ's</option>
                        <option value="True_or_false">Booleans</option>
                        <option value="short_qa">Short Answers</option>
                        <option value="fill_in_the_blanks">Fill in the blanks</option>
                    </select>
                    <select style={styles.dropdown} value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)}>
                        <option value="">Select Number of Questions</option>
                        {[1, 2, 3, 4, 5].map((num) => (
                            <option key={num} value={num}>{num}</option>
                        ))}
                    </select>
                    <button
                        style={styles.submitButton}
                        onClick={handleSubmit}
                        disabled={!topic || !subTopic || !questionType || !numQuestions}
                    >
                        Submit
                    </button>
                </div>
                <hr style={styles.blackLine} />
                <div style={styles.questionBox}>
                    <h3 style={styles.questionTitle}>Generated Questions:</h3>
                    {error && <p style={{ color: 'red' }}>{error}</p>} {/* Display error */}
                    {questions.length > 0 ? (
                        <ul style={styles.questionList}>
                            {questions.map((q, index) => (
                                <li key={index} style={styles.questionItem}>
                                    <p><strong>Q{index + 1}:</strong> {q.question}</p>
                                    <p><strong>Answer:</strong> {q.answer}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p style={styles.noQuestions}>No questions generated yet.</p>
                    )}
                </div>

            </section>
            <Footer />
        </div>
    );
};

const styles = {
    formContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '5px',
        maxWidth: '55%',
        margin: 'auto',
        marginTop: '20px',
        flexWrap: 'wrap',
    },
    dropdown: {
        marginRight: '10px',
        marginBottom: '10px',
        padding: '5px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        flex: '1 1 200px',
    },
    submitButton: {
        padding: '8px 15px',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        flex: '1 1 auto',
    },
    blackLine: {
        border: 'none',
        borderTop: '2px solid black',
        width: '80%',
        margin: '20px auto',
    },
    questionBox: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '5px',
        maxWidth: '60%',
        margin: '20px auto',
        backgroundColor: '#f9f9f9',
    },
    questionTitle: {
        marginBottom: '10px',
    },
    questionList: {
        listStyleType: 'none',
        padding: 0,
    },
    questionItem: {
        marginBottom: '20px',
        textAlign: 'left',
    },
    noQuestions: {
        color: '#999',
    },
};

export default Quiz;
