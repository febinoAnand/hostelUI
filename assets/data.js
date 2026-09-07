/* ============================================================
   HostelHub — Data layer (mock DB over localStorage)
   Pattern: makeStore(key, buildSeed) -> {get(), save(list)}
   Pages read the whole array, mutate in memory, then save it back.
   ============================================================ */
(function () {
  "use strict";

  function uid(prefix) {
    return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function isoDate(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function today() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function addDays(base, n) { var d = new Date(base); d.setDate(d.getDate() + n); return d; }
  var MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  function displayDate(iso) {
    if (!iso) return "-";
    var p = iso.split("-");
    return p[2] + " " + MONTHS[parseInt(p[1], 10) - 1] + " " + p[0];
  }
  function displayDateTime(iso) {
    if (!iso) return "-";
    var d = new Date(iso);
    var h = d.getHours(), m = pad(d.getMinutes());
    var ampm = h >= 12 ? "PM" : "AM";
    h = h % 12; if (h === 0) h = 12;
    return displayDate(isoDate(d)) + ", " + h + ":" + m + " " + ampm;
  }
  function nowIso() { return new Date().toISOString(); }

  var TODAY = today();

  function makeStore(key, buildSeed) {
    return {
      get: function () {
        try {
          var raw = localStorage.getItem(key);
          if (raw) return JSON.parse(raw);
        } catch (e) {}
        var seed = buildSeed();
        localStorage.setItem(key, JSON.stringify(seed));
        return seed;
      },
      save: function (list) { localStorage.setItem(key, JSON.stringify(list)); }
    };
  }

  /* ---------------- Constants ---------------- */
  var PERMISSION_MODULES = [
    { key: "students", label: "Hostellers" },
    { key: "attendance", label: "In/Out & Alerts" },
    { key: "fees", label: "Payments & Fee Structure" },
    { key: "outpass", label: "Outpass & Travel" },
    { key: "canteen", label: "Canteen" },
    { key: "staff", label: "Staff" },
    { key: "rooms", label: "Rooms" },
    { key: "admin", label: "Admin" },
    { key: "roles", label: "Roles & Permissions" },
    { key: "settings", label: "App Settings" }
  ];
  var ACTIONS = ["create", "read", "update", "delete"];
  function fullPerms(val) {
    var p = {};
    PERMISSION_MODULES.forEach(function (m) {
      p[m.key] = {};
      ACTIONS.forEach(function (a) { p[m.key][a] = !!val; });
    });
    return p;
  }

  var COURSES = ["B.Tech CSE", "B.Tech ECE", "B.Tech Mech", "B.Sc Physics", "B.Com", "BBA", "M.Tech CSE", "MBA"];
  var BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  var MEALS = ["breakfast", "lunch", "dinner"];
  var CANTEEN_CATEGORIES = ["Grains & Cereals", "Vegetables", "Dairy", "Spices & Masala", "Oil & Fats", "Beverages", "Packaged"];
  var ADMIN_EXPENSE_CATEGORIES = ["Maintenance", "Housekeeping", "Security", "Water Supply", "Internet & Cable", "Stationery", "Miscellaneous"];
  var DESIGNATIONS = ["Warden", "Assistant Warden", "Cook", "Kitchen Helper", "Security Guard", "Housekeeping Staff", "Electrician", "Plumber", "Receptionist"];
  var VEHICLE_TYPES = ["Hostel Bus", "Mini Van", "Two-Wheeler", "Ambulance"];
  var DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  /* ---------------- Roles ---------------- */
  var rolesStore = makeStore("hh_roles_v1", function () {
    return [
      { id: "r_admin", name: "Administrator", description: "Full access across every module.", isAdmin: true, isSystem: true, permissions: fullPerms(true) },
      { id: "r_warden", name: "Warden", description: "Manages hostellers, rooms, attendance, outpass and travel.", isAdmin: false, isSystem: true,
        permissions: Object.assign(fullPerms(false), {
          students: { create: true, read: true, update: true, delete: false },
          attendance: { create: true, read: true, update: true, delete: false },
          outpass: { create: true, read: true, update: true, delete: false },
          rooms: { create: true, read: true, update: true, delete: false },
          fees: { create: false, read: true, update: false, delete: false },
          canteen: { create: false, read: true, update: false, delete: false },
          staff: { create: false, read: true, update: false, delete: false }
        }) },
      { id: "r_accountant", name: "Accountant", description: "Manages fees, salary and admin expenses.", isAdmin: false, isSystem: true,
        permissions: Object.assign(fullPerms(false), {
          fees: { create: true, read: true, update: true, delete: true },
          staff: { create: false, read: true, update: true, delete: false },
          admin: { create: true, read: true, update: true, delete: false },
          students: { create: false, read: true, update: false, delete: false },
          rooms: { create: false, read: true, update: false, delete: false }
        }) },
      { id: "r_canteen", name: "Canteen In-charge", description: "Manages canteen stock, menu and meal attendance.", isAdmin: false, isSystem: true,
        permissions: Object.assign(fullPerms(false), {
          canteen: { create: true, read: true, update: true, delete: true },
          students: { create: false, read: true, update: false, delete: false }
        }) }
    ];
  });

  /* ---------------- Users ---------------- */
  var usersStore = makeStore("hh_users_v1", function () {
    return [
      { id: "u1", name: "Vijay Kumar", username: "vijay.kumar", email: "vijay@hostelhub.in", phone: "9840011234", roleId: "r_admin" },
      { id: "u2", name: "Meena Rajan", username: "meena.rajan", email: "meena@hostelhub.in", phone: "9840022345", roleId: "r_warden" },
      { id: "u3", name: "Suresh Babu", username: "suresh.babu", email: "suresh@hostelhub.in", phone: "9840033456", roleId: "r_accountant" },
      { id: "u4", name: "Lakshmi Narayanan", username: "lakshmi.n", email: "lakshmi@hostelhub.in", phone: "9840044567", roleId: "r_canteen" }
    ];
  });

  /* ---------------- Rooms ---------------- */
  var roomsStore = makeStore("hh_rooms_v1", function () {
    var rooms = [];
    var blocks = ["A", "B", "C"];
    blocks.forEach(function (block, bi) {
      for (var floor = 1; floor <= 3; floor++) {
        for (var i = 1; i <= 4; i++) {
          var num = block + "-" + floor + pad(i);
          rooms.push({
            id: "rm_" + num,
            roomNumber: num,
            block: block,
            floor: floor,
            capacity: (i % 4 === 0) ? 2 : 3,
            type: (bi === 0) ? "AC" : "Non-AC",
            occupantIds: []
          });
        }
      }
    });
    return rooms;
  });

  /* ---------------- Students ---------------- */
  var studentNames = [
    "Arun Prakash", "Divya Shree", "Karthik Raja", "Priya Dharshini", "Vignesh Kumar",
    "Anitha Selvam", "Mohammed Iqbal", "Swathi Ramesh", "Naveen Kumar", "Deepika Suresh",
    "Gokul Krishnan", "Harini Balaji", "Sanjay Varma", "Pooja Lakshmi", "Ashwin Raj",
    "Nithya Sree", "Praveen Anand", "Keerthana Devi", "Rahul Nair", "Sowmya Ganesh",
    "Vikram Aditya", "Meera Pillai", "Dinesh Kanna", "Aishwarya Ravi", "Bala Murugan"
  ];
  var studentsStore = makeStore("hh_students_v1", function () {
    var rooms = roomsStore.get();
    var list = [];
    studentNames.forEach(function (name, i) {
      var room = rooms[i % rooms.length];
      var regNo = "HH24" + pad((i + 1));
      var status = (i === studentNames.length - 1) ? "left" : "active";
      list.push({
        id: "st" + (i + 1),
        name: name,
        regNo: regNo,
        course: COURSES[i % COURSES.length],
        year: (i % 4) + 1,
        roomId: status === "active" ? room.id : null,
        guardianName: name.split(" ")[0] + "'s Parent",
        guardianPhone: "98" + (40000000 + i * 137),
        address: (i % 3 === 0 ? "Coimbatore" : i % 3 === 1 ? "Madurai" : "Trichy") + ", Tamil Nadu",
        admissionDate: isoDate(addDays(TODAY, -300 - i * 3)),
        bloodGroup: BLOOD_GROUPS[i % BLOOD_GROUPS.length],
        status: status
      });
      if (status === "active") room.occupantIds.push("st" + (i + 1));
    });
    roomsStore.save(rooms);
    return list;
  });

  /* ---------------- Student In/Out ---------------- */
  var studentInOutStore = makeStore("hh_student_inout_v1", function () {
    var list = [];
    var students = studentsStore.get().filter(function (s) { return s.status === "active"; });
    students.forEach(function (s, i) {
      // History over the last few days
      for (var d = 4; d >= 1; d--) {
        list.push({ id: uid("io"), studentId: s.id, direction: "out", timestamp: addDays(TODAY, -d).toISOString().slice(0, 10) + "T09:15:00", reason: "Class / campus" });
        list.push({ id: uid("io"), studentId: s.id, direction: "in", timestamp: addDays(TODAY, -d).toISOString().slice(0, 10) + "T18:40:00", reason: "" });
      }
      // Today's status: most are "in", a few are "out" (some overdue -> missing alerts)
      if (i % 6 === 0) {
        list.push({ id: uid("io"), studentId: s.id, direction: "out", timestamp: isoDate(TODAY) + "T08:30:00", reason: "Home visit (unregistered)" });
      } else if (i % 5 === 0) {
        list.push({ id: uid("io"), studentId: s.id, direction: "out", timestamp: isoDate(TODAY) + "T14:00:00", reason: "Library" });
      } else {
        list.push({ id: uid("io"), studentId: s.id, direction: "in", timestamp: isoDate(TODAY) + "T07:50:00", reason: "" });
      }
    });
    return list;
  });

  /* ---------------- Missing alerts ---------------- */
  var missingAlertsStore = makeStore("hh_missing_alerts_v1", function () {
    return [];
  });

  /* ---------------- Fee structures ---------------- */
  var feeStructuresStore = makeStore("hh_fee_structures_v1", function () {
    return [
      { id: "fs1", name: "Standard Hostel Package", year: "2026-27", components: { hostel: 45000, mess: 30000, maintenance: 5000, misc: 2000 }, total: 82000 },
      { id: "fs2", name: "AC Room Package", year: "2026-27", components: { hostel: 65000, mess: 30000, maintenance: 5000, misc: 2000 }, total: 102000 }
    ];
  });

  /* ---------------- Fee ledger (invoice/payment) ---------------- */
  var feeLedgerStore = makeStore("hh_fee_ledger_v1", function () {
    var list = [];
    var students = studentsStore.get().filter(function (s) { return s.status === "active"; });
    students.forEach(function (s, i) {
      var room = roomsStore.get().find(function (r) { return r.id === s.roomId; });
      var fs = room && room.type === "AC" ? feeStructuresStore.get()[1] : feeStructuresStore.get()[0];
      list.push({ id: uid("fl"), studentId: s.id, type: "invoice", amount: fs.total, date: isoDate(addDays(TODAY, -90)), mode: "", receiptNo: "", description: fs.name });
      if (i % 3 !== 0) {
        var paid = Math.round(fs.total * (i % 2 === 0 ? 0.6 : 1) / 100) * 100;
        list.push({ id: uid("fl"), studentId: s.id, type: "payment", amount: paid, date: isoDate(addDays(TODAY, -60)), mode: i % 2 === 0 ? "UPI" : "Bank Transfer", receiptNo: "RCT-" + (1000 + i), description: "Term 1 payment" });
      }
    });
    return list;
  });

  /* ---------------- Advances ---------------- */
  var advancesStore = makeStore("hh_advances_v1", function () {
    var list = [];
    var students = studentsStore.get().filter(function (s) { return s.status === "active"; });
    students.slice(0, 6).forEach(function (s, i) {
      list.push({ id: uid("adv"), studentId: s.id, amount: 500 + i * 150, date: isoDate(addDays(TODAY, -20 - i)), purpose: i % 2 === 0 ? "Medical" : "Personal", balance: 500 + i * 150 - (i % 2 === 0 ? 200 : 0) });
    });
    return list;
  });

  /* ---------------- Travel ---------------- */
  var travelStore = makeStore("hh_travel_v1", function () {
    var list = [];
    var students = studentsStore.get().filter(function (s) { return s.status === "active"; });
    students.slice(0, 8).forEach(function (s, i) {
      list.push({ id: uid("tr"), studentId: s.id, type: "home", date: isoDate(addDays(TODAY, -10 - i)), expectedReturnDate: isoDate(addDays(TODAY, -3 - i)), mode: i % 2 === 0 ? "Bus" : "Train", notes: "" });
      if (i % 2 === 0) {
        list.push({ id: uid("tr"), studentId: s.id, type: "return", date: isoDate(addDays(TODAY, -3 - i)), expectedReturnDate: "", mode: i % 2 === 0 ? "Bus" : "Train", notes: "Returned on time" });
      }
    });
    return list;
  });

  /* ---------------- Outpass ---------------- */
  var outpassStore = makeStore("hh_outpass_v1", function () {
    var list = [];
    var students = studentsStore.get().filter(function (s) { return s.status === "active"; });
    var reasons = ["Family function", "Medical checkup", "Shopping", "Interview", "Personal work"];
    students.slice(0, 10).forEach(function (s, i) {
      var statuses = ["pending", "approved", "approved", "rejected", "returned"];
      list.push({
        id: uid("op"), studentId: s.id, reason: reasons[i % reasons.length],
        fromDatetime: addDays(TODAY, -5 + (i % 5)).toISOString().slice(0, 10) + "T10:00:00",
        toDatetime: addDays(TODAY, -5 + (i % 5)).toISOString().slice(0, 10) + "T20:00:00",
        status: statuses[i % statuses.length], approvedBy: "Meena Rajan"
      });
    });
    return list;
  });

  /* ---------------- Canteen: items, stock, menu, attendance ---------------- */
  var canteenItemsStore = makeStore("hh_canteen_items_v1", function () {
    return [
      { id: "ci1", name: "Rice (Sona Masoori)", category: "Grains & Cereals", unit: "kg", reorderThreshold: 100 },
      { id: "ci2", name: "Toor Dal", category: "Grains & Cereals", unit: "kg", reorderThreshold: 40 },
      { id: "ci3", name: "Onion", category: "Vegetables", unit: "kg", reorderThreshold: 50 },
      { id: "ci4", name: "Tomato", category: "Vegetables", unit: "kg", reorderThreshold: 40 },
      { id: "ci5", name: "Milk", category: "Dairy", unit: "litre", reorderThreshold: 60 },
      { id: "ci6", name: "Cooking Oil", category: "Oil & Fats", unit: "litre", reorderThreshold: 30 },
      { id: "ci7", name: "Turmeric Powder", category: "Spices & Masala", unit: "kg", reorderThreshold: 5 },
      { id: "ci8", name: "Tea Powder", category: "Beverages", unit: "kg", reorderThreshold: 8 },
      { id: "ci9", name: "Wheat Flour", category: "Grains & Cereals", unit: "kg", reorderThreshold: 60 },
      { id: "ci10", name: "Biscuit Packets", category: "Packaged", unit: "pack", reorderThreshold: 20 }
    ];
  });
  var canteenStockStore = makeStore("hh_canteen_stock_v1", function () {
    var items = canteenItemsStore.get();
    var list = [];
    items.forEach(function (it, i) {
      var rate = [42, 110, 35, 28, 48, 145, 260, 380, 38, 90][i % 10];
      for (var w = 3; w >= 0; w--) {
        var qty = it.reorderThreshold + 20 + (i * 3) % 30;
        list.push({ id: uid("st"), itemId: it.id, type: "inward", quantity: qty, ratePerUnit: rate, totalAmount: qty * rate, date: isoDate(addDays(TODAY, -w * 7 - 2)), supplier: "Sri Balaji Traders" });
        var used = Math.round(qty * 0.6);
        list.push({ id: uid("st"), itemId: it.id, type: "outward", quantity: used, ratePerUnit: rate, totalAmount: used * rate, date: isoDate(addDays(TODAY, -w * 7 - 1)), supplier: "" });
      }
    });
    // force a couple of items low on stock
    list.push({ id: uid("st"), itemId: "ci7", type: "outward", quantity: 12, ratePerUnit: 260, totalAmount: 12 * 260, date: isoDate(addDays(TODAY, -1)), supplier: "" });
    list.push({ id: uid("st"), itemId: "ci8", type: "outward", quantity: 15, ratePerUnit: 380, totalAmount: 15 * 380, date: isoDate(addDays(TODAY, -1)), supplier: "" });
    return list;
  });
  var canteenMenuStore = makeStore("hh_canteen_menu_v1", function () {
    var menuMap = {
      Monday: { breakfast: "Idli, Sambar, Chutney", lunch: "Rice, Sambar, Poriyal, Curd", dinner: "Chapati, Kurma" },
      Tuesday: { breakfast: "Pongal, Vada", lunch: "Rice, Rasam, Kootu, Papad", dinner: "Fried Rice, Gobi Manchurian" },
      Wednesday: { breakfast: "Dosa, Chutney", lunch: "Rice, Sambar, Beans Poriyal", dinner: "Chapati, Dal Tadka" },
      Thursday: { breakfast: "Bread, Omelette / Upma", lunch: "Rice, Kara Kuzhambu, Curd", dinner: "Lemon Rice, Curry" },
      Friday: { breakfast: "Idiyappam, Kurma", lunch: "Rice, Sambar, Chow Chow Poriyal", dinner: "Chapati, Paneer Curry" },
      Saturday: { breakfast: "Poori, Masala", lunch: "Rice, Rasam, Vazhakkai Poriyal", dinner: "Variety Rice" },
      Sunday: { breakfast: "Rava Kesari, Sandwich", lunch: "Chicken/Veg Biryani, Raita", dinner: "Chapati, Chana Masala" }
    };
    var list = [];
    DAYS.forEach(function (day) {
      MEALS.forEach(function (meal) {
        list.push({ id: uid("mn"), day: day, meal: meal, items: menuMap[day][meal] });
      });
    });
    return list;
  });
  var canteenAttendanceStore = makeStore("hh_canteen_attendance_v1", function () {
    var list = [];
    var students = studentsStore.get().filter(function (s) { return s.status === "active"; });
    for (var d = 6; d >= 0; d--) {
      var date = isoDate(addDays(TODAY, -d));
      students.forEach(function (s, i) {
        MEALS.forEach(function (meal, mi) {
          if ((i + mi + d) % 5 !== 0) {
            list.push({ id: uid("ca"), studentId: s.id, meal: meal, date: date, timestamp: date + "T0" + (7 + mi * 5) + ":00:00" });
          }
        });
      });
    }
    return list;
  });

  /* ---------------- Staff ---------------- */
  var staffNames = ["Meena Rajan", "Suresh Babu", "Lakshmi Narayanan", "Ganesan Pillai", "Radha Krishnan",
    "Muthu Selvam", "Kavitha Ramesh", "Baskar Doss", "Elango Perumal", "Sathya Priya"];
  var staffStore = makeStore("hh_staff_v1", function () {
    return staffNames.map(function (name, i) {
      return {
        id: "sf" + (i + 1), name: name, designation: DESIGNATIONS[i % DESIGNATIONS.length],
        phone: "97" + (10000000 + i * 211), joinDate: isoDate(addDays(TODAY, -500 - i * 20)),
        salaryPerMonth: 12000 + (i % 5) * 3500, isActive: i !== staffNames.length - 1
      };
    });
  });

  /* ---------------- Staff attendance ---------------- */
  var staffAttendanceStore = makeStore("hh_staff_attendance_v1", function () {
    var list = [];
    var staff = staffStore.get().filter(function (s) { return s.isActive; });
    for (var d = 6; d >= 0; d--) {
      var date = isoDate(addDays(TODAY, -d));
      staff.forEach(function (s, i) {
        var present = (i + d) % 7 !== 0;
        list.push({ id: uid("sa"), staffId: s.id, date: date, status: present ? "present" : "absent", inTime: present ? "09:0" + (i % 5) : "", outTime: present ? "18:0" + (i % 5) : "" });
      });
    }
    return list;
  });

  /* ---------------- Staff salary payments ---------------- */
  var staffSalaryStore = makeStore("hh_staff_salary_v1", function () {
    var list = [];
    var staff = staffStore.get();
    var months = ["2026-07", "2026-08", "2026-09"];
    staff.forEach(function (s, i) {
      months.forEach(function (m, mi) {
        var status = (mi === months.length - 1 && i % 3 !== 0) ? "pending" : "paid";
        list.push({ id: uid("sp"), staffId: s.id, month: m, amount: s.salaryPerMonth, paidDate: status === "paid" ? isoDate(addDays(TODAY, -5 - mi * 30)) : "", status: status });
      });
    });
    return list;
  });

  /* ---------------- Rooms: EB bills ---------------- */
  var ebBillsStore = makeStore("hh_eb_bills_v1", function () {
    var list = [];
    ["A", "B", "C"].forEach(function (block, i) {
      list.push({ id: uid("eb"), block: block, period: "2026-08", unitsConsumed: 1400 + i * 220, ratePerUnit: 8.5, totalAmount: (1400 + i * 220) * 8.5, date: isoDate(addDays(TODAY, -12)) });
    });
    return list;
  });

  /* ---------------- Admin expenses ---------------- */
  var adminExpensesStore = makeStore("hh_admin_expenses_v1", function () {
    var list = [];
    ADMIN_EXPENSE_CATEGORIES.forEach(function (cat, i) {
      for (var m = 0; m < 2; m++) {
        list.push({ id: uid("ax"), category: cat, amount: 2000 + i * 850 + m * 300, date: isoDate(addDays(TODAY, -10 - m * 28)), description: cat + " — routine expense" });
      }
    });
    return list;
  });

  /* ---------------- Legal compliance ---------------- */
  var legalComplianceStore = makeStore("hh_legal_compliance_v1", function () {
    return [
      { id: "lc1", title: "Fire Safety NOC", category: "Safety", dueDate: isoDate(addDays(TODAY, 45)), renewedDate: isoDate(addDays(TODAY, -320)), notes: "Renewed annually with local fire department." },
      { id: "lc2", title: "Hostel Operating License", category: "License", dueDate: isoDate(addDays(TODAY, 200)), renewedDate: isoDate(addDays(TODAY, -165)), notes: "" },
      { id: "lc3", title: "Water Board Compliance", category: "Utility", dueDate: isoDate(addDays(TODAY, -10)), renewedDate: isoDate(addDays(TODAY, -375)), notes: "Renewal application submitted, awaiting approval." },
      { id: "lc4", title: "Food Safety (FSSAI) License", category: "Canteen", dueDate: isoDate(addDays(TODAY, 12)), renewedDate: isoDate(addDays(TODAY, -353)), notes: "Canteen license, renew before expiry." },
      { id: "lc5", title: "Building Structural Safety Certificate", category: "Safety", dueDate: isoDate(addDays(TODAY, 500)), renewedDate: isoDate(addDays(TODAY, -230)), notes: "" },
      { id: "lc6", title: "Pest Control Contract", category: "Utility", dueDate: isoDate(addDays(TODAY, 25)), renewedDate: isoDate(addDays(TODAY, -335)), notes: "Quarterly service contract." }
    ];
  });

  /* ---------------- Vehicles ---------------- */
  var vehiclesStore = makeStore("hh_vehicles_v1", function () {
    return [
      { id: "vh1", vehicleNo: "TN 39 BX 4521", type: "Hostel Bus", driverName: "Rajesh Kumar", purpose: "Student transport to campus" },
      { id: "vh2", vehicleNo: "TN 39 CJ 1187", type: "Mini Van", driverName: "Selvaraj M", purpose: "Grocery & supply runs" },
      { id: "vh3", vehicleNo: "TN 39 AZ 7790", type: "Ambulance", driverName: "On-call", purpose: "Medical emergencies" }
    ];
  });
  var vehicleLogsStore = makeStore("hh_vehicle_logs_v1", function () {
    var list = [];
    var vehicles = vehiclesStore.get();
    vehicles.forEach(function (v, i) {
      for (var t = 0; t < 3; t++) {
        var type = t === 0 ? "fuel" : t === 1 ? "service" : "trip";
        list.push({ id: uid("vl"), vehicleId: v.id, date: isoDate(addDays(TODAY, -5 - t * 9 - i)), type: type, cost: type === "fuel" ? 2200 + i * 150 : type === "service" ? 4500 + i * 300 : 0, notes: type === "trip" ? "Campus shuttle run" : "" });
      }
    });
    return list;
  });

  /* ---------------- App settings ---------------- */
  var settingsStore = makeStore("hh_settings_v1", function () {
    return { missingAlertHours: 10 };
  });

  /* ---------------- Public API ---------------- */
  window.Data = {
    uid: uid, isoDate: isoDate, displayDate: displayDate, displayDateTime: displayDateTime,
    addDays: addDays, today: today, nowIso: nowIso,

    PERMISSION_MODULES: PERMISSION_MODULES, ACTIONS: ACTIONS, fullPerms: fullPerms,
    COURSES: COURSES, BLOOD_GROUPS: BLOOD_GROUPS, MEALS: MEALS,
    CANTEEN_CATEGORIES: CANTEEN_CATEGORIES, ADMIN_EXPENSE_CATEGORIES: ADMIN_EXPENSE_CATEGORIES,
    DESIGNATIONS: DESIGNATIONS, VEHICLE_TYPES: VEHICLE_TYPES, DAYS: DAYS,

    getRoles: rolesStore.get, saveRoles: rolesStore.save,
    getUsers: usersStore.get, saveUsers: usersStore.save,
    getRooms: roomsStore.get, saveRooms: roomsStore.save,
    getStudents: studentsStore.get, saveStudents: studentsStore.save,
    getStudentInOut: studentInOutStore.get, saveStudentInOut: studentInOutStore.save,
    getMissingAlerts: missingAlertsStore.get, saveMissingAlerts: missingAlertsStore.save,
    getFeeStructures: feeStructuresStore.get, saveFeeStructures: feeStructuresStore.save,
    getFeeLedger: feeLedgerStore.get, saveFeeLedger: feeLedgerStore.save,
    getAdvances: advancesStore.get, saveAdvances: advancesStore.save,
    getTravel: travelStore.get, saveTravel: travelStore.save,
    getOutpass: outpassStore.get, saveOutpass: outpassStore.save,

    getCanteenItems: canteenItemsStore.get, saveCanteenItems: canteenItemsStore.save,
    getCanteenStock: canteenStockStore.get, saveCanteenStock: canteenStockStore.save,
    getCanteenMenu: canteenMenuStore.get, saveCanteenMenu: canteenMenuStore.save,
    getCanteenAttendance: canteenAttendanceStore.get, saveCanteenAttendance: canteenAttendanceStore.save,

    getStaff: staffStore.get, saveStaff: staffStore.save,
    getStaffAttendance: staffAttendanceStore.get, saveStaffAttendance: staffAttendanceStore.save,
    getStaffSalary: staffSalaryStore.get, saveStaffSalary: staffSalaryStore.save,

    getEBBills: ebBillsStore.get, saveEBBills: ebBillsStore.save,
    getAdminExpenses: adminExpensesStore.get, saveAdminExpenses: adminExpensesStore.save,
    getLegalCompliance: legalComplianceStore.get, saveLegalCompliance: legalComplianceStore.save,
    getVehicles: vehiclesStore.get, saveVehicles: vehiclesStore.save,
    getVehicleLogs: vehicleLogsStore.get, saveVehicleLogs: vehicleLogsStore.save,

    getSettings: settingsStore.get, saveSettings: settingsStore.save
  };
})();
