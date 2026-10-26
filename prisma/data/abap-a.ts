import type { SeedExercise } from "./types";

export const abapA: SeedExercise[] = [
  {
    slug: "abap-fizzbuzz-modern",
    track: "ABAP",
    level: "BEGINNER",
    title: "FizzBuzz với ABAP 7.4+",
    topic: "Expressions",
    tags: ["COND", "DO", "string template", "inline declaration"],
    description: `Viết method \`run( n )\` trả về \`string_table\` gồm **n** phần tử:

- bội của 15 → \`FizzBuzz\`
- bội của 3 → \`Fizz\`
- bội của 5 → \`Buzz\`
- còn lại → chính số đó (dạng chuỗi)

Ví dụ \`run( 5 )\` → \`1, 2, Fizz, 4, Buzz\`.

**Yêu cầu phong cách:** dùng cú pháp ABAP hiện đại (\`COND\`/\`SWITCH\`, string template \`|{ }|\`, inline declaration) thay vì \`IF/ELSEIF\` dài dòng.`,
    milestones: [
      { id: "m1", title: "Trả về đúng n phần tử", detail: "Bảng kết quả có đúng n dòng, đúng thứ tự 1..n." },
      { id: "m2", title: "Logic Fizz/Buzz/FizzBuzz đúng", detail: "Kiểm tra bội 15 TRƯỚC bội 3 và 5." },
      { id: "m3", title: "Dùng COND hoặc SWITCH", detail: "Biểu thức điều kiện thay cho chuỗi IF/ELSEIF." },
      { id: "m4", title: "Chuyển số thành chuỗi bằng string template", detail: "Dùng |{ ... }| thay vì CONDENSE/WRITE TO." },
    ],
    starterCode: `REPORT zpractice_fizzbuzz.

CLASS lcl_fizz DEFINITION.
  PUBLIC SECTION.
    CLASS-METHODS run
      IMPORTING n             TYPE i
      RETURNING VALUE(result) TYPE string_table.
ENDCLASS.

CLASS lcl_fizz IMPLEMENTATION.
  METHOD run.
    " TODO: implement
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  LOOP AT lcl_fizz=>run( 15 ) INTO DATA(line).
    WRITE / line.
  ENDLOOP.
`,
    hints: [
      "DO n TIMES. cho bạn sy-index chạy từ 1..n.",
      "COND string( WHEN sy-index MOD 15 = 0 THEN '...' WHEN ... ELSE ... ) là một biểu thức, dùng được ngay sau APPEND.",
      "|{ sy-index }| chuyển số thành chuỗi mà không cần biến phụ.",
    ],
    solution: `CLASS lcl_fizz IMPLEMENTATION.
  METHOD run.
    DO n TIMES.
      APPEND COND string( WHEN sy-index MOD 15 = 0 THEN 'FizzBuzz'
                          WHEN sy-index MOD 3  = 0 THEN 'Fizz'
                          WHEN sy-index MOD 5  = 0 THEN 'Buzz'
                          ELSE |{ sy-index }| ) TO result.
    ENDDO.
  ENDMETHOD.
ENDCLASS.`,
    targetBigO: "O(n)",
  },
  {
    slug: "abap-palindrome-string-functions",
    track: "ABAP",
    level: "BEGINNER",
    title: "Palindrome với string function",
    topic: "String processing",
    tags: ["to_lower", "replace", "reverse", "xsdbool"],
    description: `Viết \`is_palindrome( input )\` trả về \`abap_bool\`.

Chuỗi là palindrome nếu đọc xuôi/ngược giống nhau, **bỏ qua** khoảng trắng, dấu câu và phân biệt hoa/thường không quan trọng.

- \`'A man, a plan, a canal: Panama'\` → true
- \`'race a car'\` → false
- \`''\` → true

Hãy dùng string function có sẵn của ABAP (\`to_lower\`, \`replace\` với regex, \`reverse\`) – **không** tự viết vòng lặp so từng ký tự.`,
    milestones: [
      { id: "m1", title: "Chuẩn hoá chuỗi", detail: "Loại ký tự không phải chữ/số bằng replace + regex, đưa về chữ thường." },
      { id: "m2", title: "So sánh với reverse( )", detail: "Dùng reverse thay vì vòng lặp." },
      { id: "m3", title: "Trả về bằng xsdbool", detail: "Không dùng IF/ELSE chỉ để gán abap_true/abap_false." },
      { id: "m4", title: "Xử lý chuỗi rỗng", detail: "Chuỗi rỗng phải trả về abap_true." },
    ],
    starterCode: `REPORT zpractice_palindrome.

CLASS lcl_text DEFINITION.
  PUBLIC SECTION.
    CLASS-METHODS is_palindrome
      IMPORTING input         TYPE string
      RETURNING VALUE(result) TYPE abap_bool.
ENDCLASS.

CLASS lcl_text IMPLEMENTATION.
  METHOD is_palindrome.
    " TODO
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  WRITE / lcl_text=>is_palindrome( 'A man, a plan, a canal: Panama' ).
  WRITE / lcl_text=>is_palindrome( 'race a car' ).
`,
    hints: [
      "replace( val = input regex = '[^A-Za-z0-9]' with = '' occ = 0 ) xoá mọi ký tự không phải chữ/số.",
      "xsdbool( a = b ) trả về abap_true/abap_false (kiểu abap_bool).",
    ],
    solution: `METHOD is_palindrome.
  DATA(clean) = to_lower( replace( val = input regex = '[^A-Za-z0-9]' with = '' occ = 0 ) ).
  result = xsdbool( clean = reverse( clean ) ).
ENDMETHOD.`,
    targetBigO: "O(n)",
  },
  {
    slug: "abap-two-sum-hashed",
    track: "ABAP",
    level: "EASY",
    title: "Two Sum bằng hashed table",
    topic: "Hashed table",
    tags: ["hashed table", "leetcode", "READ TABLE WITH TABLE KEY"],
    description: `Cho bảng số nguyên \`nums\` và \`target\`. Trả về **cặp chỉ số (1-based)** của hai phần tử có tổng bằng \`target\`.

- Luôn có đúng 1 đáp án, không dùng một phần tử hai lần.
- \`nums = [2, 7, 11, 15], target = 9\` → \`first = 1, second = 2\`
- \`nums = [3, 3], target = 6\` → \`first = 1, second = 2\`

Cách brute-force 2 vòng LOOP là **O(n²)**. Mục tiêu của bài này: **O(n)** bằng cách dùng *hashed table* để tra "phần bù" (\`target - num\`) trong O(1).`,
    milestones: [
      { id: "m1", title: "Kết quả đúng với ví dụ", detail: "Trả về (1,2) cho [2,7,11,15]/9 và (1,2) cho [3,3]/6." },
      { id: "m2", title: "Dùng HASHED TABLE", detail: "Khai báo TYPE HASHED TABLE ... WITH UNIQUE KEY để lưu giá trị đã gặp." },
      { id: "m3", title: "Chỉ một lần duyệt (không LOOP lồng)", detail: "Độ phức tạp thời gian O(n)." },
      { id: "m4", title: "Tra cứu theo key, không quét tuyến tính", detail: "READ TABLE ... WITH TABLE KEY hoặc table expression theo key của hashed table." },
    ],
    starterCode: `REPORT zpractice_two_sum.

CLASS lcl_solution DEFINITION.
  PUBLIC SECTION.
    TYPES: BEGIN OF ty_pair,
             first  TYPE i,
             second TYPE i,
           END OF ty_pair.
    CLASS-METHODS two_sum
      IMPORTING nums          TYPE int4_table
                target        TYPE i
      RETURNING VALUE(result) TYPE ty_pair.
ENDCLASS.

CLASS lcl_solution IMPLEMENTATION.
  METHOD two_sum.
    " TODO
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(pair) = lcl_solution=>two_sum( nums = VALUE #( ( 2 ) ( 7 ) ( 11 ) ( 15 ) ) target = 9 ).
  WRITE: / pair-first, pair-second.
`,
    hints: [
      "Duyệt từng số; với mỗi số tính complement = target - num rồi hỏi: 'complement đã xuất hiện trước đó chưa?'",
      "Lưu mỗi số cùng chỉ số của nó vào một hashed table có key là giá trị số.",
      "INSERT ... INTO TABLE trên hashed table với key trùng sẽ không dump, chỉ trả sy-subrc = 4.",
    ],
    solution: `METHOD two_sum.
  TYPES: BEGIN OF ty_seen,
           value TYPE i,
           idx   TYPE i,
         END OF ty_seen.
  DATA seen TYPE HASHED TABLE OF ty_seen WITH UNIQUE KEY value.

  LOOP AT nums INTO DATA(num).
    DATA(idx) = sy-tabix.
    READ TABLE seen WITH TABLE KEY value = target - num ASSIGNING FIELD-SYMBOL(<hit>).
    IF sy-subrc = 0.
      result = VALUE #( first = <hit>-idx second = idx ).
      RETURN.
    ENDIF.
    INSERT VALUE #( value = num idx = idx ) INTO TABLE seen.
  ENDLOOP.
ENDMETHOD.`,
    targetBigO: "O(n)",
  },
  {
    slug: "abap-find-duplicates",
    track: "ABAP",
    level: "EASY",
    title: "Tìm phần tử trùng lặp",
    topic: "Hashed table",
    tags: ["hashed table", "set", "INSERT sy-subrc"],
    description: `Cho \`nums\` (bảng số nguyên). Trả về bảng các giá trị **xuất hiện từ 2 lần trở lên**, mỗi giá trị chỉ liệt kê **một lần**, theo thứ tự lần lặp đầu tiên được phát hiện.

\`[4, 3, 2, 7, 8, 2, 3, 1]\` → \`[2, 3]\`

Không được dùng \`SORT\` + \`DELETE ADJACENT DUPLICATES\` (O(n log n) và làm đổi thứ tự). Hãy dùng *hashed table như một tập hợp (set)* để đạt **O(n)**.`,
    milestones: [
      { id: "m1", title: "Kết quả đúng", detail: "[4,3,2,7,8,2,3,1] → [2,3]." },
      { id: "m2", title: "Không trả về trùng", detail: "Giá trị lặp 3 lần chỉ xuất hiện 1 lần trong kết quả." },
      { id: "m3", title: "Dùng hashed table làm set", detail: "TYPE HASHED TABLE OF i WITH UNIQUE KEY table_line." },
      { id: "m4", title: "O(n), không SORT", detail: "Một lượt duyệt, kiểm tra trùng bằng sy-subrc của INSERT hoặc READ." },
    ],
    starterCode: `REPORT zpractice_duplicates.

CLASS lcl_solution DEFINITION.
  PUBLIC SECTION.
    CLASS-METHODS find_duplicates
      IMPORTING nums          TYPE int4_table
      RETURNING VALUE(result) TYPE int4_table.
ENDCLASS.

CLASS lcl_solution IMPLEMENTATION.
  METHOD find_duplicates.
    " TODO
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  LOOP AT lcl_solution=>find_duplicates( VALUE #( ( 4 ) ( 3 ) ( 2 ) ( 7 ) ( 8 ) ( 2 ) ( 3 ) ( 1 ) ) ) INTO DATA(d).
    WRITE / d.
  ENDLOOP.
`,
    hints: [
      "Dùng hai tập: seen (đã gặp) và reported (đã báo là trùng).",
      "INSERT num INTO TABLE seen. Nếu sy-subrc <> 0 nghĩa là num đã tồn tại.",
    ],
    solution: `METHOD find_duplicates.
  DATA seen     TYPE HASHED TABLE OF i WITH UNIQUE KEY table_line.
  DATA reported TYPE HASHED TABLE OF i WITH UNIQUE KEY table_line.

  LOOP AT nums INTO DATA(num).
    INSERT num INTO TABLE seen.
    IF sy-subrc <> 0.
      INSERT num INTO TABLE reported.
      IF sy-subrc = 0.
        APPEND num TO result.
      ENDIF.
    ENDIF.
  ENDLOOP.
ENDMETHOD.`,
    targetBigO: "O(n)",
  },
  {
    slug: "abap-first-unique-char",
    track: "ABAP",
    level: "EASY",
    title: "Ký tự không lặp đầu tiên",
    topic: "Hashed table",
    tags: ["hashed table", "COLLECT", "substring", "string"],
    description: `Cho chuỗi \`s\`, trả về **chỉ số (0-based)** của ký tự đầu tiên chỉ xuất hiện đúng 1 lần. Không có thì trả về \`-1\`.

- \`'leetcode'\` → 0
- \`'loveleetcode'\` → 2
- \`'aabb'\` → -1

Gợi ý hướng tối ưu: đếm tần suất mỗi ký tự bằng hashed table (1 lượt), rồi duyệt lại chuỗi (lượt 2) để tìm ký tự có đếm = 1 → **O(n)**.`,
    milestones: [
      { id: "m1", title: "Đúng các ví dụ", detail: "0, 2, -1 cho 3 ví dụ." },
      { id: "m2", title: "Đếm bằng hashed table / COLLECT", detail: "Bảng (ký tự → số lần) với UNIQUE KEY." },
      { id: "m3", title: "Hai lượt duyệt độc lập (không lồng)", detail: "Không dùng vòng lặp lồng nhau để đếm." },
      { id: "m4", title: "Trả -1 khi không có", detail: "Xử lý trường hợp mọi ký tự đều lặp hoặc chuỗi rỗng." },
    ],
    starterCode: `REPORT zpractice_first_unique.

CLASS lcl_solution DEFINITION.
  PUBLIC SECTION.
    CLASS-METHODS first_unique
      IMPORTING s             TYPE string
      RETURNING VALUE(result) TYPE i.
ENDCLASS.

CLASS lcl_solution IMPLEMENTATION.
  METHOD first_unique.
    " TODO
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  WRITE / lcl_solution=>first_unique( 'loveleetcode' ).
`,
    hints: [
      "substring( val = s off = i len = 1 ) lấy 1 ký tự tại offset i (0-based).",
      "COLLECT cộng dồn các cột số của dòng có cùng key – rất hợp để đếm.",
    ],
    solution: `METHOD first_unique.
  TYPES: BEGIN OF ty_count,
           ch  TYPE string,
           cnt TYPE i,
         END OF ty_count.
  DATA counts TYPE HASHED TABLE OF ty_count WITH UNIQUE KEY ch.

  DATA(len) = strlen( s ).
  DO len TIMES.
    DATA(entry) = VALUE ty_count( ch = substring( val = s off = sy-index - 1 len = 1 ) cnt = 1 ).
    COLLECT entry INTO counts.
  ENDDO.

  DO len TIMES.
    DATA(offset) = sy-index - 1.
    DATA(c) = substring( val = s off = offset len = 1 ).
    IF counts[ ch = c ]-cnt = 1.
      result = offset.
      RETURN.
    ENDIF.
  ENDDO.
  result = -1.
ENDMETHOD.`,
    targetBigO: "O(n)",
  },
  {
    slug: "abap-valid-parentheses",
    track: "ABAP",
    level: "EASY",
    title: "Dấu ngoặc hợp lệ (stack)",
    topic: "Stack",
    tags: ["stack", "string_table", "CASE", "leetcode"],
    description: `Cho chuỗi chỉ gồm \`()[]{}\`. Trả về \`abap_true\` nếu các dấu ngoặc đóng/mở **đúng loại và đúng thứ tự**.

- \`'()[]{}'\` → true
- \`'([)]'\` → false
- \`'{[]}'\` → true
- \`'('\` → false

ABAP không có kiểu stack, hãy mô phỏng bằng internal table (\`APPEND\` để push, \`DELETE ... INDEX lines( )\` để pop).`,
    milestones: [
      { id: "m1", title: "Đúng các ví dụ", detail: "true/false đúng cho 4 ví dụ." },
      { id: "m2", title: "Dùng stack bằng itab", detail: "Push khi gặp ngoặc mở, pop khi gặp ngoặc đóng." },
      { id: "m3", title: "Xử lý đóng khi stack rỗng", detail: "')' xuất hiện đầu tiên phải trả false, không dump." },
      { id: "m4", title: "Stack phải rỗng ở cuối", detail: "Chuỗi '(' trả false." },
    ],
    starterCode: `REPORT zpractice_parentheses.

CLASS lcl_solution DEFINITION.
  PUBLIC SECTION.
    CLASS-METHODS is_valid
      IMPORTING s             TYPE string
      RETURNING VALUE(result) TYPE abap_bool.
ENDCLASS.

CLASS lcl_solution IMPLEMENTATION.
  METHOD is_valid.
    " TODO
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  WRITE / lcl_solution=>is_valid( '([)]' ).
`,
    hints: [
      "Stack = bảng string_table. Đỉnh stack là stack[ lines( stack ) ].",
      "SWITCH string( c WHEN ')' THEN '(' ... ) ánh xạ ngoặc đóng → ngoặc mở tương ứng.",
    ],
    solution: `METHOD is_valid.
  DATA stack TYPE string_table.
  DO strlen( s ) TIMES.
    DATA(c) = substring( val = s off = sy-index - 1 len = 1 ).
    CASE c.
      WHEN '(' OR '[' OR '{'.
        APPEND c TO stack.
      WHEN ')' OR ']' OR '}'.
        IF stack IS INITIAL.
          result = abap_false.
          RETURN.
        ENDIF.
        DATA(top) = stack[ lines( stack ) ].
        DELETE stack INDEX lines( stack ).
        DATA(expected) = SWITCH string( c WHEN ')' THEN '(' WHEN ']' THEN '[' ELSE '{' ).
        IF top <> expected.
          result = abap_false.
          RETURN.
        ENDIF.
    ENDCASE.
  ENDDO.
  result = xsdbool( stack IS INITIAL ).
ENDMETHOD.`,
    targetBigO: "O(n)",
  },
  {
    slug: "abap-group-sum-collect",
    track: "ABAP",
    level: "MEDIUM",
    title: "Tổng doanh thu theo vùng",
    topic: "Hashed table",
    tags: ["COLLECT", "hashed table", "aggregation", "SORT"],
    description: `Cho bảng \`sales\` (region, amount). Trả về bảng tổng \`amount\` theo từng \`region\`, **sắp xếp giảm dần theo tổng**.

\`\`\`
('NORTH', 100) ('SOUTH', 50) ('NORTH', 25) ('EAST', 70)
→ NORTH 125 | EAST 70 | SOUTH 50
\`\`\`

Cách ngây thơ: với mỗi dòng, LOOP lại bảng kết quả để cộng → **O(n·r)**. Hãy dùng hashed table + \`COLLECT\` (hoặc \`GROUP BY\`/\`REDUCE\`) để cộng dồn trong O(1) mỗi dòng.`,
    milestones: [
      { id: "m1", title: "Tổng đúng theo vùng", detail: "NORTH=125, EAST=70, SOUTH=50." },
      { id: "m2", title: "Sắp xếp giảm dần theo tổng", detail: "SORT ... BY total DESCENDING." },
      { id: "m3", title: "Không dùng vòng lặp lồng", detail: "Không LOOP bảng kết quả trong LOOP sales." },
      { id: "m4", title: "Dùng hashed/sorted key cho tập tổng", detail: "Key theo region để cộng dồn O(1)/O(log n)." },
    ],
    starterCode: `REPORT zpractice_group_sum.

CLASS lcl_solution DEFINITION.
  PUBLIC SECTION.
    TYPES: BEGIN OF ty_sale,
             region TYPE string,
             amount TYPE p LENGTH 15 DECIMALS 2,
           END OF ty_sale,
           tt_sale TYPE STANDARD TABLE OF ty_sale WITH EMPTY KEY,
           BEGIN OF ty_total,
             region TYPE string,
             total  TYPE p LENGTH 15 DECIMALS 2,
           END OF ty_total,
           tt_total TYPE STANDARD TABLE OF ty_total WITH EMPTY KEY.
    CLASS-METHODS aggregate
      IMPORTING sales         TYPE tt_sale
      RETURNING VALUE(result) TYPE tt_total.
ENDCLASS.

CLASS lcl_solution IMPLEMENTATION.
  METHOD aggregate.
    " TODO
  ENDMETHOD.
ENDCLASS.
`,
    hints: [
      "COLLECT cần: các cột key là kiểu ký tự, các cột còn lại là số (i, p, f...).",
      "Khai báo DATA totals TYPE HASHED TABLE OF ty_total WITH UNIQUE KEY region.",
    ],
    solution: `METHOD aggregate.
  DATA totals TYPE HASHED TABLE OF ty_total WITH UNIQUE KEY region.
  LOOP AT sales INTO DATA(sale).
    DATA(entry) = VALUE ty_total( region = sale-region total = sale-amount ).
    COLLECT entry INTO totals.
  ENDLOOP.
  result = totals.
  SORT result BY total DESCENDING.
ENDMETHOD.`,
    targetBigO: "O(n + r log r)",
  },
  {
    slug: "abap-merge-sorted",
    track: "ABAP",
    level: "MEDIUM",
    title: "Gộp hai bảng đã sắp xếp (two pointers)",
    topic: "Two pointers",
    tags: ["two pointers", "WHILE", "table expression"],
    description: `Cho hai bảng số nguyên **đã sắp xếp tăng dần** \`a\` và \`b\`. Trả về một bảng đã sắp xếp chứa mọi phần tử của cả hai.

\`[1,3,5] + [2,4,6,8]\` → \`[1,2,3,4,5,6,8]\`

**Cấm** \`APPEND LINES OF\` rồi \`SORT\` (O(n log n)). Hãy dùng kỹ thuật *hai con trỏ* để đạt **O(n + m)** và chỉ dùng O(1) bộ nhớ phụ ngoài bảng kết quả.`,
    milestones: [
      { id: "m1", title: "Kết quả đúng & có thứ tự", detail: "Đúng với ví dụ và khi một bảng rỗng." },
      { id: "m2", title: "Không SORT", detail: "Không gọi SORT trên kết quả." },
      { id: "m3", title: "Hai con trỏ i, j", detail: "Một vòng WHILE cho đến khi một bên hết, rồi xả phần còn lại." },
      { id: "m4", title: "Ổn định với phần tử bằng nhau", detail: "Khi a[i] = b[j] vẫn tiến triển, không lặp vô hạn." },
    ],
    starterCode: `REPORT zpractice_merge.

CLASS lcl_solution DEFINITION.
  PUBLIC SECTION.
    CLASS-METHODS merge
      IMPORTING a             TYPE int4_table
                b             TYPE int4_table
      RETURNING VALUE(result) TYPE int4_table.
ENDCLASS.

CLASS lcl_solution IMPLEMENTATION.
  METHOD merge.
    " TODO
  ENDMETHOD.
ENDCLASS.
`,
    hints: [
      "Hai biến i, j bắt đầu từ 1. So sánh a[ i ] với b[ j ], đưa nhỏ hơn vào kết quả rồi tăng con trỏ tương ứng.",
      "Sau vòng chính, còn một bảng chưa hết → xả hết bằng một WHILE nữa.",
    ],
    solution: `METHOD merge.
  DATA(i) = 1.
  DATA(j) = 1.
  DATA(na) = lines( a ).
  DATA(nb) = lines( b ).

  WHILE i <= na AND j <= nb.
    IF a[ i ] <= b[ j ].
      APPEND a[ i ] TO result.
      i = i + 1.
    ELSE.
      APPEND b[ j ] TO result.
      j = j + 1.
    ENDIF.
  ENDWHILE.

  WHILE i <= na.
    APPEND a[ i ] TO result.
    i = i + 1.
  ENDWHILE.
  WHILE j <= nb.
    APPEND b[ j ] TO result.
    j = j + 1.
  ENDWHILE.
ENDMETHOD.`,
    targetBigO: "O(n + m)",
  },
  {
    slug: "abap-group-anagrams",
    track: "ABAP",
    level: "MEDIUM",
    title: "Nhóm các anagram",
    topic: "Hashed table",
    tags: ["hashed table", "nested table", "SORT", "leetcode"],
    description: `Cho bảng chuỗi \`words\`. Nhóm các từ là anagram của nhau (cùng bộ ký tự).

\`['eat','tea','tan','ate','nat','bat']\` → \`[['eat','tea','ate'], ['tan','nat'], ['bat']]\`

Ý tưởng: key của mỗi nhóm = các ký tự của từ **sau khi sắp xếp** (\`eat\`/\`tea\`/\`ate\` → \`aet\`). Dùng hashed table với key đó, mỗi dòng chứa một \`string_table\` (nested table). Thứ tự nhóm không quan trọng.`,
    milestones: [
      { id: "m1", title: "Nhóm đúng", detail: "3 nhóm cho ví dụ, mỗi từ nằm đúng nhóm." },
      { id: "m2", title: "Key = ký tự đã sắp xếp", detail: "Tách ký tự, SORT, nối lại làm key." },
      { id: "m3", title: "Hashed table với nested table", detail: "Dòng chứa key + string_table, tra theo key O(1)." },
      { id: "m4", title: "Không so sánh từng cặp từ", detail: "Tránh O(n²) so sánh mọi cặp." },
    ],
    starterCode: `REPORT zpractice_anagrams.

CLASS lcl_solution DEFINITION.
  PUBLIC SECTION.
    TYPES tt_groups TYPE STANDARD TABLE OF string_table WITH EMPTY KEY.
    CLASS-METHODS group_anagrams
      IMPORTING words         TYPE string_table
      RETURNING VALUE(result) TYPE tt_groups.
ENDCLASS.

CLASS lcl_solution IMPLEMENTATION.
  METHOD group_anagrams.
    " TODO
  ENDMETHOD.
ENDCLASS.
`,
    hints: [
      "Để lấy từng ký tự: DO strlen( word ) TIMES. APPEND substring( val = word off = sy-index - 1 len = 1 ) TO chars.",
      "concat_lines_of( table = chars ) nối các dòng của bảng thành một chuỗi.",
      "Dùng READ TABLE ... ASSIGNING <bucket>, nếu chưa có thì INSERT ... ASSIGNING <bucket> rồi APPEND vào <bucket>-words.",
    ],
    solution: `METHOD group_anagrams.
  TYPES: BEGIN OF ty_bucket,
           sorted_key TYPE string,
           words      TYPE string_table,
         END OF ty_bucket.
  DATA buckets TYPE HASHED TABLE OF ty_bucket WITH UNIQUE KEY sorted_key.
  DATA chars   TYPE STANDARD TABLE OF string WITH EMPTY KEY.

  LOOP AT words INTO DATA(word).
    CLEAR chars.
    DO strlen( word ) TIMES.
      APPEND substring( val = word off = sy-index - 1 len = 1 ) TO chars.
    ENDDO.
    SORT chars.
    DATA(sorted_key) = concat_lines_of( table = chars ).

    READ TABLE buckets WITH TABLE KEY sorted_key = sorted_key ASSIGNING FIELD-SYMBOL(<bucket>).
    IF sy-subrc <> 0.
      INSERT VALUE #( sorted_key = sorted_key ) INTO TABLE buckets ASSIGNING <bucket>.
    ENDIF.
    APPEND word TO <bucket>-words.
  ENDLOOP.

  LOOP AT buckets ASSIGNING <bucket>.
    APPEND <bucket>-words TO result.
  ENDLOOP.
ENDMETHOD.`,
    targetBigO: "O(n · k log k)",
  },
  {
    slug: "abap-lookup-join-hashed",
    track: "ABAP",
    level: "MEDIUM",
    title: "Join in-memory: orders + customers",
    topic: "Hashed table",
    tags: ["hashed table", "join", "READ TABLE", "performance"],
    description: `Cho bảng \`orders\` (order_id, customer_id, amount) và \`customers\` (customer_id, name). Trả về bảng các order kèm \`customer_name\`. Nếu không tìm thấy khách hàng, điền \`'UNKNOWN'\`.

Cách tệ: với mỗi order, \`LOOP AT customers WHERE ...\` hoặc \`READ TABLE\` trên *standard table* → **O(n·m)**.

Cách tốt: nạp \`customers\` vào **hashed table** theo \`customer_id\` một lần (O(m)) rồi tra từng order trong O(1) → tổng **O(n + m)**. Đây là mẫu cực kỳ phổ biến thay cho \`FOR ALL ENTRIES\` / nested loop trong code SAP thực tế.`,
    milestones: [
      { id: "m1", title: "Kết quả đúng", detail: "Mỗi order có đúng customer_name, giữ thứ tự order." },
      { id: "m2", title: "Fallback 'UNKNOWN'", detail: "Order của khách không tồn tại → UNKNOWN, không dump." },
      { id: "m3", title: "Dùng HASHED TABLE cho customers", detail: "Key = customer_id." },
      { id: "m4", title: "Không LOOP lồng / không READ tuyến tính", detail: "Tra cứu bằng WITH TABLE KEY trên hashed table." },
      { id: "m5", title: "An toàn với customer trùng", detail: "Dữ liệu customers có thể trùng id: không được dump (dùng INSERT ... INTO TABLE, không gán trực tiếp)." },
    ],
    starterCode: `REPORT zpractice_join.

CLASS lcl_solution DEFINITION.
  PUBLIC SECTION.
    TYPES: BEGIN OF ty_order,
             order_id    TYPE i,
             customer_id TYPE i,
             amount      TYPE i,
           END OF ty_order,
           tt_order TYPE STANDARD TABLE OF ty_order WITH EMPTY KEY,
           BEGIN OF ty_customer,
             customer_id TYPE i,
             name        TYPE string,
           END OF ty_customer,
           tt_customer TYPE STANDARD TABLE OF ty_customer WITH EMPTY KEY,
           BEGIN OF ty_enriched,
             order_id      TYPE i,
             customer_id   TYPE i,
             amount        TYPE i,
             customer_name TYPE string,
           END OF ty_enriched,
           tt_enriched TYPE STANDARD TABLE OF ty_enriched WITH EMPTY KEY.
    CLASS-METHODS enrich
      IMPORTING orders        TYPE tt_order
                customers     TYPE tt_customer
      RETURNING VALUE(result) TYPE tt_enriched.
ENDCLASS.

CLASS lcl_solution IMPLEMENTATION.
  METHOD enrich.
    " TODO
  ENDMETHOD.
ENDCLASS.
`,
    hints: [
      "DATA by_id TYPE HASHED TABLE OF ty_customer WITH UNIQUE KEY customer_id.",
      "INSERT LINES OF customers INTO TABLE by_id. bỏ qua dòng trùng key thay vì dump.",
      "READ TABLE by_id WITH TABLE KEY customer_id = ... ASSIGNING FIELD-SYMBOL(<c>). rồi kiểm tra sy-subrc.",
    ],
    solution: `METHOD enrich.
  DATA by_id TYPE HASHED TABLE OF ty_customer WITH UNIQUE KEY customer_id.
  INSERT LINES OF customers INTO TABLE by_id.

  LOOP AT orders INTO DATA(ord).
    DATA(row) = VALUE ty_enriched( order_id    = ord-order_id
                                   customer_id = ord-customer_id
                                   amount      = ord-amount ).
    READ TABLE by_id WITH TABLE KEY customer_id = ord-customer_id ASSIGNING FIELD-SYMBOL(<c>).
    IF sy-subrc = 0.
      row-customer_name = <c>-name.
    ELSE.
      row-customer_name = 'UNKNOWN'.
    ENDIF.
    APPEND row TO result.
  ENDLOOP.
ENDMETHOD.`,
    targetBigO: "O(n + m)",
  },
];
