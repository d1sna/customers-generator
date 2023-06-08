const crypto = require("crypto");

export default function encryptStringToEightSymbols(input: string): string {
  const hash = crypto.createHash("sha256").update(input).digest("hex");
  return hash.substring(0, 8);
}
