/* ============================================================
   HostelHub — App shell: auth, permissions, icons, sidebar/topbar,
   toasts, action menus. No real backend — sessionStorage only.
   ============================================================ */
(function () {
  "use strict";
  var D = window.Data;
  var SESSION_KEY = "hh_session_user_id";

  /* ---------------- Auth ---------------- */
  function isLoggedIn() { return !!sessionStorage.getItem(SESSION_KEY); }
  function login(userId) { sessionStorage.setItem(SESSION_KEY, userId); }
  function logout() { sessionStorage.removeItem(SESSION_KEY); window.location.href = "index.html"; }
  function requireAuth() { if (!isLoggedIn()) window.location.href = "index.html"; }
  function getCurrentUser() {
    var id = sessionStorage.getItem(SESSION_KEY);
    return D.getUsers().find(function (u) { return u.id === id; }) || null;
  }
  function getCurrentRole() {
    var u = getCurrentUser();
    if (!u) return null;
    return D.getRoles().find(function (r) { return r.id === u.roleId; }) || null;
  }
  function isAdmin() { var r = getCurrentRole(); return !!(r && r.isAdmin); }
  function can(moduleKey, action) {
    var r = getCurrentRole();
    if (!r) return false;
    if (r.isAdmin) return true;
    return !!(r.permissions && r.permissions[moduleKey] && r.permissions[moduleKey][action]);
  }

  /* ---------------- Guards ---------------- */
  function showAccessRestricted() {
    if (document.querySelector(".perm-restricted-overlay")) return;
    var el = document.createElement("div");
    el.className = "perm-restricted-overlay";
    el.innerHTML =
      '<div class="perm-restricted-card">' +
      '<div class="icon">' + svg("shieldOff") + '</div>' +
      '<h3>Access Restricted</h3>' +
      '<p>Your role does not have permission to view this page. Contact an administrator if you believe this is a mistake.</p>' +
      '<div class="btn-row">' +
      '<a class="btn btn-outline" href="dashboard.html">Go to Dashboard</a>' +
      '<button class="btn btn-primary" data-logout>Logout</button>' +
      '</div></div>';
    document.body.appendChild(el);
    el.querySelector("[data-logout]").addEventListener("click", logout);
  }
  function guardPermission(moduleKey, action) {
    if (!can(moduleKey, action || "read")) { showAccessRestricted(); return false; }
    return true;
  }
  function guardAdminOnly() {
    if (!isAdmin()) { showAccessRestricted(); return false; }
    return true;
  }
  function applyRoleVisibility() {
    document.querySelectorAll("[data-require]").forEach(function (el) {
      var parts = el.getAttribute("data-require").split(":");
      if (!can(parts[0], parts[1] || "read")) el.classList.add("hidden-by-role");
    });
  }

  /* ---------------- Icon library ---------------- */
  var ICONS = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/>',
    bed: '<path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7"/><path d="M3 13h18"/><path d="M7 13V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/><path d="M3 18v3"/><path d="M21 18v3"/>',
    inout: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    receipt: '<path d="M4 3h16v18l-3-2-2 2-2-2-2 2-2-2-2 2-3-2z"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h5"/>',
    door: '<path d="M5 21V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v17"/><path d="M5 21h13"/><path d="M13 12v.01"/><path d="M18 21V8l3 2v11"/>',
    bus: '<path d="M4 17h16V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v11z"/><path d="M4 11h16"/><circle cx="7.5" cy="19.5" r="1.5"/><circle cx="16.5" cy="19.5" r="1.5"/>',
    mealTray: '<rect x="3" y="10" width="18" height="10" rx="2"/><path d="M3 10a6 6 0 0 1 6-6h6a6 6 0 0 1 6 6"/><path d="M9 4v2"/><path d="M15 4v2"/>',
    box: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
    menu2: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    userCircle: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.5 19a6 6 0 0 1 11 0"/>',
    wallet: '<path d="M21 7H5a2 2 0 0 1 0-4h13v4"/><path d="M21 7v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7"/><path d="M17 13h.01"/>',
    coins: '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
    shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z"/>',
    shieldOff: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z"/><path d="M9.5 9.5l5 5"/><path d="M14.5 9.5l-5 5"/>',
    car: '<path d="M5 17h14v-4l-2-5H7l-2 5v4z"/><path d="M5 17v2"/><path d="M19 17v2"/><circle cx="7.5" cy="17" r="1.5"/><circle cx="16.5" cy="17" r="1.5"/>',
    fileText: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h8"/><path d="M8 9h2"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    dots: '<circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>',
    xCircle: '<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5l-5 5"/><path d="M9.5 9.5l5 5"/>',
    alertTriangle: '<path d="M12 3l10 18H2z"/><path d="M12 9v5"/><path d="M12 17h.01"/>',
    arrowRight: '<path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>',
    arrowLeft: '<path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
    idCard: '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="12" r="2"/><path d="M14 10h4"/><path d="M14 14h4"/><path d="M5 17c.5-2 2-3 3-3s2.5 1 3 3"/>',
    trendingUp: '<path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/>',
    download: '<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'
  };
  function svg(name, extraClass) {
    var path = ICONS[name] || ICONS.dashboard;
    return '<svg class="' + (extraClass || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + path + '</svg>';
  }

  /* ---------------- Nav config ---------------- */
  var NAV_ITEMS = [
    { key: "dashboard", href: "dashboard.html", label: "Dashboard", icon: "dashboard" },
    { section: "Hostellers" },
    { key: "students", href: "students.html", label: "Hostellers", icon: "users", require: "students:read" },
    { key: "hostel-attendance", href: "hostel-attendance.html", label: "In / Out Board", icon: "inout", require: "attendance:read" },
    { key: "missing-alerts", href: "missing-alerts.html", label: "Missing Alerts", icon: "bell", require: "attendance:read" },
    { key: "hostel-inout-report", href: "hostel-inout-report.html", label: "In / Out Logs", icon: "trendingUp", require: "attendance:read" },
    { key: "fees", href: "fees.html", label: "Payments", icon: "receipt", require: "fees:read" },
    { key: "fee-structure", href: "fee-structure.html", label: "Fee Structure", icon: "fileText", require: "fees:read" },
    { key: "outpass", href: "outpass.html", label: "Outpass", icon: "door", require: "outpass:read" },
    { key: "travel", href: "travel.html", label: "Travel Updates", icon: "bus", require: "outpass:read" },
    { section: "Canteen" },
    { key: "canteen-attendance", href: "canteen-attendance.html", label: "Meal In / Out", icon: "mealTray", require: "canteen:read" },
    { key: "canteen-inventory", href: "canteen-inventory.html", label: "Inventory", icon: "box", require: "canteen:read" },
    { key: "canteen-menu", href: "canteen-menu.html", label: "Weekly Menu", icon: "menu2", require: "canteen:read" },
    { key: "canteen-reports", href: "canteen-reports.html", label: "Reports", icon: "trendingUp", require: "canteen:read" },
    { section: "Staff" },
    { key: "staff", href: "staff.html", label: "Staff", icon: "idCard", require: "staff:read" },
    { key: "staff-attendance", href: "staff-attendance.html", label: "Attendance", icon: "inout", require: "staff:read" },
    { key: "staff-salary", href: "staff-salary.html", label: "Salary Details", icon: "wallet", require: "staff:read" },
    { key: "staff-reports", href: "staff-reports.html", label: "Reports", icon: "trendingUp", require: "staff:read" },
    { section: "Rooms" },
    { key: "rooms", href: "rooms.html", label: "Room List", icon: "bed", require: "rooms:read" },
    { key: "eb-billing", href: "eb-billing.html", label: "EB Bill Sharing", icon: "bolt", require: "rooms:read" },
    { section: "Admin" },
    { key: "admin-expenses", href: "admin-expenses.html", label: "Expenses", icon: "wallet", require: "admin:read" },
    { key: "legal-compliance", href: "legal-compliance.html", label: "Legal Compliance", icon: "shield", require: "admin:read" },
    { key: "vehicle-management", href: "vehicle-management.html", label: "Vehicle Management", icon: "car", require: "admin:read" },
    { section: "Settings" },
    { key: "settings", href: "settings.html", label: "Settings", icon: "settings", require: "settings:read" },
    { key: "roles", href: "roles.html", label: "Roles & Permissions", icon: "shield", require: "roles:read" },
    { key: "profile", href: "profile.html", label: "My Profile", icon: "userCircle" }
  ];

  function buildSidebarHtml(activeKey) {
    var html = '<div class="sidebar-brand"><div class="brand-mark">HH</div><div class="brand-text"><strong>HostelHub</strong><span>Campus Residence Console</span></div></div>';
    html += '<nav class="sidebar-nav">';
    NAV_ITEMS.forEach(function (item) {
      if (item.section) { html += '<div class="nav-section-label">' + item.section + '</div>'; return; }
      var activeCls = item.key === activeKey ? " active" : "";
      var req = item.require ? ' data-require="' + item.require + '"' : "";
      html += '<a class="nav-item' + activeCls + '" href="' + item.href + '"' + req + '>' + svg(item.icon) + '<span>' + item.label + '</span></a>';
    });
    html += '<button class="nav-item logout-item" data-logout>' + svg("logout") + '<span>Logout</span></button>';
    html += '</nav>';
    html += '<div class="sidebar-footer" id="sidebarFooter"></div>';
    return html;
  }

  function buildTopbarHtml(title, subtitle) {
    return '' +
      '<div class="topbar-left">' +
      '<button class="menu-toggle" id="menuToggle">' + svg("menu2") + '</button>' +
      '<div class="page-title-block"><h1>' + title + '</h1>' + (subtitle ? '<p>' + subtitle + '</p>' : "") + '</div>' +
      '</div>' +
      '<div class="topbar-right">' +
      '<a class="icon-btn" href="missing-alerts.html" title="Alerts">' + svg("bell") + '</a>' +
      '<a class="topbar-user" href="profile.html">' +
      '<div class="who"><strong id="topbarUserName"></strong><span id="topbarUserRole"></span></div>' +
      '<div class="avatar" id="topbarAvatar"></div>' +
      '</a>' +
      '</div>';
  }

  function initials(name) {
    if (!name) return "?";
    var parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
  }

  function initUserBadge() {
    var user = getCurrentUser();
    var role = getCurrentRole();
    if (!user) return;
    var nameEls = document.querySelectorAll("#topbarUserName, [data-user-name]");
    nameEls.forEach(function (el) { el.textContent = user.name; });
    var roleEls = document.querySelectorAll("#topbarUserRole, [data-user-role]");
    roleEls.forEach(function (el) { el.textContent = role ? role.name : ""; });
    var avatarEls = document.querySelectorAll("#topbarAvatar, [data-user-initial]");
    avatarEls.forEach(function (el) { el.textContent = initials(user.name); });
    var footer = document.getElementById("sidebarFooter");
    if (footer) {
      footer.innerHTML = '<div class="avatar">' + initials(user.name) + '</div><div class="who"><strong>' + user.name + '</strong><span>' + (role ? role.name : "") + '</span></div>';
    }
  }

  function initSidebar() {
    var sidebar = document.getElementById("sidebar");
    var backdrop = document.querySelector(".sidebar-backdrop");
    var toggle = document.getElementById("menuToggle");
    function close() { sidebar.classList.remove("open"); backdrop.classList.remove("show"); }
    function open() { sidebar.classList.add("open"); backdrop.classList.add("show"); }
    if (toggle) toggle.addEventListener("click", function () { sidebar.classList.contains("open") ? close() : open(); });
    if (backdrop) backdrop.addEventListener("click", close);
    sidebar.querySelectorAll(".nav-item[href]").forEach(function (a) { a.addEventListener("click", close); });
  }
  function initLogout() {
    document.querySelectorAll("[data-logout]").forEach(function (btn) { btn.addEventListener("click", logout); });
  }

  function renderShell(opts) {
    var user = getCurrentUser();
    if (!user) return;
    var sidebar = document.getElementById("sidebar");
    var topbar = document.getElementById("topbar");
    if (sidebar) sidebar.innerHTML = buildSidebarHtml(opts.active);
    if (topbar) topbar.innerHTML = buildTopbarHtml(opts.title, opts.subtitle);
    initSidebar();
    initLogout();
    initUserBadge();
    applyRoleVisibility();
  }

  function tabsHtml(tabs, activeKey) {
    return '<div class="page-tabs">' + tabs.map(function (t) {
      return '<a class="page-tab' + (t.key === activeKey ? " active" : "") + '" href="' + t.href + '">' + t.label + '</a>';
    }).join("") + '</div>';
  }

  /* ---------------- Toast ---------------- */
  function showToast(message, isError) {
    var el = document.getElementById("appToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "appToast";
      el.className = "toast-notice";
      document.body.appendChild(el);
    }
    el.innerHTML = (isError ? svg("xCircle") : svg("checkCircle")) + "<span>" + message + "</span>";
    el.className = "toast-notice" + (isError ? " error" : "");
    requestAnimationFrame(function () { el.classList.add("show"); });
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove("show"); }, 2600);
  }

  /* ---------------- Action menu positioning ---------------- */
  function positionActionMenu(id) {
    var menu = document.querySelector('[data-menu="' + id + '"]');
    var trigger = document.querySelector('[data-menu-toggle="' + id + '"]');
    if (!menu || !trigger) return;
    var rect = trigger.getBoundingClientRect();
    var menuHeight = menu.offsetHeight || 140;
    var spaceBelow = window.innerHeight - rect.bottom;
    var top = spaceBelow < menuHeight ? rect.top - menuHeight - 6 : rect.bottom + 6;
    var left = Math.min(rect.right - menu.offsetWidth, window.innerWidth - menu.offsetWidth - 10);
    menu.style.top = Math.max(8, top) + "px";
    menu.style.left = Math.max(8, left) + "px";
  }
  document.addEventListener("click", function (e) {
    var openMenu = document.querySelector(".action-menu.show");
    var toggleBtn = e.target.closest("[data-menu-toggle]");
    if (openMenu && (!toggleBtn || toggleBtn.getAttribute("data-menu-toggle") !== openMenu.getAttribute("data-menu"))) {
      openMenu.classList.remove("show");
    }
    if (toggleBtn) {
      var id = toggleBtn.getAttribute("data-menu-toggle");
      var menu = document.querySelector('[data-menu="' + id + '"]');
      if (menu) {
        var willShow = !menu.classList.contains("show");
        document.querySelectorAll(".action-menu.show").forEach(function (m) { m.classList.remove("show"); });
        if (willShow) { menu.classList.add("show"); positionActionMenu(id); menu._openedAt = Date.now(); }
      }
    }
  });
  window.addEventListener("scroll", function () {
    var openMenu = document.querySelector(".action-menu.show");
    if (openMenu && Date.now() - (openMenu._openedAt || 0) > 250) {
      openMenu.classList.remove("show");
    }
  }, true);

  /* ---------------- Pagination ---------------- */
  function paginate(list, page, pageSize) {
    var start = (page - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }

  function renderPagination(container, opts) {
    if (!container) return;
    var pageSize = opts.pageSize || 10;
    var total = opts.total || 0;
    var totalPages = Math.max(1, Math.ceil(total / pageSize));
    var page = Math.min(Math.max(1, opts.page || 1), totalPages);
    var start = total === 0 ? 0 : (page - 1) * pageSize + 1;
    var end = Math.min(page * pageSize, total);

    function pageBtn(p, label, active, disabled) {
      return '<button type="button" class="pg-btn' + (active ? ' active' : '') + '" data-pg="' + p + '"' + (disabled ? ' disabled' : '') + '>' + label + '</button>';
    }

    var pages = [];
    var windowSize = 5;
    if (totalPages <= windowSize + 2) {
      for (var i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      var lo = Math.max(2, page - 1), hi = Math.min(totalPages - 1, page + 1);
      if (lo > 2) pages.push("…");
      for (var j = lo; j <= hi; j++) pages.push(j);
      if (hi < totalPages - 1) pages.push("…");
      pages.push(totalPages);
    }

    var btns = pageBtn(page - 1, "‹", false, page === 1);
    btns += pages.map(function (p) {
      return p === "…" ? '<span style="padding:0 4px;color:var(--muted-2);font-size:12.5px;">…</span>' : pageBtn(p, p, p === page, false);
    }).join("");
    btns += pageBtn(page + 1, "›", false, page === totalPages);

    container.innerHTML =
      '<span class="toolbar-meta">' + (total === 0 ? "No records" : "Showing " + start + "–" + end + " of " + total) + '</span>' +
      '<div class="pg-btns">' + btns + '</div>';

    container.querySelectorAll("[data-pg]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var p = parseInt(btn.getAttribute("data-pg"), 10);
        if (p >= 1 && p <= totalPages && p !== page && typeof opts.onChange === "function") opts.onChange(p);
      });
    });

    return page;
  }

  /* ---------------- Table sorting ---------------- */
  function makeSortState(defaultKey, defaultDir) {
    return { key: defaultKey || null, dir: defaultDir || "asc" };
  }

  function sortRows(rows, state, accessors) {
    if (!state || !state.key) return rows;
    var getter = accessors && accessors[state.key];
    var indexed = rows.map(function (r, i) { return { r: r, i: i }; });
    indexed.sort(function (a, b) {
      var av = getter ? getter(a.r) : a.r[state.key];
      var bv = getter ? getter(b.r) : b.r[state.key];
      if (av === null || av === undefined) av = "";
      if (bv === null || bv === undefined) bv = "";
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      var cmp = av < bv ? -1 : av > bv ? 1 : 0;
      if (cmp === 0) cmp = a.i - b.i;
      return state.dir === "asc" ? cmp : -cmp;
    });
    return indexed.map(function (x) { return x.r; });
  }

  function bindSortableTable(thead, state, onChange) {
    if (!thead) return;
    thead.querySelectorAll("[data-sort]").forEach(function (th) {
      th.classList.add("sortable-th");
      if (!th._sortBound) {
        th._sortBound = true;
        th.addEventListener("click", function () {
          var key = th.getAttribute("data-sort");
          if (state.key === key) { state.dir = state.dir === "asc" ? "desc" : "asc"; }
          else { state.key = key; state.dir = "asc"; }
          onChange();
        });
      }
      th.classList.remove("sort-asc", "sort-desc");
      if (th.getAttribute("data-sort") === state.key) th.classList.add(state.dir === "asc" ? "sort-asc" : "sort-desc");
    });
  }

  /* ---------------- Month calendar ---------------- */
  function pad2(n) { return n < 10 ? "0" + n : "" + n; }
  var DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function renderMonthCalendar(container, opts) {
    if (!container) return;
    var year = opts.year, month = opts.month;
    var first = new Date(year, month, 1);
    var startWeekday = first.getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var monthLabel = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    var todayIso = D.isoDate(new Date());

    var cells = [];
    for (var i = 0; i < startWeekday; i++) cells.push('<div class="cal-cell empty"></div>');
    for (var d = 1; d <= daysInMonth; d++) {
      var dateIso = year + "-" + pad2(month + 1) + "-" + pad2(d);
      var content = opts.getDayContent ? (opts.getDayContent(dateIso, d) || "") : "";
      cells.push('<div class="cal-cell' + (dateIso === todayIso ? " today" : "") + '"><span class="cal-daynum">' + d + '</span>' + content + '</div>');
    }

    container.innerHTML =
      '<div class="cal-header">' +
        '<button type="button" class="btn btn-outline btn-sm" data-cal-nav="prev">' + svg("arrowLeft") + '</button>' +
        '<strong>' + monthLabel + '</strong>' +
        '<button type="button" class="btn btn-outline btn-sm" data-cal-nav="next">' + svg("arrowRight") + '</button>' +
      '</div>' +
      '<div class="cal-grid cal-dow">' + DOW_LABELS.map(function (x) { return '<div class="cal-dow-cell">' + x + '</div>'; }).join("") + '</div>' +
      '<div class="cal-grid">' + cells.join("") + '</div>';

    container.querySelector('[data-cal-nav="prev"]').addEventListener("click", function () {
      var m = month - 1, y = year;
      if (m < 0) { m = 11; y--; }
      opts.onNav(y, m);
    });
    container.querySelector('[data-cal-nav="next"]').addEventListener("click", function () {
      var m = month + 1, y = year;
      if (m > 11) { m = 0; y++; }
      opts.onNav(y, m);
    });
  }

  window.App = {
    isLoggedIn: isLoggedIn, login: login, logout: logout, requireAuth: requireAuth,
    getCurrentUser: getCurrentUser, getCurrentRole: getCurrentRole, isAdmin: isAdmin, can: can,
    guardPermission: guardPermission, guardAdminOnly: guardAdminOnly, applyRoleVisibility: applyRoleVisibility,
    renderShell: renderShell, tabsHtml: tabsHtml, svg: svg, icons: ICONS, initials: initials,
    showToast: showToast, positionActionMenu: positionActionMenu,
    paginate: paginate, renderPagination: renderPagination,
    makeSortState: makeSortState, sortRows: sortRows, bindSortableTable: bindSortableTable,
    renderMonthCalendar: renderMonthCalendar
  };
})();
