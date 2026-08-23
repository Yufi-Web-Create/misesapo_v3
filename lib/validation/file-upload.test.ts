import { describe, expect, it } from "vitest";
import { validateFileUpload } from "./file-upload";

describe("validateFileUpload", () => {
  it("accepts a reasonably sized PNG", () => {
    const result = validateFileUpload({ name: "logo.png", type: "image/png", size: 1024 });
    expect(result.ok).toBe(true);
  });

  it("rejects files over the size limit", () => {
    const result = validateFileUpload({
      name: "big.pdf",
      type: "application/pdf",
      size: 21 * 1024 * 1024,
    });
    expect(result).toEqual({ ok: false, reason: "ファイルサイズは20MB以下にしてください。" });
  });

  it("rejects disallowed MIME types even with a safe-looking extension", () => {
    const result = validateFileUpload({
      name: "script.png",
      type: "application/x-msdownload",
      size: 100,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects dangerous extensions regardless of declared MIME type", () => {
    const result = validateFileUpload({
      name: "payload.svg",
      type: "image/svg+xml",
      size: 100,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects zero-byte files", () => {
    const result = validateFileUpload({ name: "empty.png", type: "image/png", size: 0 });
    expect(result.ok).toBe(false);
  });
});
