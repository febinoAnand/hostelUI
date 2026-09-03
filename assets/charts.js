/* ============================================================
   HostelHub — Custom SVG chart renderers (no external library)
   ============================================================ */
(function () {
  "use strict";

  var PALETTE = ["#4f46e5", "#06b6d4", "#059669", "#d97706", "#db2777", "#475569", "#7c3aed", "#dc2626"];

  function fmtCompact(n) {
    n = Math.abs(n) < 1 ? 0 : n;
    var sign = n < 0 ? "-" : "";
    n = Math.abs(n);
    if (n >= 1e7) return sign + (n / 1e7).toFixed(1).replace(/\.0$/, "") + "Cr";
    if (n >= 1e5) return sign + (n / 1e5).toFixed(1).replace(/\.0$/, "") + "L";
    if (n >= 1e3) return sign + (n / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
    return sign + Math.round(n);
  }

  function renderBarChart(container, items, opts) {
    opts = opts || {};
    var fmt = opts.formatValue || function (v) { return v; };
    var max = Math.max.apply(null, items.map(function (i) { return i.value; }).concat([0]));
    if (!max) {
      container.innerHTML = '<div class="empty-state compact"><p>No data yet.</p></div>';
      return;
    }
    container.innerHTML = '<div class="chart-bar-wrap">' + items.map(function (i) {
      var pct = Math.max((i.value / max) * 100, 2);
      return '<div class="bar-col">' +
        '<div class="bar-value">' + fmt(i.value) + '</div>' +
        '<div class="bar-fill" style="height:' + pct + '%"></div>' +
        '<div class="bar-label">' + i.label + '</div>' +
        '</div>';
    }).join("") + '</div>';
  }

  function renderDonutChart(container, items, opts) {
    opts = opts || {};
    var size = opts.size || 160, stroke = opts.stroke || 22;
    var fmt = opts.formatValue || function (v) { return v; };
    var total = items.reduce(function (a, i) { return a + i.value; }, 0);
    if (!total) {
      container.innerHTML = '<div class="empty-state compact"><p>No data yet.</p></div>';
      return;
    }
    var r = (size - stroke) / 2;
    var circumference = 2 * Math.PI * r;
    var offset = 0;
    var segs = items.map(function (i, idx) {
      var color = i.color || PALETTE[idx % PALETTE.length];
      var frac = i.value / total;
      var len = frac * circumference;
      var seg = '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="' + stroke +
        '" stroke-dasharray="' + len + ' ' + (circumference - len) + '" stroke-dashoffset="' + (-offset) + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')" />';
      offset += len;
      return seg;
    }).join("");
    var legend = items.map(function (i, idx) {
      var color = i.color || PALETTE[idx % PALETTE.length];
      return '<div class="donut-legend-row"><span class="donut-legend-dot" style="background:' + color + '"></span>' + i.label + '<strong>' + fmt(i.value) + '</strong></div>';
    }).join("");
    container.innerHTML = '<div class="donut-wrap">' +
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' + segs +
      '<text x="50%" y="47%" text-anchor="middle" class="donut-center-value" dy=".3em">' + fmt(total) + '</text>' +
      '<text x="50%" y="63%" text-anchor="middle" class="donut-center-label">' + (opts.centerLabel || "Total") + '</text>' +
      '</svg>' +
      '<div class="donut-legend">' + legend + '</div>' +
      '</div>';
  }

  function ringColor(percent, override) {
    if (override) return override;
    if (percent >= 80) return "#059669";
    if (percent >= 40) return "#d97706";
    return "#dc2626";
  }

  function renderProgressRing(container, percent, opts) {
    opts = opts || {};
    percent = Math.max(0, Math.min(100, percent));
    var size = opts.size || 96, stroke = opts.stroke || 10;
    var color = ringColor(percent, opts.color);
    var r = (size - stroke) / 2;
    var circumference = 2 * Math.PI * r;
    var len = (percent / 100) * circumference;
    container.innerHTML = '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--surface-3)" stroke-width="' + stroke + '" />' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="' + stroke +
      '" stroke-linecap="round" stroke-dasharray="' + len + ' ' + (circumference - len) + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')" />' +
      '<text x="50%" y="52%" text-anchor="middle" class="progress-ring-value" dy=".3em">' + Math.round(percent) + '%</text>' +
      '</svg>';
  }

  function renderProgressBar(container, percent, opts) {
    opts = opts || {};
    percent = Math.max(0, Math.min(100, percent));
    var color = ringColor(percent, opts.color);
    if (opts.mini) {
      container.innerHTML = '<div class="progress-mini"><div class="progress-bar-track"><div class="progress-bar-fill" style="width:' + percent + '%;background:' + color + '"></div></div><span>' + Math.round(percent) + '%</span></div>';
      return;
    }
    container.innerHTML =
      '<div class="progress-bar-row"><span>' + (opts.label || "") + '</span><span>' + Math.round(percent) + '%</span></div>' +
      '<div class="progress-bar-track"><div class="progress-bar-fill" style="width:' + percent + '%;background:' + color + '"></div></div>' +
      (opts.metaText ? '<div class="progress-bar-meta">' + opts.metaText + '</div>' : '');
  }

  window.Charts = {
    fmtCompact: fmtCompact,
    renderBarChart: renderBarChart,
    renderDonutChart: renderDonutChart,
    renderProgressRing: renderProgressRing,
    renderProgressBar: renderProgressBar,
    PALETTE: PALETTE
  };
})();
