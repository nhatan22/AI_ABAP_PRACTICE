import type { SeedExercise } from "./types";

export const ui5: SeedExercise[] = [
  {
    slug: "ui5-controller-basics",
    track: "UI5",
    level: "BEGINNER",
    title: "Controller đầu tiên: nút bấm + MessageToast",
    topic: "Controller",
    tags: ["sap.ui.define", "Controller.extend", "MessageToast", "byId"],
    description: `View có một \`sap.m.Input\` (id \`nameInput\`) và một \`sap.m.Button\` có \`press="onGreet"\`.

Viết controller \`my.app.controller.Main\`:

- \`onGreet\`: lấy giá trị ô nhập (\`byId\`), **trim**.
- Nếu rỗng → \`MessageToast.show("Vui lòng nhập tên")\`.
- Ngược lại → \`MessageToast.show("Xin chào, <tên>!")\`.

Yêu cầu: dùng **sap.ui.define** với dependency rõ ràng (không dùng \`sap.m.MessageToast\` toàn cục), \`"use strict"\`.`,
    milestones: [
      { id: "m1", title: "Module hoá bằng sap.ui.define", detail: "Import Controller và MessageToast qua mảng dependency." },
      { id: "m2", title: "Controller.extend với tên đầy đủ", detail: "my.app.controller.Main." },
      { id: "m3", title: "Lấy control qua this.byId", detail: "Không dùng document.getElementById / sap.ui.getCore().byId." },
      { id: "m4", title: "Xử lý chuỗi rỗng sau trim()", detail: "Hiện thông báo yêu cầu nhập tên." },
      { id: "m5", title: "Thông báo chào đúng định dạng", detail: "Xin chào, <tên>!" },
    ],
    starterCode: `sap.ui.define([
  // TODO: dependencies
], function (/* TODO */) {
  "use strict";

  return /* TODO */ {
    onGreet: function () {
      // TODO
    }
  };
});
`,
    hints: [
      "Dependency: 'sap/ui/core/mvc/Controller' và 'sap/m/MessageToast'. Thứ tự tham số hàm phải khớp thứ tự mảng.",
      "this.byId('nameInput').getValue() lấy nội dung ô nhập.",
    ],
    solution: `sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast"
], function (Controller, MessageToast) {
  "use strict";

  return Controller.extend("my.app.controller.Main", {
    onGreet: function () {
      const sName = this.byId("nameInput").getValue().trim();
      if (!sName) {
        MessageToast.show("Vui lòng nhập tên");
        return;
      }
      MessageToast.show("Xin chào, " + sName + "!");
    }
  });
});`,
    targetBigO: "O(1)",
  },
  {
    slug: "ui5-json-model-list",
    track: "UI5",
    level: "EASY",
    title: "JSONModel: thêm / xoá sản phẩm",
    topic: "Data binding",
    tags: ["JSONModel", "setProperty", "getProperty", "binding context"],
    description: `Controller cần quản lý danh sách sản phẩm bằng \`sap.ui.model.json.JSONModel\`.

- \`onInit\`: tạo model \`{ products: [ {id:1,name:"Laptop",price:1200}, {id:2,name:"Mouse",price:25} ] }\` và gán làm **model mặc định** cho view.
- \`onAdd\`: thêm sản phẩm mới (id tự tăng = max id + 1; name & price lấy từ \`this.byId("nameInput")\`/\`priceInput\`). Không thêm khi tên rỗng hoặc giá không hợp lệ.
- \`onDelete(oEvent)\`: xoá item của nút bấm trong list bằng **binding context** (\`oEvent.getSource().getBindingContext().getPath()\`), không dùng index đoán mò.

Lưu ý: sau khi thay đổi mảng phải cập nhật model bằng \`setProperty\` (hoặc \`refresh\`), đừng sửa trực tiếp \`getData()\` mà quên thông báo.`,
    milestones: [
      { id: "m1", title: "Tạo JSONModel + setModel trong onInit", detail: "this.getView().setModel(oModel)." },
      { id: "m2", title: "onAdd cập nhật model bằng setProperty", detail: "Lấy mảng, push/clone, setProperty('/products', ...)." },
      { id: "m3", title: "Validate đầu vào", detail: "Tên rỗng / giá NaN hoặc âm thì không thêm." },
      { id: "m4", title: "ID tự tăng = max + 1", detail: "Không dùng length + 1 (sai sau khi xoá)." },
      { id: "m5", title: "onDelete dựa vào binding context path", detail: "Parse index từ path hoặc dùng filter theo id." },
    ],
    starterCode: `sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
  "use strict";

  return Controller.extend("my.app.controller.Products", {
    onInit: function () {
      // TODO
    },

    onAdd: function () {
      // TODO
    },

    onDelete: function (oEvent) {
      // TODO
    }
  });
});
`,
    hints: [
      "const aProducts = oModel.getProperty('/products'); tạo mảng mới rồi oModel.setProperty('/products', aNew).",
      "Math.max(0, ...aProducts.map(p => p.id)) + 1 cho id mới.",
      "oContext.getPath() trả '/products/3' → parseInt(sPath.split('/').pop(), 10).",
    ],
    solution: `sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
  "use strict";

  return Controller.extend("my.app.controller.Products", {
    onInit: function () {
      const oModel = new JSONModel({
        products: [
          { id: 1, name: "Laptop", price: 1200 },
          { id: 2, name: "Mouse", price: 25 }
        ]
      });
      this.getView().setModel(oModel);
    },

    onAdd: function () {
      const sName = this.byId("nameInput").getValue().trim();
      const fPrice = parseFloat(this.byId("priceInput").getValue());
      if (!sName || Number.isNaN(fPrice) || fPrice < 0) {
        return;
      }
      const oModel = this.getView().getModel();
      const aProducts = oModel.getProperty("/products");
      const iNextId = Math.max(0, ...aProducts.map((p) => p.id)) + 1;
      oModel.setProperty("/products", [...aProducts, { id: iNextId, name: sName, price: fPrice }]);
    },

    onDelete: function (oEvent) {
      const sPath = oEvent.getSource().getBindingContext().getPath();
      const iIndex = parseInt(sPath.split("/").pop(), 10);
      const oModel = this.getView().getModel();
      const aProducts = oModel.getProperty("/products").slice();
      aProducts.splice(iIndex, 1);
      oModel.setProperty("/products", aProducts);
    }
  });
});`,
    targetBigO: "O(n)",
  },
  {
    slug: "ui5-formatter-module",
    track: "UI5",
    level: "EASY",
    title: "Formatter: trạng thái, giá, ngày",
    topic: "Formatter",
    tags: ["formatter", "ValueState", "Intl", "module"],
    description: `Tạo module \`my.app.model.formatter\` dùng trong binding XML (\`formatter: '.formatter.statusState'\`).

- \`statusState(sStatus)\` → \`ValueState\`: \`"A"\` (approved) → \`Success\`, \`"P"\` (pending) → \`Warning\`, \`"R"\` (rejected) → \`Error\`, còn lại → \`None\`.
- \`statusText(sStatus)\` → \`"Approved" | "Pending" | "Rejected" | "Unknown"\`.
- \`price(fValue, sCurrency)\` → chuỗi tiền tệ bằng \`Intl.NumberFormat("en-US", { style: "currency", currency })\`. Giá trị \`null/undefined/NaN\` → \`""\`.

Yêu cầu hiệu năng/chất lượng: tra bảng ánh xạ bằng **object lookup** (hash map) thay vì chuỗi \`if/else\` dài; formatter phải là **hàm thuần** (không đọc \`this\` ngoài cần thiết).`,
    milestones: [
      { id: "m1", title: "Module sap.ui.define trả về object", detail: "Import sap/ui/core/library để lấy ValueState." },
      { id: "m2", title: "statusState / statusText dùng bảng ánh xạ", detail: "Object lookup, không if/else chain dài." },
      { id: "m3", title: "Giá trị mặc định hợp lý", detail: "Status lạ → ValueState.None / 'Unknown'." },
      { id: "m4", title: "price xử lý null/NaN", detail: "Trả về chuỗi rỗng." },
      { id: "m5", title: "Khởi tạo NumberFormat ngoài hot path", detail: "Cache Intl.NumberFormat theo currency (tránh tạo mới mỗi dòng)." },
    ],
    starterCode: `sap.ui.define([
  // TODO
], function (/* TODO */) {
  "use strict";

  return {
    statusState: function (sStatus) {
      // TODO
    },
    statusText: function (sStatus) {
      // TODO
    },
    price: function (fValue, sCurrency) {
      // TODO
    }
  };
});
`,
    hints: [
      "sap/ui/core/library cung cấp ValueState: library.ValueState.Success.",
      "const mState = { A: ValueState.Success, ... }; return mState[sStatus] || ValueState.None;",
      "Cache: const mFormats = {}; mFormats[cur] = mFormats[cur] || new Intl.NumberFormat(...).",
    ],
    solution: `sap.ui.define([
  "sap/ui/core/library"
], function (coreLibrary) {
  "use strict";

  const ValueState = coreLibrary.ValueState;

  const mState = {
    A: ValueState.Success,
    P: ValueState.Warning,
    R: ValueState.Error
  };
  const mText = { A: "Approved", P: "Pending", R: "Rejected" };
  const mFormats = {};

  return {
    statusState: function (sStatus) {
      return mState[sStatus] || ValueState.None;
    },
    statusText: function (sStatus) {
      return mText[sStatus] || "Unknown";
    },
    price: function (fValue, sCurrency) {
      if (fValue === null || fValue === undefined || Number.isNaN(Number(fValue))) {
        return "";
      }
      const sCur = sCurrency || "USD";
      mFormats[sCur] = mFormats[sCur] || new Intl.NumberFormat("en-US", { style: "currency", currency: sCur });
      return mFormats[sCur].format(Number(fValue));
    }
  };
});`,
    targetBigO: "O(1)",
  },
  {
    slug: "ui5-search-filter",
    track: "UI5",
    level: "MEDIUM",
    title: "SearchField + Filter đa cột",
    topic: "Filter & Sorter",
    tags: ["Filter", "FilterOperator", "ListBinding", "SearchField"],
    description: `View có \`sap.m.SearchField\` (\`liveChange="onSearch"\`) và \`sap.m.List id="productList"\` bind \`items="{/products}"\`.

Viết \`onSearch(oEvent)\`:

- Lấy chuỗi tìm kiếm từ \`oEvent.getParameter("newValue")\`.
- Nếu có chuỗi: tạo **một** bộ lọc OR trên \`name\` **hoặc** \`category\` với \`FilterOperator.Contains\`, \`caseSensitive: false\`.
- Nếu rỗng: **xoá filter** (truyền mảng rỗng).
- Áp dụng bằng \`this.byId("productList").getBinding("items").filter(...)\`.

Lưu ý: bộ lọc cho nhiều cột phải gộp bằng \`and: false\` trong một \`Filter\` cha, không truyền 2 filter rời (khi đó là AND).`,
    milestones: [
      { id: "m1", title: "Import Filter & FilterOperator", detail: "sap/ui/model/Filter, sap/ui/model/FilterOperator." },
      { id: "m2", title: "Filter cha OR nhiều cột", detail: "new Filter({ filters: [...], and: false })." },
      { id: "m3", title: "Contains + không phân biệt hoa thường", detail: "caseSensitive: false (hoặc toLowerCase)." },
      { id: "m4", title: "Query rỗng xoá filter", detail: "binding.filter([])." },
      { id: "m5", title: "Dùng ListBinding, không lặp tay qua item", detail: "Không duyệt getItems() ẩn/hiện thủ công." },
    ],
    starterCode: `sap.ui.define([
  "sap/ui/core/mvc/Controller"
  // TODO: Filter, FilterOperator
], function (Controller) {
  "use strict";

  return Controller.extend("my.app.controller.Search", {
    onSearch: function (oEvent) {
      // TODO
    }
  });
});
`,
    hints: [
      "new Filter({ path: 'name', operator: FilterOperator.Contains, value1: sQuery, caseSensitive: false })",
      "Gộp OR: new Filter({ filters: [f1, f2], and: false })",
    ],
    solution: `sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator"
], function (Controller, Filter, FilterOperator) {
  "use strict";

  return Controller.extend("my.app.controller.Search", {
    onSearch: function (oEvent) {
      const sQuery = (oEvent.getParameter("newValue") || "").trim();
      const aFilters = [];
      if (sQuery) {
        aFilters.push(new Filter({
          filters: [
            new Filter({ path: "name", operator: FilterOperator.Contains, value1: sQuery, caseSensitive: false }),
            new Filter({ path: "category", operator: FilterOperator.Contains, value1: sQuery, caseSensitive: false })
          ],
          and: false
        }));
      }
      this.byId("productList").getBinding("items").filter(aFilters);
    }
  });
});`,
    targetBigO: "O(n)",
  },
  {
    slug: "ui5-odata-v2-promise",
    track: "UI5",
    level: "MEDIUM",
    title: "OData V2: bọc read() bằng Promise",
    topic: "OData",
    tags: ["ODataModel V2", "Promise", "async/await", "busy state"],
    description: `\`sap.ui.model.odata.v2.ODataModel\` dùng callback \`success/error\`. Hãy bọc nó để dùng \`async/await\`.

Trong controller:

1. \`_read(sPath, aFilters)\` → trả \`Promise\` resolve \`oData\` (đối tượng \`results\`) hoặc reject với \`oError\`.
2. \`onLoadOrders\` (async):
   - bật view model \`/busy = true\` **trước** khi gọi
   - gọi \`_read("/Orders", [new Filter("Status", FilterOperator.EQ, "OPEN")])\`
   - ghi \`results\` vào view model \`/orders\`
   - bắt lỗi → \`MessageBox.error(...)\`
   - **luôn** tắt busy trong \`finally\`.`,
    milestones: [
      { id: "m1", title: "_read trả về Promise", detail: "new Promise((resolve, reject) => oModel.read(..., { success, error }))." },
      { id: "m2", title: "Truyền filters đúng vào read()", detail: "Tham số filters: aFilters." },
      { id: "m3", title: "async/await + try/catch/finally", detail: "Busy luôn được tắt dù lỗi." },
      { id: "m4", title: "Lưu kết quả vào view model", detail: "setProperty('/orders', oData.results)." },
      { id: "m5", title: "Thông báo lỗi bằng MessageBox", detail: "Không console.log trống." },
    ],
    starterCode: `sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/m/MessageBox"
], function (Controller, JSONModel, Filter, FilterOperator, MessageBox) {
  "use strict";

  return Controller.extend("my.app.controller.Orders", {
    onInit: function () {
      this.getView().setModel(new JSONModel({ busy: false, orders: [] }), "view");
    },

    _read: function (sPath, aFilters) {
      // TODO: return a Promise
    },

    onLoadOrders: async function () {
      // TODO
    }
  });
});
`,
    hints: [
      "const oData = this.getOwnerComponent().getModel(); — model mặc định của app.",
      "try { ... } catch (e) { ... } finally { oViewModel.setProperty('/busy', false); }",
    ],
    solution: `sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/m/MessageBox"
], function (Controller, JSONModel, Filter, FilterOperator, MessageBox) {
  "use strict";

  return Controller.extend("my.app.controller.Orders", {
    onInit: function () {
      this.getView().setModel(new JSONModel({ busy: false, orders: [] }), "view");
    },

    _read: function (sPath, aFilters) {
      const oModel = this.getOwnerComponent().getModel();
      return new Promise(function (resolve, reject) {
        oModel.read(sPath, {
          filters: aFilters || [],
          success: resolve,
          error: reject
        });
      });
    },

    onLoadOrders: async function () {
      const oViewModel = this.getView().getModel("view");
      oViewModel.setProperty("/busy", true);
      try {
        const oData = await this._read("/Orders", [new Filter("Status", FilterOperator.EQ, "OPEN")]);
        oViewModel.setProperty("/orders", oData.results);
      } catch (oError) {
        MessageBox.error("Không tải được đơn hàng: " + (oError && oError.message ? oError.message : "lỗi không xác định"));
      } finally {
        oViewModel.setProperty("/busy", false);
      }
    }
  });
});`,
    targetBigO: "O(1) request",
  },
  {
    slug: "ui5-router-detail",
    track: "UI5",
    level: "MEDIUM",
    title: "Router: master → detail và nút Back",
    topic: "Routing",
    tags: ["Router", "navTo", "attachPatternMatched", "History"],
    description: `Manifest có route \`master\` (\`""\`) và \`detail\` (\`"detail/{orderId}"\`).

**Master controller:** \`onItemPress(oEvent)\` điều hướng tới \`detail\` với tham số \`orderId\` lấy từ binding context của item (\`getBindingContext().getProperty("OrderID")\`).

**Detail controller:**

- \`onInit\`: đăng ký \`attachPatternMatched\` cho route \`detail\`.
- \`_onObjectMatched\`: lấy \`orderId\` từ \`oEvent.getParameter("arguments")\` và \`bindElement\` tới \`"/Orders(" + orderId + ")"\`.
- \`onNavBack\`: nếu có lịch sử trình duyệt → \`window.history.go(-1)\`, nếu không → \`navTo("master", {}, true)\`.
- Dọn dẹp: huỷ đăng ký ở \`onExit\`.

Dùng \`this.getOwnerComponent().getRouter()\` hoặc \`UIComponent.getRouterFor(this)\`.`,
    milestones: [
      { id: "m1", title: "Master: navTo đúng route + tham số", detail: "navTo('detail', { orderId })." },
      { id: "m2", title: "Detail: attachPatternMatched", detail: "Route 'detail' trong onInit." },
      { id: "m3", title: "bindElement đúng path", detail: "'/Orders(' + orderId + ')'." },
      { id: "m4", title: "NavBack có History + fallback", detail: "Kiểm tra History.getInstance().getPreviousHash()." },
      { id: "m5", title: "Detach trong onExit", detail: "detachPatternMatched cùng handler." },
    ],
    starterCode: `// ===== Master.controller.js =====
sap.ui.define([
  "sap/ui/core/mvc/Controller"
], function (Controller) {
  "use strict";

  return Controller.extend("my.app.controller.Master", {
    onItemPress: function (oEvent) {
      // TODO
    }
  });
});

// ===== Detail.controller.js =====
sap.ui.define([
  "sap/ui/core/mvc/Controller"
  // TODO: History
], function (Controller) {
  "use strict";

  return Controller.extend("my.app.controller.Detail", {
    onInit: function () {
      // TODO
    },

    _onObjectMatched: function (oEvent) {
      // TODO
    },

    onNavBack: function () {
      // TODO
    },

    onExit: function () {
      // TODO
    }
  });
});
`,
    hints: [
      "Handler phải là một tham chiếu ổn định (lưu this._fnMatched = this._onObjectMatched.bind(this)) để detach được.",
      "sap/ui/core/routing/History: History.getInstance().getPreviousHash() !== undefined.",
    ],
    solution: `// ===== Master.controller.js =====
sap.ui.define([
  "sap/ui/core/mvc/Controller"
], function (Controller) {
  "use strict";

  return Controller.extend("my.app.controller.Master", {
    onItemPress: function (oEvent) {
      const sOrderId = oEvent.getSource().getBindingContext().getProperty("OrderID");
      this.getOwnerComponent().getRouter().navTo("detail", { orderId: sOrderId });
    }
  });
});

// ===== Detail.controller.js =====
sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/routing/History"
], function (Controller, History) {
  "use strict";

  return Controller.extend("my.app.controller.Detail", {
    onInit: function () {
      this._fnMatched = this._onObjectMatched.bind(this);
      this.getOwnerComponent().getRouter().getRoute("detail").attachPatternMatched(this._fnMatched);
    },

    _onObjectMatched: function (oEvent) {
      const sOrderId = oEvent.getParameter("arguments").orderId;
      this.getView().bindElement({ path: "/Orders(" + sOrderId + ")" });
    },

    onNavBack: function () {
      const sPreviousHash = History.getInstance().getPreviousHash();
      if (sPreviousHash !== undefined) {
        window.history.go(-1);
      } else {
        this.getOwnerComponent().getRouter().navTo("master", {}, true);
      }
    },

    onExit: function () {
      this.getOwnerComponent().getRouter().getRoute("detail").detachPatternMatched(this._fnMatched);
    }
  });
});`,
    targetBigO: "O(1)",
  },
  {
    slug: "ui5-fragment-dialog-lazy",
    track: "UI5",
    level: "MEDIUM",
    title: "Dialog Fragment: lazy load & tái sử dụng",
    topic: "Fragment",
    tags: ["Fragment.load", "Dialog", "addDependent", "destroy"],
    description: `Có fragment \`my.app.view.fragment.EditDialog\` (một \`sap.m.Dialog\`). Viết controller:

- \`onOpenDialog\`: **chỉ load fragment lần đầu**, lưu Promise/instance để lần sau tái sử dụng. Gắn dialog vào view bằng \`addDependent\` để kế thừa model và vòng đời. Truyền \`id: this.getView().getId()\` và \`controller: this\`.
- \`onCloseDialog\`: đóng dialog (\`close()\`), **không** destroy.
- \`onExit\`: dọn dẹp \`destroy()\` dialog nếu đã tạo.

Lưu ý: \`Fragment.load\` trả về \`Promise\`; nếu người dùng bấm 2 lần liên tiếp, **không được tạo 2 dialog** → cache chính Promise.`,
    milestones: [
      { id: "m1", title: "Dùng sap/ui/core/Fragment.load", detail: "name: 'my.app.view.fragment.EditDialog'." },
      { id: "m2", title: "Cache để load một lần", detail: "this._pDialog ||= Fragment.load(...)." },
      { id: "m3", title: "addDependent + id/controller", detail: "Dialog dùng được model và handler của view." },
      { id: "m4", title: "Đóng không destroy", detail: "close() ở onCloseDialog." },
      { id: "m5", title: "onExit dọn dẹp", detail: "Chờ Promise rồi destroy." },
    ],
    starterCode: `sap.ui.define([
  "sap/ui/core/mvc/Controller"
  // TODO: Fragment
], function (Controller) {
  "use strict";

  return Controller.extend("my.app.controller.Edit", {
    onOpenDialog: function () {
      // TODO
    },

    onCloseDialog: function () {
      // TODO
    },

    onExit: function () {
      // TODO
    }
  });
});
`,
    hints: [
      "Lưu Promise (không lưu dialog) để tránh race condition khi bấm nhiều lần.",
      "Trong handler của dialog: this._pDialog.then(oDialog => oDialog.close()) hoặc oEvent.getSource().getParent().close().",
    ],
    solution: `sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/Fragment"
], function (Controller, Fragment) {
  "use strict";

  return Controller.extend("my.app.controller.Edit", {
    onOpenDialog: function () {
      if (!this._pDialog) {
        this._pDialog = Fragment.load({
          id: this.getView().getId(),
          name: "my.app.view.fragment.EditDialog",
          controller: this
        }).then(function (oDialog) {
          this.getView().addDependent(oDialog);
          return oDialog;
        }.bind(this));
      }
      this._pDialog.then(function (oDialog) {
        oDialog.open();
      });
    },

    onCloseDialog: function () {
      if (this._pDialog) {
        this._pDialog.then(function (oDialog) {
          oDialog.close();
        });
      }
    },

    onExit: function () {
      if (this._pDialog) {
        this._pDialog.then(function (oDialog) {
          oDialog.destroy();
        });
        this._pDialog = null;
      }
    }
  });
});`,
    targetBigO: "O(1)",
  },
  {
    slug: "ui5-map-aggregate-model",
    track: "UI5",
    level: "HARD",
    title: "Gộp 50.000 dòng bằng Map (hash map)",
    topic: "Data structures in JS",
    tags: ["Map", "reduce", "aggregation", "JSONModel", "performance"],
    description: `Backend trả về 50.000 dòng \`[{ region, product, amount }]\`. Cần hiển thị bảng **tổng doanh thu theo region** (sắp xếp giảm dần).

Viết \`buildSummary(aRows)\` (hàm thuần trong module) trả về \`[{ region, total, count }]\`, và \`onDataLoaded(aRows)\` đặt kết quả vào JSONModel.

Ràng buộc hiệu năng:

- Dùng **\`Map\`** (tương đương hashed table của ABAP) để gộp trong **một lượt O(n)**; cấm \`filter\`/\`find\`/\`indexOf\` lồng trong vòng lặp.
- Sắp xếp **sau khi** gộp (số region nhỏ).
- Chỉ gọi \`setData\`/\`setProperty\` **một lần**, và đặt \`oModel.setSizeLimit\` phù hợp nếu cần.
- Không mutate \`aRows\` gốc.`,
    milestones: [
      { id: "m1", title: "Kết quả đúng (total, count theo region)", detail: "Tổng và đếm chính xác." },
      { id: "m2", title: "Dùng Map để gộp", detail: "map.get/map.set trong một vòng for...of." },
      { id: "m3", title: "Không vòng lặp lồng / find / filter trong loop", detail: "Tổng thời gian O(n + r log r)." },
      { id: "m4", title: "Sắp xếp giảm dần theo total", detail: "Sort mảng kết quả, không sort 50k dòng." },
      { id: "m5", title: "Cập nhật model đúng một lần", detail: "Một lần setProperty/setData." },
      { id: "m6", title: "Không mutate đầu vào", detail: "Không sửa phần tử trong aRows." },
    ],
    starterCode: `sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
  "use strict";

  function buildSummary(aRows) {
    // TODO: return [{ region, total, count }] sorted by total desc
  }

  return Controller.extend("my.app.controller.Summary", {
    onInit: function () {
      this.getView().setModel(new JSONModel({ summary: [] }), "view");
    },

    onDataLoaded: function (aRows) {
      // TODO
    }
  });
});
`,
    hints: [
      "const mTotals = new Map(); for (const r of aRows) { const e = mTotals.get(r.region) || { region: r.region, total: 0, count: 0 }; ... mTotals.set(r.region, e); }",
      "Array.from(mTotals.values()).sort((a, b) => b.total - a.total)",
    ],
    solution: `sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel"
], function (Controller, JSONModel) {
  "use strict";

  function buildSummary(aRows) {
    const mTotals = new Map();
    for (const oRow of aRows) {
      let oEntry = mTotals.get(oRow.region);
      if (!oEntry) {
        oEntry = { region: oRow.region, total: 0, count: 0 };
        mTotals.set(oRow.region, oEntry);
      }
      oEntry.total += oRow.amount;
      oEntry.count += 1;
    }
    return Array.from(mTotals.values()).sort((a, b) => b.total - a.total);
  }

  return Controller.extend("my.app.controller.Summary", {
    onInit: function () {
      this.getView().setModel(new JSONModel({ summary: [] }), "view");
    },

    onDataLoaded: function (aRows) {
      this.getView().getModel("view").setProperty("/summary", buildSummary(aRows));
    }
  });
});`,
    targetBigO: "O(n + r log r)",
  },
  {
    slug: "ui5-debounce-livechange",
    track: "UI5",
    level: "HARD",
    title: "Debounce liveChange + dọn dẹp",
    topic: "Performance",
    tags: ["debounce", "setTimeout", "onExit", "liveChange"],
    description: `\`liveChange\` bắn mỗi phím gõ. Nếu mỗi lần gọi \`filter\` trên bảng 10.000 dòng, UI sẽ giật.

Hãy viết controller:

- \`onLiveChange(oEvent)\`: **debounce 300ms** – chỉ chạy filter sau khi người dùng ngừng gõ 300ms. Phải \`clearTimeout\` timer cũ mỗi lần gọi.
- \`_applyFilter(sQuery)\`: lọc \`items\` của \`sap.m.Table id="bigTable"\` theo \`Name\` (Contains).
- \`onSearch\` (nhấn Enter): chạy filter **ngay** và huỷ timer đang chờ.
- \`onExit\`: huỷ timer còn pending để tránh gọi vào control đã bị destroy.

Không dùng thư viện ngoài (lodash...).`,
    milestones: [
      { id: "m1", title: "Debounce bằng setTimeout + clearTimeout", detail: "Timer id lưu trong this._iTimer." },
      { id: "m2", title: "Delay 300ms", detail: "Hằng số rõ ràng, không magic number rải rác." },
      { id: "m3", title: "onSearch chạy ngay và huỷ timer", detail: "clearTimeout trước khi gọi _applyFilter." },
      { id: "m4", title: "onExit dọn timer", detail: "Không để callback chạy sau khi view bị huỷ." },
      { id: "m5", title: "Filter dùng ListBinding", detail: "getBinding('items').filter(...)." },
    ],
    starterCode: `sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator"
], function (Controller, Filter, FilterOperator) {
  "use strict";

  return Controller.extend("my.app.controller.BigTable", {
    onLiveChange: function (oEvent) {
      // TODO
    },

    onSearch: function (oEvent) {
      // TODO
    },

    _applyFilter: function (sQuery) {
      // TODO
    },

    onExit: function () {
      // TODO
    }
  });
});
`,
    hints: [
      "clearTimeout(this._iTimer); this._iTimer = setTimeout(() => this._applyFilter(sQuery), DEBOUNCE_MS);",
      "Lấy query: oEvent.getParameter('newValue') cho liveChange, 'query' cho search.",
    ],
    solution: `sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator"
], function (Controller, Filter, FilterOperator) {
  "use strict";

  const DEBOUNCE_MS = 300;

  return Controller.extend("my.app.controller.BigTable", {
    onLiveChange: function (oEvent) {
      const sQuery = oEvent.getParameter("newValue");
      clearTimeout(this._iTimer);
      this._iTimer = setTimeout(() => {
        this._iTimer = null;
        this._applyFilter(sQuery);
      }, DEBOUNCE_MS);
    },

    onSearch: function (oEvent) {
      clearTimeout(this._iTimer);
      this._iTimer = null;
      this._applyFilter(oEvent.getParameter("query"));
    },

    _applyFilter: function (sQuery) {
      const aFilters = sQuery
        ? [new Filter("Name", FilterOperator.Contains, sQuery)]
        : [];
      this.byId("bigTable").getBinding("items").filter(aFilters);
    },

    onExit: function () {
      clearTimeout(this._iTimer);
      this._iTimer = null;
    }
  });
});`,
    targetBigO: "O(n) / debounce",
  },
  {
    slug: "ui5-odata-v4-create",
    track: "UI5",
    level: "HARD",
    title: "OData V4: sort, filter, create",
    topic: "OData V4",
    tags: ["ODataModel V4", "ListBinding", "create", "submitBatch"],
    description: `View bind \`items="{/Books}"\` với \`sap.ui.model.odata.v4.ODataModel\`.

Viết controller:

- \`onSortByTitle\`: đổi chiều sắp xếp \`title\` mỗi lần nhấn (asc ↔ desc) bằng \`ListBinding.sort(new Sorter(...))\`.
- \`onFilterByAuthor(oEvent)\`: lọc \`author\` = giá trị \`SearchField\` (EQ). Rỗng → bỏ filter.
- \`onCreate\`: tạo book mới bằng \`oListBinding.create({ title, author })\` rồi chờ \`oContext.created()\`; **thành công** → \`MessageToast\`, **lỗi** → \`MessageBox.error\`. Sau đó gọi \`submitBatch\` của group cập nhật (\`$auto\` tự gửi, không cần).

Chú ý: ở V4 bạn **không** truyền success/error callback; dùng Promise của context.`,
    milestones: [
      { id: "m1", title: "Sorter đảo chiều đúng", detail: "Lưu trạng thái bDescending, new Sorter('title', bDescending)." },
      { id: "m2", title: "Filter EQ theo author + clear khi rỗng", detail: "binding.filter(sValue ? new Filter(...) : [])." },
      { id: "m3", title: "create() trên ListBinding", detail: "this.byId('booksList').getBinding('items').create({...})." },
      { id: "m4", title: "Xử lý Promise created()", detail: "then/catch hoặc await + try/catch." },
      { id: "m5", title: "Validate trước khi create", detail: "Không tạo khi title rỗng." },
    ],
    starterCode: `sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/model/Sorter",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], function (Controller, Filter, FilterOperator, Sorter, MessageToast, MessageBox) {
  "use strict";

  return Controller.extend("my.app.controller.Books", {
    onSortByTitle: function () {
      // TODO
    },

    onFilterByAuthor: function (oEvent) {
      // TODO
    },

    onCreate: async function () {
      // TODO
    }
  });
});
`,
    hints: [
      "create() trả về Context; context.created() là Promise resolve khi server đã lưu.",
      "oBinding.sort(new Sorter('title', this._bDesc)).",
    ],
    solution: `sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/model/Sorter",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], function (Controller, Filter, FilterOperator, Sorter, MessageToast, MessageBox) {
  "use strict";

  return Controller.extend("my.app.controller.Books", {
    onSortByTitle: function () {
      this._bDesc = !this._bDesc;
      this.byId("booksList").getBinding("items").sort(new Sorter("title", this._bDesc));
    },

    onFilterByAuthor: function (oEvent) {
      const sAuthor = (oEvent.getParameter("newValue") || oEvent.getParameter("query") || "").trim();
      const vFilter = sAuthor ? new Filter("author", FilterOperator.EQ, sAuthor) : [];
      this.byId("booksList").getBinding("items").filter(vFilter);
    },

    onCreate: async function () {
      const sTitle = this.byId("titleInput").getValue().trim();
      const sAuthor = this.byId("authorInput").getValue().trim();
      if (!sTitle) {
        MessageToast.show("Title is required");
        return;
      }
      const oBinding = this.byId("booksList").getBinding("items");
      const oContext = oBinding.create({ title: sTitle, author: sAuthor });
      try {
        await oContext.created();
        MessageToast.show("Book created");
      } catch (oError) {
        MessageBox.error(oError.message);
      }
    }
  });
});`,
    targetBigO: "O(1) request",
  },
  {
    slug: "ui5-custom-control-rating",
    track: "UI5",
    level: "EXPERT",
    title: "Custom control: thanh rating",
    topic: "Custom control",
    tags: ["Control.extend", "renderer", "apiVersion 2", "events", "properties"],
    description: `Viết custom control \`my.app.control.Rating\` kế thừa \`sap.ui.core.Control\`:

**metadata**

- property \`value\` (int, mặc định 0), \`max\` (int, mặc định 5)
- event \`change\` với tham số \`value\`

**renderer** (\`apiVersion: 2\`) vẽ \`max\` ngôi sao \`<span>\` trong \`<div class="myRating">\`; ngôi sao ≤ \`value\` có class \`myRatingOn\`.

**hành vi**

- click vào ngôi sao thứ *n* → \`setValue(n)\` rồi \`fireChange({ value: n })\`.
- Validate: \`value\` luôn nằm trong \`0..max\` (clamp).
- Dùng \`setProperty("value", v, true)\` + cập nhật DOM trực tiếp **hoặc** để UI5 re-render (giải thích bằng comment ngắn bạn chọn cái nào).
- Accessibility: \`role="slider"\`, \`aria-valuenow\`, \`aria-valuemax\`.`,
    milestones: [
      { id: "m1", title: "Control.extend với metadata đúng", detail: "properties value/max (defaultValue), events change." },
      { id: "m2", title: "Renderer apiVersion 2 + openStart/openEnd", detail: "oRm.openStart('div', oControl).class(...).openEnd()." },
      { id: "m3", title: "Render đúng số sao & class on", detail: "Vòng for 1..max." },
      { id: "m4", title: "Xử lý click, fireChange", detail: "onclick/ontap → setValue + fireChange." },
      { id: "m5", title: "Clamp value 0..max", detail: "Override setValue hoặc validate trước khi set." },
      { id: "m6", title: "ARIA attributes", detail: "role, aria-valuenow, aria-valuemax." },
    ],
    starterCode: `sap.ui.define([
  "sap/ui/core/Control"
], function (Control) {
  "use strict";

  return Control.extend("my.app.control.Rating", {
    metadata: {
      // TODO
    },

    renderer: {
      apiVersion: 2,
      render: function (oRm, oControl) {
        // TODO
      }
    },

    onclick: function (oEvent) {
      // TODO
    }
  });
});
`,
    hints: [
      "oRm.openStart('div', oControl).class('myRating').attr('role','slider').openEnd(); ... oRm.close('div');",
      "Đánh dấu data-index trên mỗi <span> rồi đọc oEvent.target.dataset.index trong onclick.",
      "Override setValue(v): clamp rồi this.setProperty('value', clamped).",
    ],
    solution: `sap.ui.define([
  "sap/ui/core/Control"
], function (Control) {
  "use strict";

  return Control.extend("my.app.control.Rating", {
    metadata: {
      properties: {
        value: { type: "int", defaultValue: 0 },
        max: { type: "int", defaultValue: 5 }
      },
      events: {
        change: { parameters: { value: { type: "int" } } }
      }
    },

    renderer: {
      apiVersion: 2,
      render: function (oRm, oControl) {
        const iValue = oControl.getValue();
        const iMax = oControl.getMax();
        oRm.openStart("div", oControl)
          .class("myRating")
          .attr("role", "slider")
          .attr("aria-valuenow", iValue)
          .attr("aria-valuemax", iMax)
          .attr("tabindex", "0")
          .openEnd();
        for (let i = 1; i <= iMax; i++) {
          oRm.openStart("span")
            .class("myRatingStar")
            .class(i <= iValue ? "myRatingOn" : "")
            .attr("data-index", i)
            .openEnd()
            .text("★")
            .close("span");
        }
        oRm.close("div");
      }
    },

    // Clamp in the setter; default setProperty invalidates -> UI5 re-renders the control.
    setValue: function (iValue) {
      const iClamped = Math.min(Math.max(parseInt(iValue, 10) || 0, 0), this.getMax());
      return this.setProperty("value", iClamped);
    },

    onclick: function (oEvent) {
      const iIndex = parseInt(oEvent.target.dataset.index, 10);
      if (!iIndex) {
        return;
      }
      this.setValue(iIndex);
      this.fireChange({ value: this.getValue() });
    }
  });
});`,
    targetBigO: "O(max)",
  },
];
