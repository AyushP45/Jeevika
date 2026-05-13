import express from "express";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import { OAuth2Client } from "google-auth-library";
import { requireAuth } from "../middleware/auth.js";
import { User } from "../models/associations.js";
import { notificationService } from "../services/NotificationService.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

// ─── In-memory OTP store ─────────────────────────────────
// Map<phone, { code, expiresAt, verified }>
const otpStore = new Map();
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
}

// POST /api/auth/send-otp — send OTP to phone number
router.post("/send-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: "Phone number is required" });

    // Rate limit: don't allow resend within 60 seconds
    const existing = otpStore.get(phone);
    if (existing && (Date.now() - (existing.createdAt || 0)) < 60000) {
      return res.status(429).json({ message: "Please wait 60 seconds before requesting a new OTP" });
    }

    const code = generateOTP();
    otpStore.set(phone, {
      code,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
      createdAt: Date.now(),
      verified: false
    });

    // Send OTP via SMS (uses mock in dev, real provider in prod)
    await notificationService.sendSMS(phone, `Your Jeevika verification code is: ${code}. Valid for 5 minutes.`);

    console.log(`📱 OTP for ${phone}: ${code}`); // Always log for dev convenience

    return res.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Send OTP error:", error);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
});

// POST /api/auth/verify-otp — verify the OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ message: "Phone and OTP are required" });

    const stored = otpStore.get(phone);

    if (!stored) {
      return res.status(400).json({ message: "No OTP was sent to this number. Please request a new one." });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(phone);
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    if (stored.code !== otp) {
      return res.status(400).json({ message: "Invalid OTP. Please check and try again." });
    }

    // Mark as verified
    otpStore.set(phone, { ...stored, verified: true });

    return res.json({ success: true, message: "Phone number verified!" });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ message: "Failed to verify OTP" });
  }
});
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes("your_google") 
  ? new OAuth2Client(GOOGLE_CLIENT_ID) 
  : null;

function sign(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
}

