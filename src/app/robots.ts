import type { MetadataRoute } from "next";

// §81 SEO最低限: Private領域（Case詳細・MY CASES・編集系・Admin）はIndex不可にする。
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/mypage", "/admin", "/post", "/memories/*/edit", "/login", "/signup"],
    },
  };
}
