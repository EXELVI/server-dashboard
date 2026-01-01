import { NextRequest, NextResponse } from "next/server";

import fs from "fs";
import path from "path";

const basePath = "/mnt/4tb/Scans";

export async function GET(request: NextRequest, { params }: { params: { file: string } }) {
   if (!(await params)?.file) {
      return NextResponse.json({ error: "File parameter is missing" }, { status: 400 });
   }

   const fileName = (await params).file;

   const filePath = path.join(basePath, fileName);

   if (!filePath.startsWith(basePath)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
   }

   try {
      const fileBuffer = fs.readFileSync(filePath);

      const ext = path.extname(fileName).toLowerCase();
      const mime =
         ext === ".jpg" || ext === ".jpeg"
            ? "image/jpeg"
            : ext === ".png"
            ? "image/png"
            : ext === ".pdf"
            ? "application/pdf"
            : "application/octet-stream";

      return new NextResponse(fileBuffer, {
         headers: {
            "Content-Type": mime,
            "Content-Disposition": `inline; filename="${fileName}"`
         }
      });
   } catch (error) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
   }
}
