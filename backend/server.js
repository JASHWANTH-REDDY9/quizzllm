const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json());

// Handle OPTIONS requests explicitly (for preflight)
// app.options('*', cors()); // Preflight CORS handling

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
            res.status(200).send(result);
        } catch (e) {
            console.error('Error parsing Python output:', e);
            res.status(500).send({ error: 'Error parsing generated questions' });
        }
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
