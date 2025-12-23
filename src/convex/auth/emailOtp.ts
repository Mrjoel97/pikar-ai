import { Email } from "@convex-dev/auth/providers/Email";
import axios from "axios";

function generateRandomString(length: number, chars: string) {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const alphabet = (type: string) => {
  if (type === "0-9") return "0123456789";
  return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
};

export const emailOtp = Email({
  id: "email-otp",
  maxAge: 60 * 15, // 15 minutes
  // This function can be asynchronous
  generateVerificationToken() {
    return generateRandomString(6, alphabet("0-9"));
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    try {
      await axios.post(
        "https://email.vly.ai/send_otp",
        {
          to: email,
          otp: token,
          appName: process.env.VLY_APP_NAME || "a vly.ai application",
        },
        {
          headers: {
            "x-api-key": "vlytothemoon2025",
          },
        },
      );
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  },
});