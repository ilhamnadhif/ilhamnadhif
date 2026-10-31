// Prints the ADMIN_PASSWORD_HASH and a fresh SESSION_SECRET for .env.
// Usage: npm run hash-password            (asks for the password, input hidden)
//        npm run hash-password -- "secret" (non-interactive)
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

async function readHidden(prompt) {
  if (!process.stdin.isTTY) {
    let input = "";
    for await (const chunk of process.stdin) input += chunk;
    return input.trim();
  }
  process.stdout.write(prompt);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  return new Promise((resolve) => {
    let value = "";
    process.stdin.on("data", (char) => {
      if (char === "\r" || char === "\n" || char === "\u0004") {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdout.write("\n");
        resolve(value);
      } else if (char === "\u0003") {
        process.exit(130);
      } else if (char === "\u007f") {
        value = value.slice(0, -1);
      } else {
        value += char;
      }
    });
  });
}

const password = process.argv[2] ?? (await readHidden("Admin password: "));
if (!password || password.length < 10) {
  console.error("Use a password of at least 10 characters.");
  process.exit(1);
}

const salt = randomBytes(16);
const key = await scryptAsync(password, salt, 64);

console.log("\nAdd these lines to your .env file:\n");
console.log(`ADMIN_PASSWORD_HASH=${salt.toString("hex")}:${key.toString("hex")}`);
console.log(`SESSION_SECRET=${randomBytes(32).toString("hex")}`);
