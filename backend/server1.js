const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const { exec } = require("child_process");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt"); // For hashing passwords
const jwt = require("jsonwebtoken"); // For generating tokens

const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Configure Multer for file uploads
const upload = multer({ dest: "uploads/" });

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/contactForm", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Define Schemas
// Contact Schema
const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  message: String,
});
const Contact = mongoose.model("Contact", contactSchema);

// Question Schema
const questionSchema = new mongoose.Schema({
  topic: String,
  subTopic: String,
  questionType: String,
  numQuestions: Number,
  email: { type: String, required: true },
  questions: [
    {
      question: String,
      answer: String,
      context: String,
    },
  ],
  sourceType: { type: String, enum: ["pdf", "non-pdf"], required: true },
  createdAt: { type: Date, default: Date.now },
});
const Question = mongoose.model("Question", questionSchema);
const Submission = mongoose.model("submissions", questionSchema);

// User Schema for Login/Registration
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  token: { type: String, required: true },
});
const User = mongoose.model("User", userSchema);

// API Endpoints
// Register User
app.post("/register", async (req, res) => {
  const { email, password, confirmPassword } = req.body;
  // Check if passwords match
  if (password !== confirmPassword) {
    return res.status(400).send({ message: "Passwords do not match" });
  }
  // Check if the user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).send({ message: "User already exists" });
  }

  // Hash the password before saving it
  const hashedPassword = await bcrypt.hash(password, 10);
  const token = jwt.sign({ email: req.body.email }, 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjkl', { expiresIn: '1h' });
  const newUser = new User({ email, password: hashedPassword, token: token }); 
  await newUser.save();
  res.status(201).send({ message: "User registered successfully" });
});

// Login User
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send({ message: "Invalid email or password" });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send({ message: "Invalid email or password" });
    }

    // Generate a JWT token for the user
    const token = jwt.sign({ email: user.email }, 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjkl', { expiresIn: '1h' });

    res.status(200).send({ message: "Login successful", token });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Error logging in" });
  }
});

// Middleware to authenticate the token
const authenticateToken = (req, res, next) => {
    const authHeader = req.header("Authorization");
    const token = authHeader && authHeader.split(" ")[1];
  
    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }
  
    jwt.verify(token, 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjkl', (err, user) => {
      if (err) {
        console.error("Token verification failed:", err.message);
        return res.status(403).json({ message: "Invalid token" });
      }
      req.user = user; // Populate req.user with the decoded token payload
      next();
    });
  };
  
  function verifyToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1]; // Get token from Authorization header
    
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjkl', (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
        req.user = decoded; // Attach the decoded user info to the request object
        next();
    });
}

  
  

// Fetch Submissions for the logged-in user
app.get("/api/submissions", verifyToken, async (req, res) => {
    const { email } = req.user;

    console.log("Email from Token:", email); // Debugging: Check email

    if (!email) {
        return res.status(400).send({ message: "User email not found in token" });
    }

    try {
        const nonPdfSubmissions = await Question.find({ email });
        const pdfSubmissions = await Submission.find({ email });

        console.log("Non-PDF Submissions:", nonPdfSubmissions); // Debugging
        console.log("PDF Submissions:", pdfSubmissions); // Debugging

        const allSubmissions = [...pdfSubmissions, ...nonPdfSubmissions];
        res.status(200).json({ message: 'Request authorized', user: req.user });
    } catch (err) {
        console.error("Error fetching submissions:", err);
        res.status(500).send({ message: "Error fetching submissions" });
    }
});



// Contact Form Submission
app.post("/api/contact", async (req, res) => {
  const { name, email, phone, message } = req.body;

  const newContact = new Contact({ name, email, phone, message });
  try {
    await newContact.save();
    res.status(201).send("Contact saved");
  } catch (err) {
    res.status(400).send("Error saving contact");
  }
});

// Generate Questions
app.post("/api/generate-questions", authenticateToken, (req, res) => {
    const { topic, subTopic, questionType, numQuestions } = req.body;
    const { email } = req.user; // Correctly access email from req.user
  
    const command = `python3 main.py --topic "${topic}" --subTopic "${subTopic}" --questionType "${questionType}" --numQuestions ${numQuestions}`;
    console.log("Running command:", command);
  
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing main.py: ${stderr}`);
        return res.status(500).send({ error: "Error generating questions" });
      }
  
      try {
        const result = JSON.parse(stdout);
  
        const newQuestions = new Question({
          topic,
          subTopic,
          questionType,
          numQuestions,
          sourceType: "non-pdf",
          email, // Use email from req.user
          questions: result.questions.map((q) => ({
            question: q.question || "No question",
            answer: q.answer || "No answer",
            context: q.context || "No context",
          })),
        });
  
        newQuestions
          .save()
          .then(() => {
            console.log("Questions saved");
            res.status(200).send(result);
          })
          .catch((err) => {
            console.error("Error saving questions:", err);
            res.status(500).send({ error: "Error saving questions to database" });
          });
      } catch (e) {
        console.error("Error parsing Python output:", e);
        res.status(500).send({ error: "Error parsing generated questions" });
      }
    });
  });
  

// File Upload and Generate Questions
app.post(
  "/api/upload-and-generate-questions",
  upload.single("file"),
  (req, res) => {
    const { questionType, numQuestions } = req.body;
    const { email } = req.user;
    if (!req.file) {
      return res.status(400).send({ error: "No file uploaded" });
    }

    const filePath = path.resolve(req.file.path);
    const command = `python3 main.py --file "${filePath}" --questionType "${questionType}" --numQuestions ${numQuestions}`;
    console.log("Running command:", command);

    exec(command, (error, stdout, stderr) => {
      fs.unlinkSync(filePath);

      if (error) {
        console.error(`Error executing main.py: ${stderr}`);
        return res.status(500).send({ error: "Error generating questions" });
      }

      try {
        const result = JSON.parse(stdout);

        const newSubmission = new Submission({
          questionType,
          numQuestions,
          sourceType: "pdf",
          email: req.user.email,
          questions: result.questions.map((q) => ({
            question: q.question || "No question",
            answer: q.answer || "No answer",
            context: q.context || "No context",
          })),
        });

        newSubmission
          .save()
          .then(() => {
            console.log("Submission saved");
            res.status(200).send(result);
          })
          .catch((err) => {
            console.error("Error saving submission:", err);
            res
              .status(500)
              .send({ error: "Error saving submission to database" });
          });
      } catch (e) {
        console.error("Error parsing Python output:", e);
        res.status(500).send({ error: "Error parsing generated questions" });
      }
    });
  }
);

// Fetch Submission History
app.get("/api/submissions", async (req, res) => {
  try {
    const nonPdfSubmissions = await Question.find();
    const pdfSubmissions = await Submission.find();
    const allSubmissions = [...pdfSubmissions, ...nonPdfSubmissions];

    res.status(200).json({ submissions: allSubmissions });
  } catch (err) {
    console.error("Error fetching submissions:", err);
    res.status(500).send({ error: "Error fetching submission history" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
