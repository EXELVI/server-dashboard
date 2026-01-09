import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";

const secretKety = process.env.JWT_SECRET_KEY || "default_secret_key";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }
  
  const token = req.headers.authorization?.split(" ")[1];
   if (!token) {
      return res.status(401).json({ valid: false, message: "No token provided" });
   }
   try {
      const decoded = jwt.verify(token, secretKety);
      return res.status(200).json({ valid: true, decoded, message: "Token is valid" });
   } catch {
      return res.status(401).json({ valid: false, error: "Invalid token" });
   }
}