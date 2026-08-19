// ============================================================
// SafeED-UP — Server Entry Point
// ============================================================
const app = require('./src/app');
const connectDB = require('./src/config/db');
const env = require('./src/config/env');

const startServer = async () => {
  try {
    // Connect Database
    await connectDB();

    const PORT = env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`🚀 SafeED-UP Government Digital Platform Running`);
      console.log(`📡 Environment: ${env.NODE_ENV}`);
      console.log(`🌐 Server Port: ${PORT}`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
      console.log(`==================================================`);
    });

    // Graceful Shutdown
    const shutdown = () => {
      console.log('\n🛑 Gracefully shutting down SafeED-UP server...');
      server.close(() => {
        console.log('✅ HTTP Server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.warn('⚠️  MongoDB connection failed:', error.message);
    console.warn('⚠️  Server starting in LIMITED mode (no database). This is normal on restricted networks.');
    console.warn('💡  On Render/Vercel deployment, MongoDB will connect normally.');

    const PORT = env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 SafeED-UP server running on port ${PORT} (LIMITED mode - no DB)`);
    });
  }
};

startServer();
