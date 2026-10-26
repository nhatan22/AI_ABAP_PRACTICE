# ABAP & UI5 Dojo

Web app luyện **ABAP thuần** và **SAPUI5/Fiori (JavaScript)** theo kiểu LeetCode. AI (Gemini) chấm bài, kiểm tra từng milestone và đánh giá độ tối ưu.

## Chạy

```bash
npm install
npm run db:push    # tạo bảng trong Postgres (Prisma)
npm run db:seed    # nạp 28 bài tập có sẵn (17 ABAP, 11 UI5)
npm run dev        # http://localhost:3000
```

Cấu hình trong `.env` (xem `.env.example`): `DATABASE_URL`, `GEMINI_API_KEY`, `GEMINI_MODEL`.

## Tính năng

- **Kho bài** theo track / mức độ (Nhập môn → Chuyên gia) / chủ đề: hashed table, sorted table, secondary key, two pointers, sliding window, LRU, Map aggregation, routing, OData…
- **Editor Monaco**: tô màu ABAP/JS, format code (`Alt+Shift+F`), gạch chân lỗi theo dòng, nộp bài bằng `Ctrl+Enter`.
- **Static check** chạy ngay trên trình duyệt: cân bằng khối IF/LOOP/METHOD/CLASS…, dấu chấm, chuỗi chưa đóng; cảnh báo hiệu năng (LOOP lồng, SELECT trong LOOP, READ TABLE tuyến tính…). UI5 dùng parser JS thật (acorn) + best practice.
- **Nộp & chấm AI**: mô phỏng compile, kiểm từng milestone, dry-run test case (cả edge case), phân tích Big-O so với mục tiêu, điểm tối ưu và style, bước tiếp theo.
- **Gia sư AI** kiểu Socratic (không đưa đáp án), **gợi ý từng bước**, **xem đáp án mẫu** (có xác nhận).
- **AI ra đề mới** theo track/mức độ/chủ đề, lưu vào DB.
- Lưu lịch sử nộp, điểm, tiến độ; bản nháp tự lưu trong trình duyệt.

## Lưu ý

- Không có hệ thống SAP thật phía sau: "compile" và "test" là AI mô phỏng + static check cục bộ. Hãy dán code vào SE80/ADT để xác nhận cuối cùng.
- Gemini free tier có giới hạn tốc độ; `lib/gemini.ts` tự thử lại và chuyển sang model dự phòng.
- Không commit file `.env`.

## Đăng nhập & quản lý user

- Mọi trang/API đều yêu cầu đăng nhập (`proxy.ts` + kiểm tra phía server).
- **Admin** lấy từ `.env`: `ADMIN_USERNAME`, `ADMIN_PASSWORD` (tự tạo ở lần đăng nhập đầu). Đổi mật khẩu admin = sửa `.env` rồi restart.
- Chỉ admin có tab **Quản lý user**: tạo tài khoản, đổi mật khẩu, khoá/mở khoá, xoá. User thường không thấy tab này và bị chặn ở API (403).
- Mỗi user có lịch sử nộp bài, chat gia sư và bản nháp code riêng. Kho bài tập dùng chung.
- `AUTH_SECRET` (chuỗi ngẫu nhiên dài) dùng để ký cookie phiên; đổi nó sẽ đăng xuất tất cả mọi người.
