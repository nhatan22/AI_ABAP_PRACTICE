import { GenerateForm } from "@/components/GenerateForm";

export default function GeneratePage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI ra đề mới</h1>
        <p className="mt-1 text-sm text-muted">
          Chọn track, mức độ và chủ đề bạn muốn luyện. AI sẽ tạo đề kèm milestone, gợi ý, lời giải mẫu và lưu vào kho bài.
        </p>
      </div>
      <GenerateForm />
    </div>
  );
}
