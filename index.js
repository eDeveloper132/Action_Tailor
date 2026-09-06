import express from "express";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;
const publicDir = path.join(__dirname, "public");
// MongoDB connection helper
const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.warn("⚠️ MONGO_URI not defined in environment variables.");
        return;
    }
    if (mongoose.connection.readyState >= 1)
        return;
    try {
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB successfully");
    }
    catch (error) {
        console.error("MongoDB connection error:", error);
    }
};
// Core Middlewares
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve static assets from public folder
app.use(express.static(publicDir));
// ==========================================
// VIEW ROUTES (HTML Pages)
// ==========================================
// Landing Page
app.get("/", (req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
});
// Authentication Pages (Unprotected)
app.get("/signin", (req, res) => {
    res.sendFile(path.join(publicDir, "unprotected", "signin.html"));
});
app.get("/signup", (req, res) => {
    res.sendFile(path.join(publicDir, "unprotected", "signup.html"));
});
app.get(["/recover-pass", "/recover_pass", "/forgot-password"], (req, res) => {
    res.sendFile(path.join(publicDir, "unprotected", "recover_pass.html"));
});
// Shop Owner / Tailor Portal (Protected)
app.get(["/shop-owner", "/shop_owner", "/shop-owner/dashboard", "/shop_owner/dashboard"], (req, res) => {
    res.sendFile(path.join(publicDir, "shop_owner", "protected", "index.html"));
});
// Customer Portal (Protected)
app.get(["/customer", "/customer/dashboard"], (req, res) => {
    res.sendFile(path.join(publicDir, "customer", "protected", "index.html"));
});
// ==========================================
// API & SYSTEM ROUTES
// ==========================================
app.get("/api", (req, res) => {
    res.json({
        status: "success",
        message: "Action Tailor API is running 🚀",
        database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        timestamp: new Date().toISOString(),
    });
});
// 404 handler for unhandled routes
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});
// Only start the HTTP listener locally; Vercel handles invocation in production
if (!process.env.VERCEL) {
    connectDB();
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}
else {
    connectDB();
}
export default app;
//# sourceMappingURL=index.js.map