});

// Only start the HTTP listener locally; Vercel handles invocation in production
if (!process.env.VERCEL) {
  connectDB();
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
} else {
  connectDB();
}

export default app;