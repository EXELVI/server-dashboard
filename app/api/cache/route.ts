import { NextResponse } from "next/server";
import { promisify } from "util";
import { exec } from "child_process";
import { getTranslations } from "@/lib/translations";

const execAsync = promisify(exec);

export async function POST() {
  const translations = getTranslations(process.env.NEXT_PUBLIC_LOCALE || undefined);
  
  try {
    const { stdout, stderr } = await execAsync('sync && echo 3 > /proc/sys/vm/drop_caches');

    return NextResponse.json({
      success: true,
      stdout: stdout?.trim(),
      stderr: stderr?.trim(),
      message: translations.page.cacheCleared,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || translations.page.cacheClearingError,
        stderr: error?.stderr,
      },
      { status: 500 },
    );
  }
}
