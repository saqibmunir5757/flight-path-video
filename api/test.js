// Simple test endpoint to verify Vercel API routing works
module.exports = (req, res) => {
  res.status(200).json({
    message: "API is working!",
    method: req.method,
    timestamp: new Date().toISOString()
  });
};
