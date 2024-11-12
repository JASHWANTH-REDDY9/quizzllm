import React, { useState } from 'react';
import axios from 'axios';
import Header from './components/header';
import Footer from './components/footer';

const Cquiz = () => {
    const [text, setText] = useState('');
    const [file, setFile] = useState(null);
    const [result, setResult] = useState(null);

    const handleTextChange = (e) => {
        setText(e.target.value);
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('text', text);
        if (file) {
            formData.append('file', file);
        }

        try {
            const response = await axios.post('http://localhost:9002/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log('Response data:', response.data);
            setResult(response.data.result);
        } catch (error) {
            console.error('Error uploading data:', error);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header />
            <section style={{ flex: 1, padding: '0', paddingTop: '6%' }}>
                <form style={styles.formContainer} onSubmit={handleSubmit}>
                    <textarea
                        className="form-control"
                        id="message"
                        required
                        placeholder="Enter Data"
                        style={{ height: '100px' }}
                        value={text}
                        onChange={handleTextChange}
                    ></textarea>
                    <input
                        type="file"
                        id="file-upload"
                        style={styles.fileInput}
                        accept="application/pdf"
                        onChange={handleFileChange}
                    />
                    <button style={styles.submitButton} type="submit">Submit</button>
                </form>
                <hr style={styles.blackLine} />
                {result && (
                    <div style={styles.resultContainer}>
                        <h3>Generated Questions:</h3>
                        <ul>
                            {result.map((item, index) => (
                                <li key={index}>{item.question}</li>
                            ))}
                        </ul>
                    </div>
                )}
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
        justifyContent: 'flex-end', // Align items to the right
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '5px',
        maxWidth: '45%',
        margin: 'auto',
        marginTop: '20px',
        flexWrap: 'wrap',
    },
    fileInput: {
        marginRight: '10px',
        marginTop: '10px',
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        flex: '1 1 150px',
    },
    submitButton: {
        padding: '8px',
        marginTop: '10px',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        maxWidth: '100px',
        flex: '1 1 auto',
    },
    blackLine: {
        border: 'none',
        borderTop: '2px solid black',
        width: '80%',
        margin: '20px auto',
    },
    resultContainer: {
        marginTop: '20px',
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '5px',
        maxWidth: '45%',
        margin: 'auto',
    },
    '@media (max-width: 768px)': {
        formContainer: {
            flexDirection: 'column',
            maxWidth: '90%',
            marginTop: '20px',
        },
        fileInput: {
            flex: '1 1 100%',
            marginBottom: '15px',
        },
        submitButton: {
            width: '100%',
            marginTop: '15px',
        },
    },
};

export default Cquiz;