// POST /api/auth/google — handle Google OAuth (access token from implicit flow)
router.post("/google", async (req, res) => {
  try {
    console.log("Received Google Auth Request");
    const { credential } = req.body;
    if (!credential) {
      console.log("No credential provided");
      return res.status(400).json({ message: "Google credential is required" });
    }

    console.log("Fetching user info from Google with token:", credential.substring(0, 15) + "...");
    const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${credential}` }
    });

    if (!googleRes.ok) {
      const errText = await googleRes.text();
      console.error("Google API rejected token. Status:", googleRes.status, "Body:", errText);
      return res.status(401).json({ message: "Invalid Google credential. Please try again." });
    }

    const profile = await googleRes.json();
    console.log("Google profile received:", profile.email);
    const { email, name, picture, sub: googleId } = profile;

    if (!email) {
      console.log("No email in profile");
      return res.status(400).json({ message: "Could not get email from Google account" });
    }

    // Find existing user by email or create a new one
    let user = await User.findOne({ where: { email } });
    if (!user) {
      console.log("Creating new user for:", email);
      const tempPhone = `google_${googleId}`;
      user = await User.create({
        name: name || email.split("@")[0],
        email,
        phone: tempPhone,
        passwordHash: "google-oauth", // not used for Google sign-in
        role: "worker",
        profilePhoto: picture || null,
        badges: ["Verified"]
      });
    }

    if (!user.isActive) {
      console.log("User is suspended:", email);
      return res.status(403).json({ message: "Your account has been suspended. Contact support." });
    }

    const token = sign(user);
    console.log("Google auth successful for:", email);
    return res.json({ token, user: user.toSafeObject(), isNewUser: !user.createdAt });
  } catch (error) {
    console.error("Google auth error:", error);
    return res.status(500).json({ message: "Google sign-in failed. Please try again." });
  }
});

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, phone, role } = req.body;

    if (!phone) return res.status(400).json({ message: "Mobile number is required" });
    if (!role) return res.status(400).json({ message: "Role is required" });

    // Verify phone was OTP-verified
    const otpEntry = otpStore.get(phone);
    if (!otpEntry || !otpEntry.verified) {
      return res.status(400).json({ message: "Phone number must be verified with OTP first", field: "phone" });
    }

    // Check for duplicate phone
    const existingPhone = await User.findOne({ where: { phone } });
    if (existingPhone) {
      return res.status(409).json({ message: "A user with this mobile number already exists", field: "phone" });
    }

    // Check for duplicate email if provided
    if (email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(409).json({ message: "A user with this email already exists", field: "email" });
      }
    }

    const user = await User.createWithPassword(req.body);
    otpStore.delete(phone); // Clean up verified OTP
    const token = sign(user);
    return res.status(201).json({ token, user: user.toSafeObject() });
  } catch (error) {
    console.error("Register error:", error);
    // Sequelize unique constraint
    if (error.name === "SequelizeUniqueConstraintError") {
      const field = error.errors?.[0]?.path;
      return res.status(409).json({ message: `${field === "email" ? "Email" : "Phone"} is already registered`, field });
    }
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ message: error.errors?.[0]?.message || "Validation error" });
    }
    return res.status(500).json({ message: "Registration failed. Please try again." });
  }
});

// POST /api/auth/login — supports email OR phone + password
router.post("/login", async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if (!password) return res.status(400).json({ message: "Password is required" });
    if (!email && !phone) return res.status(400).json({ message: "Email or mobile number is required" });

    // Find by email OR phone
    const where = {};
    if (email) {
      where.email = email;
    } else {
      // Normalize phone for lookup
      const clean = phone.replace(/[\s\-\+]/g, "");
      where.phone = clean.length === 10 ? `+91${clean}` : `+${clean}`;
    }

    const user = await User.findOne({ where });

    if (!user) {
      return res.status(401).json({ message: "No account found with those credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Your account has been suspended. Contact support." });
    }

    const valid = await user.verifyPassword(password);
    if (!valid) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    const token = sign(user);
    return res.json({ token, user: user.toSafeObject() });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Login failed. Please try again." });
  }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", (_req, res) => {
  res.json({ message: "If an account exists with those details, a reset link has been sent." });
});

// GET /api/auth/me — get current user from token
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ user: user.toSafeObject() });
  } catch (error) {
    console.error("Get me error:", error);
    return res.status(500).json({ message: "Failed to get user" });
  }
});

router.put("/profile", requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const allowedFields = ["name", "location", "upi", "skills", "experience", "companyName", "availability", "profilePhoto", "idProof", "workSamples"];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
    );

    await user.update(updates);
    return res.json({ user: user.toSafeObject() });
  } catch (error) {
    console.error("Profile update error:", error);
    return res.status(500).json({ message: "Failed to update profile" });
  }
});

// POST /api/auth/verify — submit for verification
router.post("/verify", requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { idProof } = req.body;
    if (!idProof) return res.status(400).json({ message: "ID Proof is required for verification" });

    await user.update({ 
      idProof,
      verificationStatus: "Pending"
    });
    
    return res.json({ user: user.toSafeObject() });
  } catch (error) {
    console.error("Verification submit error:", error);
    return res.status(500).json({ message: "Failed to submit verification" });
  }
});

// POST /api/auth/push-subscription — save browser push subscription
router.post("/push-subscription", requireAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { subscription } = req.body;
    if (!subscription) return res.status(400).json({ message: "Subscription is required" });

    await user.update({ pushSubscription: subscription });
    return res.json({ success: true });
  } catch (error) {
    console.error("Push subscription error:", error);
    return res.status(500).json({ message: "Failed to save push subscription" });
  }
});

// POST /api/auth/kyc — Submit identity proof
router.post("/kyc", requireAuth, async (req, res) => {
  try {
    const { idType, idPhoto } = req.body;
    if (!idPhoto) return res.status(400).json({ message: "ID photo is required" });

    const user = await User.findByPk(req.user.id);
    if (user.kycStatus === "Verified") {
      return res.status(400).json({ message: "Identity is already verified" });
    }

    await user.update({
      kycStatus: "Pending",
      idProof: idPhoto, // Store the photo in the existing idProof field
      // We could also store idType if we add a field, but for now just updating status
    });

    res.json({ success: true, message: "KYC submitted for review", kycStatus: "Pending" });
  } catch (error) {
    console.error("KYC submission error:", error);
    res.status(500).json({ message: "Failed to submit KYC" });
  }
});

export default router;
