import type { SeedExercise } from "./types";

export const abapB: SeedExercise[] = [
  {
    slug: "abap-binary-search",
    track: "ABAP",
    level: "MEDIUM",
    title: "Binary search thủ công",
    topic: "Searching",
    tags: ["binary search", "WHILE", "DIV", "sorted"],
    description: `Cho bảng số nguyên **đã sắp xếp tăng dần** \`nums\` và \`target\`. Trả về chỉ số (1-based) của \`target\`, hoặc \`-1\` nếu không có.

- \`[1,3,5,7,9], 7\` → 4
- \`[1,3,5,7,9], 4\` → -1
- bảng rỗng → -1

Tự cài đặt thuật toán nhị phân (không dùng \`READ TABLE ... BINARY SEARCH\`) để hiểu cơ chế mà ABAP dùng bên dưới. Cẩn thận **tràn số** khi tính \`mid\`: dùng \`low + ( high - low ) DIV 2\`.`,
    milestones: [
      { id: "m1", title: "Đúng với các ví dụ", detail: "4, -1, -1." },
      { id: "m2", title: "Vòng lặp low/high đúng điều kiện biên", detail: "WHILE low <= high; cập nhật mid ± 1 để không lặp vô hạn." },
      { id: "m3", title: "Tính mid an toàn", detail: "low + ( high - low ) DIV 2." },
      { id: "m4", title: "Độ phức tạp O(log n)", detail: "Mỗi vòng loại bỏ một nửa không gian tìm kiếm." },
    ],
    starterCode: `REPORT zpractice_binary_search.

CLASS lcl_solution DEFINITION.
  PUBLIC SECTION.
    CLASS-METHODS search
      IMPORTING nums          TYPE int4_table
                target        TYPE i
      RETURNING VALUE(result) TYPE i.
ENDCLASS.

CLASS lcl_solution IMPLEMENTATION.
  METHOD search.
    " TODO
  ENDMETHOD.
ENDCLASS.
`,
    hints: [
      "Khởi tạo low = 1, high = lines( nums ).",
      "Nếu nums[ mid ] < target → low = mid + 1; nếu lớn hơn → high = mid - 1.",
    ],
    solution: `METHOD search.
  DATA(low)  = 1.
  DATA(high) = lines( nums ).
  WHILE low <= high.
    DATA(mid) = low + ( high - low ) DIV 2.
    DATA(val) = nums[ mid ].
    IF val = target.
      result = mid.
      RETURN.
    ELSEIF val < target.
      low = mid + 1.
    ELSE.
      high = mid - 1.
    ENDIF.
  ENDWHILE.
  result = -1.
ENDMETHOD.`,
    targetBigO: "O(log n)",
  },
  {
    slug: "abap-n-plus-one-select",
    track: "ABAP",
    level: "MEDIUM",
    title: "Tối ưu SELECT trong LOOP (N+1)",
    topic: "Open SQL performance",
    tags: ["SELECT", "JOIN", "hashed table", "performance"],
    description: `Đoạn code mẫu dưới đây đọc các chuyến bay trong \`SPFLI\` rồi **SELECT SINGLE** tên hãng bay từ \`SCARR\` cho **từng dòng** (lỗi N+1: N truy vấn DB).

Hãy refactor để chỉ cần **1–2 lần truy cập DB** nhưng cho **cùng kết quả**:

- Cách A: một câu \`SELECT ... INNER JOIN\`.
- Cách B: đọc \`SCARR\` một lần vào **hashed table** rồi tra trong bộ nhớ.

Gợi ý thêm: chỉ chọn các cột cần dùng, không \`SELECT *\`.`,
    milestones: [
      { id: "m1", title: "Không còn SELECT trong vòng lặp", detail: "Không có SELECT/SELECT SINGLE nằm trong LOOP/DO/WHILE." },
      { id: "m2", title: "Kết quả không đổi", detail: "Mỗi dòng spfli vẫn có carrid, connid, carrname." },
      { id: "m3", title: "Tối đa 2 truy cập DB", detail: "Một JOIN, hoặc 2 SELECT độc lập." },
      { id: "m4", title: "Tra cứu in-memory bằng hashed table (nếu không JOIN)", detail: "READ TABLE ... WITH TABLE KEY trên hashed table." },
      { id: "m5", title: "Chỉ chọn cột cần thiết", detail: "Không dùng SELECT *." },
    ],
    starterCode: `REPORT zpractice_n_plus_one.

TYPES: BEGIN OF ty_out,
         carrid   TYPE s_carr_id,
         connid   TYPE s_conn_id,
         carrname TYPE s_carrname,
       END OF ty_out.
DATA out TYPE STANDARD TABLE OF ty_out WITH EMPTY KEY.

START-OF-SELECTION.
  SELECT carrid, connid FROM spfli INTO TABLE @DATA(conns).

  " BAD: N+1 database access – refactor this
  LOOP AT conns INTO DATA(conn).
    SELECT SINGLE carrname FROM scarr
      WHERE carrid = @conn-carrid
      INTO @DATA(name).
    APPEND VALUE #( carrid = conn-carrid connid = conn-connid carrname = name ) TO out.
  ENDLOOP.
`,
    hints: [
      "INNER JOIN scarr AS c ON c~carrid = p~carrid cho phép lấy cả hai bảng trong một câu.",
      "Hoặc SELECT carrid, carrname FROM scarr INTO TABLE @DATA(carriers) — chú ý khai báo hashed table với WITH UNIQUE KEY carrid.",
    ],
    solution: `START-OF-SELECTION.
  SELECT p~carrid, p~connid, c~carrname
    FROM spfli AS p
    INNER JOIN scarr AS c ON c~carrid = p~carrid
    INTO CORRESPONDING FIELDS OF TABLE @out.`,
    targetBigO: "1 DB roundtrip",
  },
  {
    slug: "abap-stack-exception-class",
    track: "ABAP",
    level: "MEDIUM",
    title: "Stack class với exception riêng",
    topic: "OO ABAP",
    tags: ["class", "exception", "TRY/CATCH", "RAISE EXCEPTION"],
    description: `Viết class cục bộ \`lcl_stack\` (stack số nguyên) và exception \`lcx_empty_stack\` kế thừa \`cx_static_check\`.

Yêu cầu:

- \`push( item )\`
- \`pop( )\` → trả giá trị đỉnh và loại nó; nếu rỗng **raise** \`lcx_empty_stack\`
- \`peek( )\` → xem đỉnh, rỗng cũng raise
- \`size( )\`
- dữ liệu nằm trong thuộc tính **PRIVATE**

Trong \`START-OF-SELECTION\` hãy demo: push 1,2,3, pop hết, rồi pop lần nữa trong \`TRY ... CATCH\` và in thông báo lỗi.`,
    milestones: [
      { id: "m1", title: "Exception class kế thừa cx_static_check", detail: "CLASS lcx_empty_stack DEFINITION INHERITING FROM cx_static_check." },
      { id: "m2", title: "Đóng gói dữ liệu (PRIVATE SECTION)", detail: "Bảng items là private, truy cập qua method." },
      { id: "m3", title: "pop/peek khai báo RAISING và raise đúng khi rỗng", detail: "RAISE EXCEPTION TYPE lcx_empty_stack." },
      { id: "m4", title: "LIFO đúng", detail: "pop trả phần tử push gần nhất." },
      { id: "m5", title: "Demo dùng TRY/CATCH", detail: "Bắt lcx_empty_stack ở START-OF-SELECTION." },
    ],
    starterCode: `REPORT zpractice_stack.

" TODO: exception class

CLASS lcl_stack DEFINITION.
  PUBLIC SECTION.
    " TODO: push / pop / peek / size
ENDCLASS.

CLASS lcl_stack IMPLEMENTATION.
ENDCLASS.

START-OF-SELECTION.
  " TODO: demo
`,
    hints: [
      "pop: METHODS pop RETURNING VALUE(result) TYPE i RAISING lcx_empty_stack.",
      "Đỉnh stack là phần tử cuối: items[ lines( items ) ]; bỏ nó bằng DELETE items INDEX lines( items ).",
    ],
    solution: `CLASS lcx_empty_stack DEFINITION INHERITING FROM cx_static_check.
ENDCLASS.

CLASS lcl_stack DEFINITION.
  PUBLIC SECTION.
    METHODS push IMPORTING item TYPE i.
    METHODS pop  RETURNING VALUE(result) TYPE i RAISING lcx_empty_stack.
    METHODS peek RETURNING VALUE(result) TYPE i RAISING lcx_empty_stack.
    METHODS size RETURNING VALUE(result) TYPE i.
  PRIVATE SECTION.
    DATA items TYPE STANDARD TABLE OF i WITH EMPTY KEY.
ENDCLASS.

CLASS lcl_stack IMPLEMENTATION.
  METHOD push.
    APPEND item TO items.
  ENDMETHOD.

  METHOD pop.
    DATA(n) = lines( items ).
    IF n = 0.
      RAISE EXCEPTION TYPE lcx_empty_stack.
    ENDIF.
    result = items[ n ].
    DELETE items INDEX n.
  ENDMETHOD.

  METHOD peek.
    DATA(n) = lines( items ).
    IF n = 0.
      RAISE EXCEPTION TYPE lcx_empty_stack.
    ENDIF.
    result = items[ n ].
  ENDMETHOD.

  METHOD size.
    result = lines( items ).
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(stack) = NEW lcl_stack( ).
  stack->push( 1 ).
  stack->push( 2 ).
  stack->push( 3 ).
  TRY.
      DO 4 TIMES.
        WRITE / stack->pop( ).
      ENDDO.
    CATCH lcx_empty_stack.
      WRITE / 'Stack is empty'.
  ENDTRY.`,
    targetBigO: "O(1) / thao tác",
  },
  {
    slug: "abap-top-k-frequent",
    track: "ABAP",
    level: "HARD",
    title: "Top K phần tử xuất hiện nhiều nhất",
    topic: "Hashed table",
    tags: ["COLLECT", "SORT", "hashed table", "leetcode"],
    description: `Cho \`nums\` và \`k\`. Trả về \`k\` giá trị xuất hiện **nhiều nhất** (theo thứ tự giảm dần của tần suất; nếu bằng nhau thì giá trị nhỏ hơn trước).

\`[1,1,1,2,2,3], k = 2\` → \`[1, 2]\`

Phân tích mục tiêu: đếm tần suất = O(n) bằng hashed table; sắp xếp **chỉ các giá trị distinct** = O(u log u), u ≤ n. Không được sắp xếp toàn bộ \`nums\` rồi đếm tay trong vòng lặp lồng.

Xử lý biên: \`k\` lớn hơn số giá trị distinct → trả về tất cả.`,
    milestones: [
      { id: "m1", title: "Đếm tần suất bằng hashed table", detail: "COLLECT hoặc READ/MODIFY theo key." },
      { id: "m2", title: "Sắp xếp đúng tiêu chí", detail: "cnt DESCENDING, rồi num ASCENDING." },
      { id: "m3", title: "Cắt đúng k phần tử", detail: "Không dump khi k > số distinct." },
      { id: "m4", title: "Không LOOP lồng trên toàn bộ nums", detail: "Tổng O(n + u log u)." },
    ],
    starterCode: `REPORT zpractice_top_k.

CLASS lcl_solution DEFINITION.
  PUBLIC SECTION.
    CLASS-METHODS top_k
      IMPORTING nums          TYPE int4_table
                k             TYPE i
      RETURNING VALUE(result) TYPE int4_table.
ENDCLASS.

CLASS lcl_solution IMPLEMENTATION.
  METHOD top_k.
    " TODO
  ENDMETHOD.
ENDCLASS.
`,
    hints: [
      "Bảng đếm: (num, cnt) với UNIQUE KEY num. Mỗi lần gặp, COLLECT dòng (num, 1).",
      "Chép sang STANDARD TABLE rồi SORT BY cnt DESCENDING num ASCENDING.",
      "Giới hạn số vòng lặp bằng giá trị nhỏ hơn giữa k và lines( sorted ).",
    ],
    solution: `METHOD top_k.
  TYPES: BEGIN OF ty_cnt,
           num TYPE i,
           cnt TYPE i,
         END OF ty_cnt.
  DATA counts TYPE HASHED TABLE OF ty_cnt WITH UNIQUE KEY num.

  LOOP AT nums INTO DATA(n).
    DATA(entry) = VALUE ty_cnt( num = n cnt = 1 ).
    COLLECT entry INTO counts.
  ENDLOOP.

  DATA sorted TYPE STANDARD TABLE OF ty_cnt WITH EMPTY KEY.
  sorted = counts.
  SORT sorted BY cnt DESCENDING num ASCENDING.

  DATA(limit) = COND i( WHEN k < lines( sorted ) THEN k ELSE lines( sorted ) ).
  DO limit TIMES.
    APPEND sorted[ sy-index ]-num TO result.
  ENDDO.
ENDMETHOD.`,
    targetBigO: "O(n + u log u)",
  },
  {
    slug: "abap-longest-unique-substring",
    track: "ABAP",
    level: "HARD",
    title: "Chuỗi con dài nhất không lặp ký tự",
    topic: "Sliding window",
    tags: ["sliding window", "hashed table", "substring", "leetcode"],
    description: `Cho chuỗi \`s\`, trả về **độ dài** chuỗi con liên tiếp dài nhất không có ký tự lặp.

- \`'abcabcbb'\` → 3 (\`abc\`)
- \`'bbbbb'\` → 1
- \`'pwwkew'\` → 3 (\`wke\`)
- \`''\` → 0

Brute force kiểm tra mọi chuỗi con là O(n³)/O(n²). Dùng **cửa sổ trượt** + hashed table lưu *vị trí xuất hiện gần nhất* của từng ký tự để đạt **O(n)**: khi gặp ký tự đã có trong cửa sổ hiện tại, đẩy đầu cửa sổ lên sau vị trí cũ đó.`,
    milestones: [
      { id: "m1", title: "Đúng 4 ví dụ", detail: "3, 1, 3, 0." },
      { id: "m2", title: "Cửa sổ trượt (start, i)", detail: "Biến đầu cửa sổ chỉ tăng, không bao giờ lùi." },
      { id: "m3", title: "Hashed table last-seen", detail: "Key = ký tự, value = vị trí gần nhất." },
      { id: "m4", title: "Không đẩy start lùi lại", detail: "Chỉ cập nhật start khi vị trí cũ >= start (vd 'abba')." },
      { id: "m5", title: "Một lượt duyệt O(n)", detail: "Không vòng lặp lồng." },
    ],
    starterCode: `REPORT zpractice_longest_unique.

CLASS lcl_solution DEFINITION.
  PUBLIC SECTION.
    CLASS-METHODS length_of_longest
      IMPORTING s             TYPE string
      RETURNING VALUE(result) TYPE i.
ENDCLASS.

CLASS lcl_solution IMPLEMENTATION.
  METHOD length_of_longest.
    " TODO
  ENDMETHOD.
ENDCLASS.
`,
    hints: [
      "Test case quyết định: 'abba' → 2. Nếu bạn đáp án 3 thì đã lùi start.",
      "Nếu ký tự c đã thấy tại pos >= win_start thì win_start = pos + 1.",
    ],
    solution: `METHOD length_of_longest.
  TYPES: BEGIN OF ty_seen,
           ch  TYPE string,
           pos TYPE i,
         END OF ty_seen.
  DATA seen TYPE HASHED TABLE OF ty_seen WITH UNIQUE KEY ch.
  DATA(win_start) = 0.
  DATA(best) = 0.

  DO strlen( s ) TIMES.
    DATA(i) = sy-index - 1.
    DATA(c) = substring( val = s off = i len = 1 ).
    READ TABLE seen WITH TABLE KEY ch = c ASSIGNING FIELD-SYMBOL(<e>).
    IF sy-subrc = 0.
      IF <e>-pos >= win_start.
        win_start = <e>-pos + 1.
      ENDIF.
      <e>-pos = i.
    ELSE.
      INSERT VALUE #( ch = c pos = i ) INTO TABLE seen.
    ENDIF.
    IF i - win_start + 1 > best.
      best = i - win_start + 1.
    ENDIF.
  ENDDO.
  result = best.
ENDMETHOD.`,
    targetBigO: "O(n)",
  },
  {
    slug: "abap-secondary-keys",
    track: "ABAP",
    level: "HARD",
    title: "Secondary key: tra cứu nhiều chiều",
    topic: "Table keys",
    tags: ["secondary key", "sorted key", "hashed key", "USING KEY"],
    description: `Bảng nhân viên cần được tra theo **2 cách**:

1. theo \`id\` (duy nhất) – cực nhiều lần
2. theo \`dept\` (không duy nhất), cần tổng lương của một phòng ban

Thay vì LOOP cả bảng mỗi lần (O(n)), hãy khai báo table type có **secondary key**:

- \`UNIQUE HASHED KEY by_id COMPONENTS id\`
- \`NON-UNIQUE SORTED KEY by_dept COMPONENTS dept\`

và viết:

- \`name_of( id )\` → tên nhân viên (hoặc rỗng nếu không có) dùng key \`by_id\`
- \`salary_of_dept( dept )\` → tổng lương dùng \`LOOP AT ... USING KEY by_dept WHERE dept = ...\`

Mục tiêu: \`name_of\` O(1), \`salary_of_dept\` O(log n + k) với k là số nhân viên của phòng ban.`,
    milestones: [
      { id: "m1", title: "Table type có 2 secondary key đúng loại", detail: "Hashed unique by_id; sorted non-unique by_dept." },
      { id: "m2", title: "name_of dùng key by_id", detail: "READ TABLE ... WITH TABLE KEY by_id COMPONENTS id = ..." },
      { id: "m3", title: "salary_of_dept dùng USING KEY by_dept", detail: "LOOP ... USING KEY by_dept WHERE dept = ... (không full scan)." },
      { id: "m4", title: "Xử lý không tồn tại", detail: "id không có → chuỗi rỗng; phòng ban không có → 0." },
    ],
    starterCode: `REPORT zpractice_secondary_key.

CLASS lcl_directory DEFINITION.
  PUBLIC SECTION.
    TYPES: BEGIN OF ty_emp,
             id     TYPE i,
             name   TYPE string,
             dept   TYPE string,
             salary TYPE i,
           END OF ty_emp.
    " TODO: add secondary keys here
    TYPES tt_emp TYPE STANDARD TABLE OF ty_emp WITH EMPTY KEY.

    DATA emps TYPE tt_emp.

    METHODS name_of
      IMPORTING id            TYPE i
      RETURNING VALUE(result) TYPE string.
    METHODS salary_of_dept
      IMPORTING dept          TYPE string
      RETURNING VALUE(result) TYPE i.
ENDCLASS.

CLASS lcl_directory IMPLEMENTATION.
  METHOD name_of.
    " TODO
  ENDMETHOD.
  METHOD salary_of_dept.
    " TODO
  ENDMETHOD.
ENDCLASS.
`,
    hints: [
      "Cú pháp: TYPES tt TYPE STANDARD TABLE OF ty WITH EMPTY KEY WITH UNIQUE HASHED KEY by_id COMPONENTS id WITH NON-UNIQUE SORTED KEY by_dept COMPONENTS dept.",
      "Với table expression: emps[ KEY by_id COMPONENTS id = id ]-name, bọc trong VALUE #( ... OPTIONAL ) để tránh dump.",
    ],
    solution: `TYPES tt_emp TYPE STANDARD TABLE OF ty_emp WITH EMPTY KEY
  WITH UNIQUE HASHED KEY by_id COMPONENTS id
  WITH NON-UNIQUE SORTED KEY by_dept COMPONENTS dept.

METHOD name_of.
  READ TABLE emps WITH TABLE KEY by_id COMPONENTS id = id ASSIGNING FIELD-SYMBOL(<e>).
  IF sy-subrc = 0.
    result = <e>-name.
  ENDIF.
ENDMETHOD.

METHOD salary_of_dept.
  LOOP AT emps ASSIGNING FIELD-SYMBOL(<e>) USING KEY by_dept WHERE dept = dept.
    result = result + <e>-salary.
  ENDLOOP.
ENDMETHOD.`,
    targetBigO: "O(1) by id · O(log n + k) by dept",
  },
  {
    slug: "abap-lru-cache",
    track: "ABAP",
    level: "EXPERT",
    title: "LRU Cache O(1)",
    topic: "OO ABAP · data structures",
    tags: ["LRU", "linked list", "REF TO", "hashed table", "leetcode"],
    description: `Cài đặt \`lcl_lru_cache\` với dung lượng cố định \`capacity\`:

- \`get( k )\` → trả giá trị, hoặc \`-1\` nếu không có. Truy cập đánh dấu phần tử là *mới dùng gần nhất*.
- \`put( k, v )\` → thêm/cập nhật. Khi đầy, **loại phần tử ít dùng gần đây nhất (LRU)**.

**Cả hai thao tác phải O(1)**. Cách chuẩn: *hashed table* (key → tham chiếu node) kết hợp *danh sách liên kết đôi* tự xây bằng object (\`REF TO lcl_node\`) có hai node canh \`head\` / \`tail\`.

Ví dụ capacity = 2: put(1,1), put(2,2), get(1)=1, put(3,3) (loại key 2), get(2)=-1, put(4,4) (loại key 1), get(1)=-1, get(3)=3, get(4)=4.`,
    milestones: [
      { id: "m1", title: "Đúng trace ví dụ", detail: "Kết quả get theo đúng chuỗi trong đề." },
      { id: "m2", title: "Node doubly-linked (prev/next)", detail: "Class lcl_node với REF TO prev/next, có sentinel head & tail." },
      { id: "m3", title: "Hashed table key → REF TO node", detail: "Tra cứu O(1), không LOOP để tìm." },
      { id: "m4", title: "get/put đều O(1)", detail: "Di chuyển node lên đầu bằng detach + push_front, evict từ tail->prev." },
      { id: "m5", title: "Evict đúng & dọn hashed table", detail: "Khi đầy: xoá node cuối khỏi list VÀ khỏi hashed table." },
      { id: "m6", title: "put key đã tồn tại chỉ cập nhật", detail: "Không tăng kích thước, không evict." },
    ],
    starterCode: `REPORT zpractice_lru.

CLASS lcl_node DEFINITION.
  PUBLIC SECTION.
    DATA k    TYPE i.
    DATA val  TYPE i.
    DATA prev TYPE REF TO lcl_node.
    DATA next TYPE REF TO lcl_node.
ENDCLASS.
CLASS lcl_node IMPLEMENTATION.
ENDCLASS.

CLASS lcl_lru_cache DEFINITION.
  PUBLIC SECTION.
    METHODS constructor IMPORTING capacity TYPE i.
    METHODS get IMPORTING k TYPE i RETURNING VALUE(result) TYPE i.
    METHODS put IMPORTING k TYPE i v TYPE i.
  PRIVATE SECTION.
    TYPES: BEGIN OF ty_entry,
             k    TYPE i,
             node TYPE REF TO lcl_node,
           END OF ty_entry.
    DATA map  TYPE HASHED TABLE OF ty_entry WITH UNIQUE KEY k.
    DATA head TYPE REF TO lcl_node.
    DATA tail TYPE REF TO lcl_node.
    DATA cap  TYPE i.
    " TODO: helper methods detach( ) and push_front( )
ENDCLASS.

CLASS lcl_lru_cache IMPLEMENTATION.
  METHOD constructor.
    " TODO
  ENDMETHOD.
  METHOD get.
    " TODO
  ENDMETHOD.
  METHOD put.
    " TODO
  ENDMETHOD.
ENDCLASS.

START-OF-SELECTION.
  DATA(cache) = NEW lcl_lru_cache( 2 ).
  cache->put( k = 1 v = 1 ).
  cache->put( k = 2 v = 2 ).
  WRITE / cache->get( 1 ).
  cache->put( k = 3 v = 3 ).
  WRITE / cache->get( 2 ).
`,
    hints: [
      "Dùng 2 node canh: head (đầu giả) và tail (đuôi giả). Node dùng gần nhất nằm ngay sau head; LRU nằm ngay trước tail.",
      "detach( node ): node->prev->next = node->next. node->next->prev = node->prev.",
      "Khi evict nhớ DELETE TABLE map WITH TABLE KEY k = lru->k.",
    ],
    solution: `CLASS lcl_lru_cache DEFINITION.
  PUBLIC SECTION.
    METHODS constructor IMPORTING capacity TYPE i.
    METHODS get IMPORTING k TYPE i RETURNING VALUE(result) TYPE i.
    METHODS put IMPORTING k TYPE i v TYPE i.
  PRIVATE SECTION.
    TYPES: BEGIN OF ty_entry,
             k    TYPE i,
             node TYPE REF TO lcl_node,
           END OF ty_entry.
    DATA map  TYPE HASHED TABLE OF ty_entry WITH UNIQUE KEY k.
    DATA head TYPE REF TO lcl_node.
    DATA tail TYPE REF TO lcl_node.
    DATA cap  TYPE i.
    METHODS detach IMPORTING node TYPE REF TO lcl_node.
    METHODS push_front IMPORTING node TYPE REF TO lcl_node.
ENDCLASS.

CLASS lcl_lru_cache IMPLEMENTATION.
  METHOD constructor.
    cap  = capacity.
    head = NEW #( ).
    tail = NEW #( ).
    head->next = tail.
    tail->prev = head.
  ENDMETHOD.

  METHOD detach.
    node->prev->next = node->next.
    node->next->prev = node->prev.
  ENDMETHOD.

  METHOD push_front.
    node->next = head->next.
    node->prev = head.
    head->next->prev = node.
    head->next = node.
  ENDMETHOD.

  METHOD get.
    READ TABLE map WITH TABLE KEY k = k ASSIGNING FIELD-SYMBOL(<e>).
    IF sy-subrc <> 0.
      result = -1.
      RETURN.
    ENDIF.
    detach( <e>-node ).
    push_front( <e>-node ).
    result = <e>-node->val.
  ENDMETHOD.

  METHOD put.
    READ TABLE map WITH TABLE KEY k = k ASSIGNING FIELD-SYMBOL(<e>).
    IF sy-subrc = 0.
      <e>-node->val = v.
      detach( <e>-node ).
      push_front( <e>-node ).
      RETURN.
    ENDIF.

    IF lines( map ) >= cap.
      DATA(lru) = tail->prev.
      detach( lru ).
      DELETE TABLE map WITH TABLE KEY k = lru->k.
    ENDIF.

    DATA(node) = NEW lcl_node( ).
    node->k   = k.
    node->val = v.
    push_front( node ).
    INSERT VALUE #( k = k node = node ) INTO TABLE map.
  ENDMETHOD.
ENDCLASS.`,
    targetBigO: "O(1) get & put",
  },
];
