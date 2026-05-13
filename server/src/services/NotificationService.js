import nodemailer from "nodemailer";
import dotenv from "dotenv";
import webpush from "web-push";
import { Notification } from "../models/associations.js";

dotenv.config({ path: "server/.env" });

class NotificationService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Check if real SMTP is configured
    this.useConsoleMock = !process.env.SMTP_USER || process.env.SMTP_USER.includes("your-email");
    this.io = null;

    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        "mailto:support@jeevika.app",
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    }
  }

  setIo(io) {
    this.io = io;
  }

  async sendEmail(to, subject, html) {
    if (this.useConsoleMock) {
      console.log(`\n======================================================`);
      console.log(`📧 MOCK EMAIL NOTIFICATION`);
      console.log(`TO: ${to}`);
      console.log(`SUBJECT: ${subject}`);
      console.log(`BODY: ${html.replace(/<[^>]+>/g, " ")}`); // Strip basic HTML for logs
      console.log(`======================================================\n`);
      return { success: true, mock: true };
    }

    try {
      const info = await this.transporter.sendMail({
        from: '"Jeevika Team" <noreply@jeevika.app>',
        to,
        subject,
        html,
      });
      console.log("Email sent: %s", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Email sending failed:", error);
      return { success: false, error };
    }
  }

  async sendSMS(phone, message) {
    // Fast2SMS/Twilio mock integration
    // In production, you would call the Twilio SDK or Fast2SMS HTTP API here
    const isMock = !process.env.TWILIO_SID && !process.env.FAST2SMS_API_KEY;

    if (isMock) {
      console.log(`\n======================================================`);
      console.log(`📱 MOCK SMS NOTIFICATION`);
      console.log(`PHONE: ${phone}`);
      console.log(`MESSAGE: ${message}`);
      console.log(`======================================================\n`);
      return { success: true, mock: true };
    }

    // Actual Implementation would go here...
    console.log(`Actual SMS implementation not configured.`);
    return { success: false, error: "Not configured" };
  }

  // Combined function for high-priority alerts
  async notifyUser(user, subject, message, type = "SYSTEM", actionUrl = null) {
    const promises = [];
    
    // Save to Database (In-App)
    try {
      const dbNotif = await Notification.create({
        userId: user.id,
        title: subject,
        message: message,
        type: type,
        actionUrl: actionUrl
      });

      // Real-time Emit (Phase 3)
      if (this.io) {
        this.io.to(user.id).emit("notification", dbNotif.toJSON());
        console.log(`Real-time notification emitted to room ${user.id}`);
      }
    } catch (dbErr) {
      console.error("Failed to save notification to DB:", dbErr);
    }

    // Always trigger SMS if they have a phone number
    if (user.phone) {
      promises.push(this.sendSMS(user.phone, message));
    }

    // Trigger Email if they registered one
    if (user.email) {
      // Create a nice HTML template for the email
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #10b981; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Jeevika</h1>
          </div>
          <div style="padding: 20px;">
            <h2 style="color: #0f172a;">${subject}</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.5;">${message}</p>
            <br/>
            <p style="color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
              You are receiving this because you are registered on Jeevika.
            </p>
          </div>
        </div>
      `;
      promises.push(this.sendEmail(user.email, subject, html));
    }

    // Phase 4: Trigger Web Push (Native Browser Notification)
    if (user.pushSubscription) {
      const payload = JSON.stringify({
        title: subject,
        body: message,
        url: actionUrl || "/dashboard"
      });
      
      promises.push(
        webpush.sendNotification(user.pushSubscription, payload)
          .catch(err => console.error("Web Push failed:", err))
      );
    }

    await Promise.all(promises);
  }
}

export const notificationService = new NotificationService();
