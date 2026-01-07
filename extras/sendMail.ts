import { NextResponse, NextRequest } from "next/server";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken"; 

const transporter = nodemailer.createTransport({
   //configure your email service here, I use postfix
});

export function verifyJWT(token: string): boolean {
   try {
      const secret = process.env.JWT_SECRET || "default_secret";
      const decoded = jwt.verify(token, secret);
      return true;
   } catch (error) {
      console.error("JWT verification failed:", error);
      return false;
   }
}

function createMailTemplate(title: string, content: string, actionUrl?: string, actionText?: string): string {
   return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; background-color: #f5f5f5; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
          .header h1 { font-size: 28px; font-weight: 600; margin-bottom: 10px; }
          .content { padding: 40px 30px; }
          .content p { color: #333; line-height: 1.6; margin-bottom: 20px; font-size: 16px; }
          .action { text-align: center; margin: 30px 0; }
          .action a { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; transition: transform 0.2s; }
          .action a:hover { transform: scale(1.05); }
          .code-block { background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; border-radius: 4px; font-family: 'Monaco', 'Courier New', monospace; word-break: break-all; margin: 20px 0; font-size: 14px; color: #333; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; }
          .footer p { margin: 5px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${title}</h1>
          </div>
          <div class="content">
            ${content}
            ${
               actionUrl && actionText
                  ? `
              <div class="action">
                <a href="${actionUrl}">${actionText}</a>
              </div>
            `
                  : ""
            }
          </div>
          <div class="footer"> 
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

async function sendUrlEmail(recipientEmail: string, url: string, fileName: string): Promise<boolean> {
   try {
      const htmlContent = `
      <p>Hi,</p>
      <p>You have been sent a scanned document. You can access it via the link below:</p>
      <a href="${url}">${url}</a>
      <p><strong>File name:</strong> ${fileName}</p>
    `;

      const mailOptions = {
         from: `Scanner Service <noreply@${process.env.EMAIL_DOMAIN}>`,
         to: recipientEmail,
         subject: `Scanned Document: ${fileName}`,
         html: createMailTemplate("New Document Available", htmlContent)
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email successfully sent to ${recipientEmail}`);
      return true;
   } catch (error) {
      console.error("Error sending email with URL:", error);
      return false;
   }
}

async function sendImageEmail(recipientEmail: string, imageBuffer: Buffer, fileName: string): Promise<boolean> {
   try {
      const htmlContent = `
        <p>Hi,</p>
        <p>You have been sent a scanned document.</p>
        <p><strong>File name:</strong> ${fileName}</p>
        <p>The document is attached to this email.</p>
    `;

      const mailOptions = {
         from: `Scanner Service <noreply@${process.env.EMAIL_DOMAIN}>`,
         to: recipientEmail,
         subject: `Scanned Image: ${fileName}`,
         html: createMailTemplate("New Image Available", htmlContent),
         attachments: [
            {
               filename: fileName,
               content: imageBuffer,
               contentType: "image/jpeg"
            }
         ]
      };
      await transporter.sendMail(mailOptions);
      console.log(`Email with image successfully sent to ${recipientEmail}`);
      return true;
   } catch (error) {
      console.error("Error sending email with image:", error);
      return false;
   }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
   const authHeader = request.headers.get("Authorization");
   if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }

   const token = authHeader.split(" ")[1];
   if (!verifyJWT(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }

   const contentType = request.headers.get("Content-Type");
   let recipientEmail: string | null = null;

   if (contentType === "application/json") {
      const body = await request.json();
      const { url, fileName, email } = body;

      if (email) {
         recipientEmail = email;
      }

      if (!url || !fileName || !recipientEmail) {
         return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
      }

      const success = await sendUrlEmail(recipientEmail, url, fileName);
      if (success) {
         return NextResponse.json({ message: "Email inviata con successo" }, { status: 200 });
      } else {
         return NextResponse.json({ error: "Errore durante l'invio dell'email" }, { status: 500 });
      }
   } else if (contentType?.startsWith("multipart/form-data")) {
      const formData = await request.formData();
      const image = formData.get("image");
      const email = formData.get("email");

      if (email && typeof email === "string") {
         recipientEmail = email;
      }

      if (!recipientEmail || !image || !(image instanceof File)) {
         return NextResponse.json({ error: "Invalid image file or missing email" }, { status: 400 });
      }

      const arrayBuffer = await image.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);

      const success = await sendImageEmail(recipientEmail, imageBuffer, image.name);
      if (success) {
         return NextResponse.json({ message: "Email inviata con successo" }, { status: 200 });
      } else {
         return NextResponse.json({ error: "Errore durante l'invio dell'email" }, { status: 500 });
      }
   } else {
      return NextResponse.json({ error: "Unsupported Content-Type" }, { status: 415 });
   }
}
