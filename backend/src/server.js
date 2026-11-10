

import express from "express";
import cors from "cors";
import pool from "./config/db.js";
import uploadRouter from "./routes/upload.js";
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "Welcome to ConsumerPulse API!",
        status: "Server is running"
    });
});

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "ConsumerPulse backend is healthy"
    });
});

app.get("/api/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({
            success: true,
            message: "PostgreSQL connected successfully!",
            databaseTime: result.rows[0].now
        });
    } catch (error) {
        console.error("Database connection failed:", error);
        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });
    }
});
app.use("/api/upload", uploadRouter);
app.listen(PORT, () => {
    console.log(`ConsumerPulse server running at http://localhost:${PORT}`);
});
