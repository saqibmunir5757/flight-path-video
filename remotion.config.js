const {Config} = require('@remotion/cli/config');

// Configure public directory (where map images and aircraft SVGs are stored)
Config.setPublicDir('./public');

// Enable image compression for better performance
Config.setImageFormat('png');

// Set concurrency (adjust based on server resources)
Config.setConcurrency(1);

// Increase timeout for long renders
Config.setTimeoutInMilliseconds(300000); // 5 minutes
