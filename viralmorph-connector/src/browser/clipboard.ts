/**
 * Cross-platform clipboard copy using the OS native tool. No dependencies.
 * macOS: pbcopy, Windows: clip, Linux: xclip or xsel (if installed).
 */
import { spawn } from "node:child_process";

function pipeTo(command: string, args: string[], text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args);
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with ${code}: ${stderr}`));
    });
    child.stdin.write(text);
    child.stdin.end();
  });
}

/** Copy text to the system clipboard. Returns true on success, false otherwise. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (process.platform === "darwin") {
      await pipeTo("pbcopy", [], text);
      return true;
    }
    if (process.platform === "win32") {
      await pipeTo("clip", [], text);
      return true;
    }
    // Linux: try xclip, then xsel.
    try {
      await pipeTo("xclip", ["-selection", "clipboard"], text);
      return true;
    } catch {
      await pipeTo("xsel", ["--clipboard", "--input"], text);
      return true;
    }
  } catch {
    return false;
  }
}
