import React, { useState, useEffect } from 'react';
import Header from './components/header';
import Footer from './components/footer';

const History = () => {
    const [pdfHistory, setPdfHistory] = useState([]);
    const [nonPdfHistory, setNonPdfHistory] = useState([]);

    useEffect(() => {
        // Fetch the history from the backend
        const fetchHistory = async () => {
            try {
                const response = await fetch('http://localhost:5001/api/submissions');
                const data = await response.json();
                console.log('Fetched Data:', data); // Check the data in console

                if (data.submissions) {
                    // Separate PDF and non-PDF questions
                    const pdfData = data.submissions.filter(submission => submission.sourceType === 'pdf');
                    const nonPdfData = data.submissions.filter(submission => submission.sourceType === 'non-pdf');

                    setPdfHistory(pdfData);
                    setNonPdfHistory(nonPdfData);
                }
            } catch (error) {
                console.error('Error fetching history:', error);
            }
        };

        fetchHistory();
    }, []);

    return (
        <div style={{display:'flex', flexDirection:'column', minHeight:'100vh'}}>
            <Header />
            <section>
                <div style={styles.formContainer}>
                    <h3>History</h3>
                    <hr style={styles.blackLine} />
                    <div style={{display:'flex', flexDirection:'row', justifyContent:'space-between'}}>
                        <div style={{display:'flex', flexDirection:'column'}}>
                            <h3>PDF History</h3>
                            {pdfHistory.length > 0 ? (
                                <ul>
                                    {pdfHistory.map((submission, index) => (
                                        <li key={index}>
                                            <h4>Topic: {submission.topic}</h4>
                                            <ul>
                                                {submission.questions.map((q, idx) => (
                                                    <li key={idx}>
                                                        <p>{q.question}</p>
                                                        <p>Answer: {q.answer}</p>
                                                    </li>
                                                ))}
                                            </ul>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No PDF submissions found.</p>
                            )}
                        </div>
                        <div style={{display:'flex', flexDirection:'column'}}>
                            <h3>Non-PDF History</h3>
                            {nonPdfHistory.length > 0 ? (
                                <ul>
                                    {nonPdfHistory.map((submission, index) => (
                                        <li key={index}>
                                            <h4>Topic: {submission.topic}</h4>
                                            <ul>
                                                {submission.questions.map((q, idx) => (
                                                    <li key={idx}>
                                                        <p>{q.question}</p>
                                                        <p>Answer: {q.answer}</p>
                                                    </li>
                                                ))}
                                            </ul>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No non-PDF submissions found.</p>
                            )}
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );
};

const styles = {
    formContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
        border: '3px solid #ccc',
        borderRadius: '5px',
        minHeight: '59vh',
        maxWidth: '55%',
        marginTop: '20px',
        marginLeft: '22%',
    },
    blackLine: {
        border: 'none',
        borderTop: '2px solid black',
        width: '80%',
        margin: '20px auto',
    },
};

export default History;
