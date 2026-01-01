import {NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  try {
    const { email, action, scannedImageUrl } = await request.json();

    if (!email || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const payload = {
      clientId: 'kiosk-client',
      timestamp: Date.now(),
    };

    const secretKey = process.env.JWT_SECRET_KEY || 'default_secret_key';
    const token = jwt.sign(payload, secretKey, { expiresIn: '1h' });
    
    let response;

    if (action === 'urlScan') {
       const scanFileName = scannedImageUrl.split('/').pop() || 'scan';
       const qrUrl = `http://${process.env.HOSTNAME}:3000/scans/${scanFileName}`;
       
       response = await fetch(process.env.MAIL_SERVICE_URL || '', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            url: qrUrl,
            fileName: scanFileName,
            email,
          }),
       });
    } else if (action === 'image') {
      if (!scannedImageUrl) {
        return NextResponse.json({ error: "Missing scannedImageUrl for image action" }, { status: 400 });
      }

      const absoluteUrl = new URL(scannedImageUrl, `http://${process.env.HOSTNAME}:3000`).toString();
      const imageResponse = await fetch(absoluteUrl.toString());
      const blob = await imageResponse.blob();

      const formData = new FormData();
      const scanFileName = scannedImageUrl.split('/').pop() || 'scan.jpg';
      formData.append('file', blob, scanFileName);
      formData.append('email', email);

      response = await fetch(process.env.MAIL_SERVICE_URL || '', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (response.ok) {
      return NextResponse.json({ message: "Email inviata con successo" }, { status: 200 });
    } else {
      const error = await response.json();
      return NextResponse.json({ error: error.message || "Errore nell'invio dell'email" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Error in sendMail route:", error);
    return NextResponse.json({ error: error.message || "Errore interno del server" }, { status: 500 });
  }
}
