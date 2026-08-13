const serverless = require('serverless-http');

// Import the Express app and wait for Supabase initialization
const { app, supabaseReady } = require('../server.js');

// Ensure Supabase connection is ready before handling requests
const handler = async (req, res) => {
  // Wait for Supabase connection (important for cold starts)
  if (supabaseReady) {
    await supabaseReady;
  }
  
  // Use serverless-http to handle Express app
  const expressHandler = serverless(app);
  return expressHandler(req, res);
};

// Export the serverless handler
module.exports = handler;
