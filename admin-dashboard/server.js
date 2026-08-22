const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.ADMIN_PORT || 5001;

// Serve static assets from public folder
app.use(express.static(path.join(__dirname, "public")));

// Fallback to index.html for SPA behavior
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`VaultChain Admin Console running at http://localhost:${PORT}`);
});
