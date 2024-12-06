const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const { exec } = require('child_process');
const multer = require('multer'); // For handling file uploads
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json());

// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' }); // Uploaded files will be stored in 'uploads' folder

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/contactForm', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Define the Contact schema and model
const contactSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    message: String
});

const Contact = mongoose.model('Contact', contactSchema);

// Define the Question schema and model for storing generated questions
const questionSchema = new mongoose.Schema({
    topic: String,
    subTopic: String,
    questionType: String,
    numQuestions: Number,
    questions: [{
        question: String,
        answer: String,
        context: String,
    }],
    sourceType: { type: String, enum: ['pdf', 'non-pdf'], required: true }, // 'pdf' or 'non-pdf'
    createdAt: { type: Date, default: Date.now },
});

const Question = mongoose.model('Question', questionSchema);
const submission = mongoose.model('submissions', questionSchema);

// API endpoint to handle form submissions
app.post('/api/contact', async (req, res) => {
    const { name, email, phone, message } = req.body;

    const newContact = new Contact({
        name,
        email,
        phone,
        message
    });

    try {
        await newContact.save();
        res.status(201).send('Contact saved');
    } catch (err) {
        res.status(400).send('Error saving contact');
    }
});

// API endpoint to generate questions
app.post('/api/generate-questions', (req, res) => {
    const { topic, subTopic, questionType, numQuestions } = req.body;

    // Construct the command to run the Python script with the appropriate arguments
    const command = `python3 main.py --topic "${topic}" --subTopic "${subTopic}" --questionType "${questionType}" --numQuestions ${numQuestions}`;
    console.log("Running command:", command);

    // Execute the Python script
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing main.py: ${stderr}`);
            return res.status(500).send({ error: 'Error generating questions' });
        }

        // Parse the output from the Python script and send it back to the client
        try {
            const result = JSON.parse(stdout);

            // Save the generated questions into the database with sourceType as 'non-pdf'
            const newQuestions = new Question({
                topic,
                subTopic,
                questionType,
                numQuestions,
                sourceType: 'non-pdf',  // Set source type as 'non-pdf'
                questions: result.questions.map(q => ({
                    question: q.question || 'No question',
                    answer: q.answer || 'No answer',
                    context: q.context || 'No context',
                })),
            });

            // Save the questions to the database
            newQuestions.save()
                .then(() => {
                    console.log('Questions saved');
                    res.status(200).send(result);
                })
                .catch(err => {
                    console.error('Error saving questions:', err);
                    res.status(500).send({ error: 'Error saving questions to database' });
                });

        } catch (e) {
            console.error('Error parsing Python output:', e);
            res.status(500).send({ error: 'Error parsing generated questions' });
        }
    });
});

// API endpoint to fetch submission history
app.get('/api/submissions', async (req, res) => {
    try {
        const nonPdfSubmissions = await Question.find();
        const pdfSubmissions = await submission.find();
        const allSubmissions = [...pdfSubmissions, ...nonPdfSubmissions];

        res.status(200).json({ submissions: allSubmissions });
    } catch (err) {
        console.error('Error fetching submissions:', err);
        res.status(500).send({ error: 'Error fetching submission history' });
    }
});

// API endpoint to handle file upload and generate questions
app.post('/api/upload-and-generate-questions', upload.single('file'), (req, res) => {
    const { questionType, numQuestions } = req.body;

    if (!req.file) {
        return res.status(400).send({ error: 'No file uploaded' });
    }

    // Construct the command to run the Python script with the file path
    const filePath = path.resolve(req.file.path);
    const command = `python3 main.py --file "${filePath}" --questionType "${questionType}" --numQuestions ${numQuestions}`;
    console.log("Running command:", command);

    // Execute the Python script
    exec(command, (error, stdout, stderr) => {
        // Clean up the uploaded file
        fs.unlinkSync(filePath);

        if (error) {
            console.error(`Error executing main.py: ${stderr}`);
            return res.status(500).send({ error: 'Error generating questions' });
        }

        // Parse the output from the Python script and send it back to the client
        try {
            const result = JSON.parse(stdout);

            // Save the submission questions in the database with sourceType as 'pdf'
            const newSubmission = new submission({
                questionType,
                numQuestions,
                sourceType: 'pdf',  // Set source type as 'pdf'
                questions: result.questions.map(q => ({
                    question: q.question || 'No question',
                    answer: q.answer || 'No answer',
                    context: q.context || 'No context',
                })),
            });

            // Save the questions to the database
            newSubmission.save()
                .then(() => {
                    console.log('Submission saved');
                    res.status(200).send(result);
                })
                .catch(err => {
                    console.error('Error saving submission:', err);
                    res.status(500).send({ error: 'Error saving submission to database' });
                });

        } catch (e) {
            console.error('Error parsing Python output:', e);
            res.status(500).send({ error: 'Error parsing generated questions' });
        }
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
