/* ==========================================================================
   Experion Robotics Academy — application logic
   Depends on data.js (loaded first). No content lives in this file.
   ========================================================================== */
(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var gaugeHTML = function (l) {
    return '<span class="gauge g' + l + '"><b></b><b></b><b></b><b></b></span>';
  };

  // Grade number -> matrix year id. The ladder runs 1-9; modules run 1-8.
  var GRADE_YEAR = { 1:"pyp1", 2:"pyp2", 3:"pyp3", 4:"pyp4", 5:"pyp5",
                     6:"myp1", 7:"myp2", 8:"myp3", 9:"myp4" };

  /* ---------------------------------------------------------------- motion */

  // Stagger helper: sets --d on a list of nodes, capped so long lists stay snappy.
  function stagger(nodes, step, max) {
    if (REDUCED) { nodes.forEach(function (n) { n.style.setProperty("--d", "0ms"); }); return; }
    step = step || 40; max = max || 900;
    nodes.forEach(function (n, i) {
      n.style.setProperty("--d", Math.min(i * step, max) + "ms");
    });
  }

  // Reveal-on-scroll for anything tagged .reveal
  var revealObserver = null;
  function initReveal() {
    if (REDUCED || !("IntersectionObserver" in window)) return;
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); revealObserver.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
  }

  var REVEAL_SELECTOR = [
    ".model", ".phases li", ".setup li", ".reqs article",
    ".outputs article", ".beats li", ".sub-h", ".kit-sub"
  ].join(",");

  // Only tag elements that are genuinely on screen. Anything inside a hidden
  // panel is left alone until that panel opens, otherwise it sits at opacity 0
  // with an observer that may never fire.
  function revealIn(root) {
    if (!root || root.hidden) return;
    var nodes = $$(REVEAL_SELECTOR, root).filter(function (n) { return !n.dataset.rv; });
    if (!nodes.length) return;
    nodes.forEach(function (n) { n.dataset.rv = "1"; });
    if (REDUCED || !revealObserver) { nodes.forEach(function (n) { n.classList.add("in"); }); return; }
    nodes.forEach(function (n) { n.classList.add("reveal"); });
    var groups = {};
    nodes.forEach(function (n) {
      var k = n.parentNode ? String(n.parentNode.className || "root") : "root";
      (groups[k] = groups[k] || []).push(n);
    });
    Object.keys(groups).forEach(function (k) { stagger(groups[k], 70, 480); });
    nodes.forEach(function (n) { revealObserver.observe(n); });
    // Safety net: nothing stays invisible longer than a second.
    setTimeout(function () { nodes.forEach(function (n) { n.classList.add("in"); }); }, 1000);
  }

  // Scroll progress bar
  function initProgress() {
    if (REDUCED) return;
    var bar = document.createElement("div");
    bar.className = "progress";
    document.body.appendChild(bar);
    var ticking = false;
    function update() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? Math.min(window.scrollY / h, 1) : 0;
      bar.style.transform = "scaleX(" + p + ")";
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  // Count a number up from zero
  function countUp(el, target, ms) {
    if (REDUCED) { el.textContent = target; return; }
    var start = performance.now();
    function frame(now) {
      var t = Math.min((now - start) / (ms || 650), 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased);
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------- curriculum */

  function buildMatrix() {
    var h = '<div class="hcell corner"><span class="phase-tag">Strand</span></div>';
    YEARS.forEach(function (y) {
      h += '<div class="hcell ' + y.phase + '" data-col="' + y.id + '">' +
           '<div class="yr">' + y.label + '</div><div class="gr">' + y.grade + '</div></div>';
    });
    STRANDS.forEach(function (s) {
      h += '<button class="sname" data-strand="' + s.id + '" type="button">' +
           '<strong>' + s.name + '</strong><small>' + s.note + '</small></button>';
      YEARS.forEach(function (y) {
        var c = s.cells[y.id];
        if (!c) { h += '<div class="void" data-col="' + y.id + '" aria-hidden="true"></div>'; return; }
        h += '<button class="cell lv' + c.lvl + '" type="button" data-col="' + y.id +
             '" data-strand="' + s.id + '" data-year="' + y.id + '" ' +
             'aria-label="' + s.name + ', ' + y.label + ', ' + LVL[c.lvl] + ': ' + c.key + '">' +
             '<span class="key">' + c.key + '</span>' + gaugeHTML(c.lvl) + '</button>';
      });
    });
    $("#matrix").innerHTML = h;
  }

  // Diagonal cascade: cells arrive left-to-right, so the ladder reads as it builds.
  var cascaded = false;
  function cascadeMatrix(force) {
    if (REDUCED) return;
    if (cascaded && !force) return;
    cascaded = true;
    var cols = {}; YEARS.forEach(function (y, i) { cols[y.id] = i; });
    $$("#matrix .hcell, #matrix .sname, #matrix .cell, #matrix .void").forEach(function (n) {
      n.classList.remove("cascade");
      var col = n.dataset.col ? cols[n.dataset.col] + 1 : 0;
      var row = 0, p = n;
      // row index = position of its strand block
      if (n.dataset.strand) {
        row = STRANDS.findIndex(function (s) { return s.id === n.dataset.strand; });
      } else if (n.classList.contains("void")) {
        row = 4;
      }
      n.style.setProperty("--d", Math.min(col * 46 + row * 26, 1100) + "ms");
      void n.offsetWidth;                     // restart the animation
      n.classList.add("cascade");
    });
  }

  function buildSpec() {
    var rows = SPEC.map(function (r) {
      return '<tr class="' + (r.proposed ? "proposed" : "") + '">' +
        '<td class="gcell"><b>' + r.grade + '</b><em>' + r.age + ' yrs</em>' +
        '<span class="myp">' + r.myp + '</span>' +
        (r.proposed ? '<span class="flagged">Proposed</span>' : "") + "</td>" +
        '<td><div class="tags">' + r.tech.map(function (t) { return '<span class="tag">' + t + "</span>"; }).join("") + "</div></td>" +
        '<td><div class="tags">' + r.ctrl.map(function (t) { return '<span class="tag ctrl">' + t + "</span>"; }).join("") + "</div></td>" +
        '<td><div class="tags">' + r.kits.map(function (t) { return '<span class="tag kit">' + t + "</span>"; }).join("") + "</div></td>" +
        '<td class="num">' + r.m + '</td><td class="num">' + r.p + '</td><td class="num">' + r.c + "</td></tr>";
    }).join("");
    $("#specview").innerHTML =
      '<table class="tech"><thead><tr><th>Grade</th><th>Technologies covered</th>' +
      '<th>Key controllers</th><th>DIY / platform kits</th><th class="num">Modules</th>' +
      '<th class="num">Projects</th><th class="num">Capstones</th></tr></thead><tbody>' +
      rows + "</tbody></table>";
  }

  function buildToolkit() {
    var cls = function (t) {
      return t === "DIY Kit" ? "type-kit" : (t === "Controller" ? "type-controller" : "type-platform");
    };
    var hw = TOOLKIT.map(function (t) {
      return '<tr><td><span class="tool-name">' + t.name + "</span></td>" +
        '<td><span class="tag ' + cls(t.type) + '">' + t.type + "</span></td>" +
        '<td class="desc">' + t.desc + "</td>" +
        '<td class="grades">' + (t.inf
          ? '<span class="inf" title="Inferred from the grade framework — confirm">' + t.grades + "</span>"
          : t.grades) + "</td></tr>";
    }).join("");

    var sw = SOFTWARE.map(function (s) {
      return '<tr><td><a class="tool-name" href="' + s.u + '" target="_blank" rel="noopener">' + s.n + "</a></td>" +
        '<td class="desc">' + s.d + "</td>" +
        '<td class="grades">' + s.g + "</td>" +
        '<td><span class="tag cost">' + s.c + "</span></td></tr>";
    }).join("");

    var partners = PARTNERS.map(function (p) {
      return '<h3 class="kit-sub">' + p.brand +
        ' <a class="site-link" href="' + p.site + '" target="_blank" rel="noopener">schools programme &rarr;</a></h3>' +
        '<table class="tech"><thead><tr><th>Kit</th><th>What it covers</th>' +
        '<th class="num">Grades</th></tr></thead><tbody>' +
        p.items.map(function (i) {
          return '<tr><td><a class="tool-name" href="' + i.u + '" target="_blank" rel="noopener">' + i.n + "</a></td>" +
            '<td class="desc">' + i.d + "</td><td class=\"grades\">" + i.g + "</td></tr>";
        }).join("") + "</tbody></table>";
    }).join("");

    $("#kitview").innerHTML =
      '<h3 class="kit-sub first">Software</h3>' +
      '<p class="kit-note">Every tool below is free or free for schools. There are no per-seat software licences anywhere in the programme.</p>' +
      '<table class="tech"><thead><tr><th>Tool</th><th>What it\'s for</th>' +
      '<th class="num">Grades</th><th>Cost</th></tr></thead><tbody>' + sw + "</tbody></table>" +
      '<h3 class="kit-sub">Controllers and boards</h3>' +
      '<table class="tech"><thead><tr><th>Tool</th><th>Type</th><th>What it is</th>' +
      '<th class="num">Grades</th></tr></thead><tbody>' + hw + "</tbody></table>" +
      '<p class="also"><b>Also in the lab</b>' + ALSO.join(" · ") + "</p>" +
      '<h3 class="kit-sub">Kit partners</h3>' +
      '<p class="kit-note">Ready-made classroom kits mapped to the modules they serve. Both suppliers run school programmes with curriculum and trainer support alongside the hardware.</p>' +
      partners;
  }

  // Rows animate only once their panel is genuinely on screen.
  function animateRows(root) {
    if (!root) return;
    $$("table.tech tbody tr", root).forEach(function (tr, i) {
      tr.style.setProperty("--d", REDUCED ? "0ms" : Math.min(i * 30, 480) + "ms");
    });
    root.classList.remove("animate-rows");
    void root.offsetWidth;
    if (!REDUCED) root.classList.add("animate-rows");
  }

  /* -------------------------------------------------------------- the rail */

  var rail, railYr, railTitle, railLvl, railContent, lastFocus = null;

  function syncRailHeight() {
    document.body.style.setProperty("--rail-h",
      rail.classList.contains("open") ? rail.offsetHeight + "px" : "0px");
  }
  function openRail()  { rail.classList.add("open"); requestAnimationFrame(syncRailHeight); }
  function closeRail() {
    rail.classList.remove("open");
    document.body.style.setProperty("--rail-h", "0px");
    $$(".is-on").forEach(function (n) { n.classList.remove("is-on"); });
    $$(".row-lit").forEach(function (n) { n.classList.remove("row-lit"); });
    if (lastFocus) { lastFocus.focus(); lastFocus = null; }
  }

  function showCell(strandId, yearId, node) {
    var s = STRANDS.find(function (x) { return x.id === strandId; });
    var y = YEARS.find(function (x) { return x.id === yearId; });
    var c = s.cells[yearId];
    $$(".is-on").forEach(function (n) { n.classList.remove("is-on"); });
    $$(".row-lit").forEach(function (n) { n.classList.remove("row-lit"); });
    node.classList.add("is-on");
    railYr.textContent = y.label + " · " + y.grade;
    railTitle.textContent = s.name;
    railLvl.textContent = LVL[c.lvl];
    railContent.innerHTML =
      '<div class="rail-body">' +
      "<div><h4>What they do</h4><p>" + c.what + "</p></div>" +
      "<div><h4>Tools</h4><p>" + c.tools + "</p></div>" +
      '<div><h4>By the end</h4><p class="out">' + c.out + "</p></div></div>";
    openRail();
  }

  function showStrand(strandId) {
    var s = STRANDS.find(function (x) { return x.id === strandId; });
    $$(".is-on").forEach(function (n) { n.classList.remove("is-on"); });
    $$(".row-lit").forEach(function (n) { n.classList.remove("row-lit"); });
    $$('.cell[data-strand="' + strandId + '"]').forEach(function (n) { n.classList.add("row-lit"); });
    var first = YEARS.find(function (y) { return s.cells[y.id]; });
    var last  = YEARS.slice().reverse().find(function (y) { return s.cells[y.id]; });
    railYr.textContent = first.label + " → " + last.label;
    railTitle.textContent = s.name;
    railLvl.textContent = "Full progression";
    railContent.innerHTML = '<div class="prog">' + YEARS.map(function (y) {
      var c = s.cells[y.id];
      return c
        ? '<div class="chip"><em>' + y.label + "</em><span>" + c.key + "</span></div>"
        : '<div class="chip none"><em>' + y.label + "</em><span>—</span></div>";
    }).join("") + "</div>";
    openRail();
    var chips = $$(".chip", railContent);
    chips.forEach(function (ch, i) {
      if (REDUCED) ch.classList.add("show");
      else setTimeout(function () { ch.classList.add("show"); }, i * 55);
    });
    setTimeout(syncRailHeight, 60);
  }

  /* ------------------------------------------------ by grade (merged view) */

  function renderGrade(n) {
    var g = MGRADES.find(function (x) { return x.n === n; });
    var yid = GRADE_YEAR[n];
    var yr = YEARS.find(function (y) { return y.id === yid; });
    var mods = MODULES[String(n)] || [];

    $$(".gchip").forEach(function (c) {
      var gg = MGRADES.find(function (x) { return x.n === Number(c.dataset.g); });
      c.setAttribute("aria-selected", String(Number(c.dataset.g) === n));
      c.style.setProperty("--gcol", gg.color);
    });

    var running = STRANDS.filter(function (s) { return s.cells[yid]; });
    var strip = running.map(function (s) {
      var c = s.cells[yid];
      return '<div class="sstrip-item">' + gaugeHTML(c.lvl) +
             "<div><b>" + s.name + "</b><span>" + c.key + "</span></div></div>";
    }).join("");

    var stats = mods.length
      ? '<b data-n="' + mods.length + '">0</b> modules &nbsp;&middot;&nbsp; ' +
        '<b data-n="' + (mods.length * 2) + '">0</b> projects &nbsp;&middot;&nbsp; ' +
        '<b data-n="' + mods.length + '">0</b> challenges'
      : '<b data-n="' + running.length + '">0</b> strands running';

    var cards = mods.length
      ? '<div class="mgrid">' + mods.map(function (m) {
          return '<article class="mcard">' +
            '<div class="mtop"><h4>' + m.name + '</h4><span class="mcat">' + m.cat + "</span></div>" +
            '<p class="mtool">' + m.tool + "</p>" +
            '<div class="mbody"><div><h5>What they do</h5><ul>' +
            m.acts.map(function (a) { return "<li>" + a + "</li>"; }).join("") +
            "</ul></div><div><h5>By the end</h5><ul>" +
            m.objs.map(function (o) { return "<li>" + o + "</li>"; }).join("") +
            "</ul></div></div></article>";
        }).join("") + "</div>"
      : '<p class="gnote">The module catalogue runs to Grade 8. Grade 9 carries every strand above at Extend level and feeds straight into the Grade 10 capstone year &mdash; its modules are written per cohort, around the projects students choose.</p>';

    var panel = $("#gpanel");
    panel.style.setProperty("--gcol", g.color);
    panel.innerHTML =
      '<div class="ghead"><h3>Grade ' + g.n + "</h3>" +
      '<span class="gage">' + yr.label + " &middot; Ages " + g.age + "</span>" +
      '<span class="gstats">' + stats + "</span></div>" +
      '<div class="sstrip"><h5>Strands running this year</h5>' +
      '<div class="sstrip-row">' + strip + "</div></div>" + cards;

    stagger($$(".mcard", panel), 55, 700);
    stagger($$(".sstrip-item", panel), 45, 400);
    $$(".gstats b", panel).forEach(function (b, i) {
      setTimeout(function () { countUp(b, Number(b.dataset.n)); }, 180 + i * 90);
    });
  }

  function buildChips() {
    var wrap = $("#gchips");
    wrap.innerHTML = MGRADES.map(function (g) {
      return '<button type="button" class="gchip" data-g="' + g.n + '" role="tab" ' +
             'aria-selected="false" style="--gcol:' + g.color + '">Grade ' + g.n + "</button>";
    }).join("");
    wrap.addEventListener("click", function (e) {
      var b = e.target.closest(".gchip");
      if (b) renderGrade(Number(b.dataset.g));
    });
    renderGrade(1);
  }

  /* ------------------------------------------------------------- controls */

  var phase = "all";
  function applyPhase() {
    YEARS.forEach(function (y) {
      var off = phase !== "all" && y.phase !== phase;
      $$('[data-col="' + y.id + '"]').forEach(function (n) { n.classList.toggle("dim", off); });
    });
  }

  var VIEWS = { map: "mapview", grade: "gradeview", spec: "specview", kit: "kitview" };
  var HINTS = {
    map:   "Select any square to see what that year covers. Select a strand name to walk its full progression.",
    grade: "One grade at a time \u2014 the strands running that year, then every module a child meets.",
    spec:  "Technology stack, hardware and workload per grade. Grade 9 is proposed; the rest is the running framework.",
    kit:   "The software and hardware students put their hands on, and the grades each one serves."
  };
  var TABS = { curriculum: "tab-curriculum", deploy: "tab-deploy", classroom: "tab-classroom" };

  function showView(v) {
    Object.keys(VIEWS).forEach(function (k) { $("#" + VIEWS[k]).hidden = k !== v; });
    $("#hint").textContent = HINTS[v];
    $("#phasewrap").hidden = v !== "map";
    $("#depthwrap").hidden = (v !== "map" && v !== "grade");
    closeRail();
    if (v === "map") cascadeMatrix(true);
    if (v === "grade") {
      var sel = $('.gchip[aria-selected="true"]');
      renderGrade(sel ? Number(sel.dataset.g) : 1);
    }
    if (v === "spec" || v === "kit") {
      var el = $("#" + VIEWS[v]); revealIn(el); animateRows(el);
    }
  }

  /* ----------------------------------------------------------------- init */

  function init() {
    rail = $("#rail"); railYr = $("#railYr"); railTitle = $("#railTitle");
    railLvl = $("#railLvl"); railContent = $("#railContent");

    buildMatrix(); buildSpec(); buildToolkit(); buildChips();
    initReveal(); initProgress();

    document.addEventListener("click", function (e) {
      var cell = e.target.closest(".cell");
      if (cell) { lastFocus = cell; showCell(cell.dataset.strand, cell.dataset.year, cell); return; }
      var sn = e.target.closest(".sname");
      if (sn) { lastFocus = sn; showStrand(sn.dataset.strand); }
    });
    $("#railClose").addEventListener("click", closeRail);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && rail.classList.contains("open")) closeRail();
    });
    window.addEventListener("resize", syncRailHeight);

    $$("[data-phase]").forEach(function (b) {
      b.addEventListener("click", function () {
        phase = b.dataset.phase;
        $$("[data-phase]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        applyPhase();
      });
    });

    $$("[data-view]").forEach(function (b) {
      b.addEventListener("click", function () {
        $$("[data-view]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        showView(b.dataset.view);
      });
    });

    // Nothing opens until a section is chosen \u2014 the story is the landing.
    $$(".tab").forEach(function (b) {
      b.addEventListener("click", function () {
        var t = b.dataset.tab;
        var already = b.getAttribute("aria-selected") === "true";
        $$(".tab").forEach(function (x) { x.setAttribute("aria-selected", String(x === b)); });
        Object.keys(TABS).forEach(function (k) { $("#" + TABS[k]).hidden = k !== t; });
        $("#pick").classList.add("gone");
        closeRail();
        var panel = $("#" + TABS[t]);
        revealIn(panel);
        if (t === "curriculum") {
          var on = $$('[data-view][aria-pressed="true"]')[0];
          if (!on) { on = $('[data-view="map"]'); on.setAttribute("aria-pressed", "true"); }
          showView(on.dataset.view);
        } else {
          animateRows(panel);
        }
        if (!already) {
          var y = $("#sections").getBoundingClientRect().top + window.scrollY - 14;
          window.scrollTo({ top: y, behavior: REDUCED ? "auto" : "smooth" });
        }
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
