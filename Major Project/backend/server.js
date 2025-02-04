const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());  // Enable JSON body parsing



// Mock Election Data
let elections = [
    { id: 1, name: "Student Council Election", status: "Active" },
    { id: 2, name: "Company Representative Election", status: "Closed" },
];

// Routes

// Get Elections
app.get("/api/elections", (req, res) => {
    res.json(elections);
});

// Add Election
app.post("/api/elections", (req, res) => {
    const { name, status } = req.body;
    const newElection = { id: elections.length + 1, name, status };
    elections.push(newElection);
    res.status(201).json(newElection);
});

// Fetch News (Election Related)
app.get("/api/news", async (req, res) => {
    try {
        const response = await axios.get(
            `https://newsapi.org/v2/everything?q=elections&apiKey=${process.env.NEWS_API_KEY}`
        );
        const news = response.data.articles.map((article, index) => ({
            id: index + 1,
            title: article.title,
            description: article.description,
            imageUrl: article.urlToImage || "https://via.placeholder.com/150",
        }));
        res.json(news);
    } catch (error) {
        console.error("Error fetching news:", error);
        res.status(500).json({ error: "Failed to fetch news." });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
