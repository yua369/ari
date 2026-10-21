import { Sidebar } from "@/components/nav/Sidebar";
import { TopNav } from "@/components/nav/TopNav";
import { Footer } from "@/components/nav/Footer";

// §21 App Shell: Desktop = LEFT SIDEBAR + MAIN CONTENT。Mobile = TopNav(簡略)+MobileBottomNav。
// 認証はここでは強制しない。PATTERNS等は未ログインでも閲覧できる公開ページのため。
// ログイン必須のページ（/post, /saved, /mypage, /admin, 編集系）は各pageでrequireAuth()する。
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopNav />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-6">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
