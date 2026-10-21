import { requireAuth } from "@/lib/auth";
import { PatternCandidateForm } from "@/components/pattern/PatternCandidateForm";

export default async function NewPatternCandidatePage() {
  await requireAuth("/patterns/candidates/new");
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-bold">+ PATTERN候補を送る</h1>
        <p className="text-dim text-sm mt-1">一般ユーザーはPatternを直接登録できません。管理者が確認のうえ登録します。</p>
      </div>
      <PatternCandidateForm />
    </div>
  );
}
