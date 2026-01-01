import { NextResponse } from "next/server";
import { promisify } from "util";
import { exec } from "child_process";

const execAsync = promisify(exec);

export async function POST() {
  try {
    const { stdout, stderr } = await execAsync('sync && echo 3 > /proc/sys/vm/drop_caches');

    return NextResponse.json({
      success: true,
      stdout: stdout?.trim(),
      stderr: stderr?.trim(),
      message: "Cache RAM pulita (echo 3 > /proc/sys/vm/drop_caches)",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Errore durante la pulizia della cache",
        stderr: error?.stderr,
      },
      { status: 500 },
    );
  }
}
