const mongoose = require("mongoose");

async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error(
      "MONGODB_URI is missing. Copy .env.example to .env and add your MongoDB connection string."
    );
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri);

  const connection = mongoose.connection;
  console.log(
    `MongoDB connected successfully: ${connection.host}/${connection.name}`
  );
}

module.exports = connectDatabase;
