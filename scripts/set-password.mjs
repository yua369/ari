// Usage: node scripts/set-password.mjs "新しいパスワード"
// .env の ADMIN_PASSWORD_HASH を書き換える（平文パスワードはコードにも.envにも残さない）
import bcrypt from "bcryptjs";
import { readFileSync, writeFileSync, existsSync } from "fs";

const password = process.argv[2];
if (!password) {
  console.error('使い方: node scripts/set-password.mjs "新しいパスワード"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
// Next.js の .env ローダーは dotenv-expand を使うため、"$" を含むbcryptハッシュは
// そのまま書くと $2b や $12 が変数展開されて壊れる。"\$" にエスケープして防ぐ。
const escapedHash = hash.replace(/\$/g, "\\$");
const envPath = new URL("../.env", import.meta.url);
let content = existsSync(envPath) ? readFileSync(envPath, "utf-8") : "";

if (content.match(/^ADMIN_PASSWORD_HASH=.*$/m)) {
  content = content.replace(/^ADMIN_PASSWORD_HASH=.*$/m, `ADMIN_PASSWORD_HASH="${escapedHash}"`);
} else {
  content += `\nADMIN_PASSWORD_HASH="${escapedHash}"\n`;
}

writeFileSync(envPath, content);
console.log("ADMIN_PASSWORD_HASH を更新しました。");
