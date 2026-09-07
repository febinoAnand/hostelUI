/* ============================================================
   HostelHub — Business logic layer
   Pure functions computed on demand from window.Data. No caching.
   ============================================================ */
(function () {
  "use strict";
  var D = window.Data;

  function sum(list, fn) { return list.reduce(function (a, x) { return a + fn(x); }, 0); }

  /* ---------------- Fees ---------------- */
  function getFeeSummary(studentId) {
    var ledger = D.getFeeLedger().filter(function (l) { return l.studentId === studentId; });
    var invoiced = sum(ledger.filter(function (l) { return l.type === "invoice"; }), function (l) { return l.amount; });
    var paid = sum(ledger.filter(function (l) { return l.type === "payment"; }), function (l) { return l.amount; });
    return { invoiced: invoiced, paid: paid, due: invoiced - paid, ledger: ledger, status: (invoiced - paid) <= 0 ? "paid" : (paid > 0 ? "partial" : "pending") };
  }

  function getHostelFeeStats() {
    var students = D.getStudents().filter(function (s) { return s.status === "active"; });
    var totalInvoiced = 0, totalPaid = 0, unpaidCount = 0, paidCount = 0, partialCount = 0;
    students.forEach(function (s) {
      var f = getFeeSummary(s.id);
      totalInvoiced += f.invoiced; totalPaid += f.paid;
      if (f.status === "paid") paidCount++; else if (f.status === "partial") partialCount++; else unpaidCount++;
    });
    return { totalInvoiced: totalInvoiced, totalPaid: totalPaid, totalDue: totalInvoiced - totalPaid, paidCount: paidCount, partialCount: partialCount, unpaidCount: unpaidCount };
  }

  function getAdvanceBalance(studentId) {
    return sum(D.getAdvances().filter(function (a) { return a.studentId === studentId; }), function (a) { return a.balance; });
  }

  /* ---------------- Rooms ---------------- */
  function getRoomStatus(room) {
    if (!room.occupantIds.length) return "vacant";
    if (room.occupantIds.length >= room.capacity) return "occupied";
    return "partial";
  }
  function getRoomStats() {
    var rooms = D.getRooms();
    var occupied = 0, vacant = 0, partial = 0, totalCapacity = 0, totalOccupants = 0;
    rooms.forEach(function (r) {
      var st = getRoomStatus(r);
      if (st === "occupied") occupied++; else if (st === "vacant") vacant++; else partial++;
      totalCapacity += r.capacity; totalOccupants += r.occupantIds.length;
    });
    return { total: rooms.length, occupied: occupied, vacant: vacant, partial: partial, totalCapacity: totalCapacity, totalOccupants: totalOccupants };
  }

  function getEBShareForBlock(block, period) {
    var bill = D.getEBBills().find(function (b) { return b.block === block && b.period === period; });
    if (!bill) return { bill: null, shares: [] };
    var rooms = D.getRooms().filter(function (r) { return r.block === block; });
    var totalOccupants = sum(rooms, function (r) { return r.occupantIds.length; }) || 1;
    var perHead = bill.totalAmount / totalOccupants;
    var shares = rooms.map(function (r) {
      return { room: r, occupants: r.occupantIds.length, share: r.occupantIds.length ? Math.round(perHead * r.occupantIds.length) : 0 };
    });
    return { bill: bill, shares: shares, perHead: perHead };
  }

  /* ---------------- Attendance / missing alerts ---------------- */
  function getLatestInOut(studentId) {
    var logs = D.getStudentInOut().filter(function (l) { return l.studentId === studentId; });
    logs.sort(function (a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });
    return logs[0] || null;
  }
  function getCurrentStatus(studentId) {
    var latest = getLatestInOut(studentId);
    return latest ? latest.direction : "in";
  }
  function getMissingAlertThreshold() {
    var settings = D.getSettings();
    return (settings && settings.missingAlertHours) || 10;
  }
  function getMissingStudents(hoursThreshold) {
    hoursThreshold = hoursThreshold || getMissingAlertThreshold();
    var now = new Date();
    var students = D.getStudents().filter(function (s) { return s.status === "active"; });
    var missing = [];
    students.forEach(function (s) {
      var latest = getLatestInOut(s.id);
      if (latest && latest.direction === "out") {
        var hoursOut = (now - new Date(latest.timestamp)) / 36e5;
        if (hoursOut >= hoursThreshold) missing.push({ student: s, since: latest.timestamp, hoursOut: hoursOut, reason: latest.reason });
      }
    });
    return missing;
  }
  function getAttendanceForDate(dateIso) {
    var cutoff = dateIso + "T23:59:59.999Z";
    var logs = D.getStudentInOut();
    var students = D.getStudents().filter(function (s) { return s.status === "active"; });
    return students.map(function (s) {
      var studentLogs = logs.filter(function (l) { return l.studentId === s.id && l.timestamp <= cutoff; });
      studentLogs.sort(function (a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });
      var latest = studentLogs[0] || null;
      return { student: s, status: latest ? latest.direction : "in", since: latest ? latest.timestamp : null, reason: latest ? latest.reason : null };
    });
  }
  function getTodayInOutCounts() {
    var students = D.getStudents().filter(function (s) { return s.status === "active"; });
    var inCount = 0, outCount = 0;
    students.forEach(function (s) { if (getCurrentStatus(s.id) === "out") outCount++; else inCount++; });
    return { in: inCount, out: outCount, total: students.length };
  }

  /* ---------------- Outpass ---------------- */
  function getOutpassStats() {
    var list = D.getOutpass();
    return {
      pending: list.filter(function (o) { return o.status === "pending"; }).length,
      approved: list.filter(function (o) { return o.status === "approved"; }).length,
      rejected: list.filter(function (o) { return o.status === "rejected"; }).length,
      returned: list.filter(function (o) { return o.status === "returned"; }).length,
      total: list.length
    };
  }

  /* ---------------- Canteen ---------------- */
  function getStockBalance(itemId) {
    var txns = D.getCanteenStock().filter(function (t) { return t.itemId === itemId; });
    var inward = sum(txns.filter(function (t) { return t.type === "inward"; }), function (t) { return t.quantity; });
    var outward = sum(txns.filter(function (t) { return t.type === "outward"; }), function (t) { return t.quantity; });
    var toMess = sum(txns.filter(function (t) { return t.type === "mess"; }), function (t) { return t.quantity; });
    var adjustment = sum(txns.filter(function (t) { return t.type === "adjustment"; }), function (t) { return t.quantity; });
    return inward - outward - toMess + adjustment;
  }
  function getAllStockBalances() {
    return D.getCanteenItems().map(function (it) {
      var balance = getStockBalance(it.id);
      var hasActivity = D.getCanteenStock().some(function (t) { return t.itemId === it.id; });
      return { item: it, balance: balance, isLowStock: hasActivity && balance < it.reorderThreshold };
    });
  }
  function getLowStockAlerts() { return getAllStockBalances().filter(function (b) { return b.isLowStock; }); }

  function getCanteenCostTotals(fromIso, toIso) {
    var txns = D.getCanteenStock().filter(function (t) { return t.type === "inward" && (!fromIso || t.date >= fromIso) && (!toIso || t.date <= toIso); });
    return sum(txns, function (t) { return t.totalAmount; });
  }
  function getCanteenUsageCostTotals(fromIso, toIso) {
    var txns = D.getCanteenStock().filter(function (t) { return (t.type === "outward" || t.type === "mess") && (!fromIso || t.date >= fromIso) && (!toIso || t.date <= toIso); });
    return sum(txns, function (t) { return t.totalAmount; });
  }
  function getCanteenMealCount(fromIso, toIso) {
    return D.getCanteenAttendance().filter(function (a) { return (!fromIso || a.date >= fromIso) && (!toIso || a.date <= toIso); }).length;
  }
  function getWeeklyCanteenReport() {
    var from = D.isoDate(D.addDays(D.today(), -6));
    var to = D.isoDate(D.today());
    return { from: from, to: to, cost: getCanteenUsageCostTotals(from, to), meals: getCanteenMealCount(from, to) };
  }
  function getMonthlyCanteenReport() {
    var from = D.isoDate(D.addDays(D.today(), -29));
    var to = D.isoDate(D.today());
    return { from: from, to: to, cost: getCanteenUsageCostTotals(from, to), meals: getCanteenMealCount(from, to) };
  }

  /* ---------------- Staff ---------------- */
  function getStaffAttendanceToday(staffId) {
    var today = D.isoDate(D.today());
    var rec = D.getStaffAttendance().find(function (a) { return a.staffId === staffId && a.date === today; });
    return rec ? rec.status : "unmarked";
  }
  function getSalarySummary(staffId) {
    var recs = D.getStaffSalary().filter(function (s) { return s.staffId === staffId; });
    var paid = sum(recs.filter(function (r) { return r.status === "paid"; }), function (r) { return r.amount; });
    var pending = sum(recs.filter(function (r) { return r.status === "pending"; }), function (r) { return r.amount; });
    return { paid: paid, pending: pending, records: recs };
  }
  function getPendingSalaryTotal() {
    return sum(D.getStaffSalary().filter(function (r) { return r.status === "pending"; }), function (r) { return r.amount; });
  }

  /* ---------------- Admin ---------------- */
  function getAdminExpenseTotal(fromIso, toIso) {
    return sum(D.getAdminExpenses().filter(function (e) { return (!fromIso || e.date >= fromIso) && (!toIso || e.date <= toIso); }), function (e) { return e.amount; });
  }
  function getComplianceStatus(item) {
    var days = Math.round((new Date(item.dueDate) - D.today()) / 864e5);
    if (days < 0) return { status: "expired", days: days };
    if (days <= 30) return { status: "expiring", days: days };
    return { status: "valid", days: days };
  }
  function getVehicleCostTotal(vehicleId) {
    return sum(D.getVehicleLogs().filter(function (l) { return l.vehicleId === vehicleId; }), function (l) { return l.cost; });
  }

  window.Business = {
    getFeeSummary: getFeeSummary, getHostelFeeStats: getHostelFeeStats, getAdvanceBalance: getAdvanceBalance,
    getRoomStatus: getRoomStatus, getRoomStats: getRoomStats, getEBShareForBlock: getEBShareForBlock,
    getLatestInOut: getLatestInOut, getCurrentStatus: getCurrentStatus, getMissingStudents: getMissingStudents, getMissingAlertThreshold: getMissingAlertThreshold, getTodayInOutCounts: getTodayInOutCounts, getAttendanceForDate: getAttendanceForDate,
    getOutpassStats: getOutpassStats,
    getStockBalance: getStockBalance, getAllStockBalances: getAllStockBalances, getLowStockAlerts: getLowStockAlerts,
    getCanteenCostTotals: getCanteenCostTotals, getCanteenUsageCostTotals: getCanteenUsageCostTotals, getCanteenMealCount: getCanteenMealCount, getWeeklyCanteenReport: getWeeklyCanteenReport, getMonthlyCanteenReport: getMonthlyCanteenReport,
    getStaffAttendanceToday: getStaffAttendanceToday, getSalarySummary: getSalarySummary, getPendingSalaryTotal: getPendingSalaryTotal,
    getAdminExpenseTotal: getAdminExpenseTotal, getComplianceStatus: getComplianceStatus, getVehicleCostTotal: getVehicleCostTotal
  };
})();
