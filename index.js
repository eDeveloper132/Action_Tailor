import express from "express";
import "dotenv/config";
import path from "path";
import cors from "cors";
const app = express();
const port = process.env.PORT || 3000;
const __dirname = path.resolve();
// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve static assets from public folder
app.use(express.static(path.join(__dirname, "public")));
// Root route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "unprotected", "index.html"));
});
// API health route
app.get("/api", (req, res) => {
    res.json({
        status: "success",
        message: "Action Tailor API is running on Vercel 🚀",
    });
});
// 404 handler for unhandled routes
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});
// Only start the HTTP listener locally; Vercel handles invocation in production
if (!process.env.VERCEL) {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}
export default app;
//# sourceMappingURL=index.js.map