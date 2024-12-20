import mongoose from "mongoose";
import nodemailer from "nodemailer"; 

class DatabaseConnectionError extends Error {
  constructor(message) {
    super(message);
    this.name = "DatabaseConnectionError";
  }
}

const sendNotification = async (message) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.NOTIFICATION_EMAIL,
      subject: "Database Connection Error",
      text: message,
    });
    console.log("✅ Notification sent successfully");
  } catch (error) {
    console.error("❌ Failed to send notification:", error.message);
  }
};

const dbConnect = async () => {
  const maxRetries = 5;
  const retryInterval = 2000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await mongoose.connect(process.env.MONGO_URL, {
        dbName: "fashAt",
      });
      console.log("✅ MongoDB connected successfully");
      break;
    } catch (error) {
      console.error(
        `❌ MongoDB connection attempt ${attempt} failed: ${error.message}`
      );
      console.error(error.stack); 
      if (attempt === maxRetries) {
        const errorMessage = "🚨 Max retry attempts reached. Exiting...";
        console.error(errorMessage);
        await sendNotification(errorMessage);
        throw new DatabaseConnectionError(errorMessage);
      }
      console.log(`🔄 Retrying in ${retryInterval / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, retryInterval));
    }
  }
};

export default dbConnect;
