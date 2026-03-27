const app = require('./app');
const { connectMongo } = require('./config/db.mongo');
const BootstrapService = require('./services/BootstrapService');
const PORT = process.env.PORT || 5000;

connectMongo()
  .then(() => BootstrapService.ensureDemoAccounts())
  .then(() => {
    console.log('✅ Demo local accounts ready');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ Startup failed:', err.message);
    process.exit(1);
  });
