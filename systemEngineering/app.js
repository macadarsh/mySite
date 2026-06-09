(function () {
  "use strict";

  var chapters = (window.SE_CHAPTERS || []).slice().sort(function (a, b) { return a.no - b.no; });
  var META = window.SE_META || {};
  var TOPICS = META.specialTopics || [];
  var PODS = META.podcasts || {};
  var byId = {}, topicById = {};
  chapters.forEach(function (c) { byId[c.id] = c; });
  TOPICS.forEach(function (t) { topicById[t.id] = t; });

  var content = document.getElementById("content");
  var rightRail = document.getElementById("right-rail");
  var sidebar = document.getElementById("sidebar");

  function esc(s) { return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function slug(s, i) { return (s || "h").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) + "-" + i; }
  function letter(i) { return String.fromCharCode(65 + i); }

  /* ---------------- Theme ---------------- */
  (function () {
    var DAY = 7, NIGHT = 19;
    function resolved(m) { if (m === "day" || m === "night") return m; var h = new Date().getHours(); return (h >= DAY && h < NIGHT) ? "day" : "night"; }
    function getMode() { try { return localStorage.getItem("themeMode") || "auto"; } catch (e) { return "auto"; } }
    function apply(m) {
      document.documentElement.setAttribute("data-theme", resolved(m));
      document.querySelectorAll(".theme-toggle button").forEach(function (b) { b.classList.toggle("active", b.dataset.mode === m); });
    }
    document.querySelectorAll(".theme-toggle button").forEach(function (btn) {
      btn.addEventListener("click", function () { var m = btn.dataset.mode; try { localStorage.setItem("themeMode", m); } catch (e) {} apply(m); });
    });
    apply(getMode());
    setInterval(function () { if (getMode() === "auto") apply("auto"); }, 60000);
  })();

  /* ---------------- Icons ---------------- */
  function icon(name, cls) {
    var p = {
      notes: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
      pod: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
      quiz: '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 1 1 4 2.8c-.8.4-1.1 1-1.1 1.7v.5M12 17h.01"/>',
      exam: '<path d="M4 4h16v16H4zM8 9h8M8 13h8M8 17h5"/>',
      star: '<path d="M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.9 6.7 19.1l1-5.8L3.5 9.2l5.9-.9z"/>',
      calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
      badge: '<circle cx="12" cy="8" r="5"/><path d="M8.5 12.5L7 22l5-3 5 3-1.5-9.5"/>',
      play: '<path d="M7 4v16l13-8z" fill="currentColor" stroke="none"/>',
      home: '<path d="M3 12l9-9 9 9M5 10v10h14V10"/>'
    };
    return '<svg class="' + (cls || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (p[name] || p.notes) + '</svg>';
  }

  /* ---------------- Sidebar ---------------- */
  var NAV = [
    { key: "about", label: "About exam", ic: "exam", href: "#/about" },
    { key: "notes", label: "INCOSE Handbook Notes", ic: "notes", href: "#/notes" },
    { key: "podcasts", label: "Podcasts", ic: "pod", href: "#/podcasts" },
    { key: "topics", label: "Special Topics", ic: "star", href: "#/topics" },
    { key: "practice", label: "Practice Questions", ic: "quiz", href: "#/practice" }
  ];

  function buildSidebar(section, chapterId) {
    var h = '<a href="#/overview" data-k="overview">' + icon("home", "ni") + 'Overview</a>';
    NAV.forEach(function (n) {
      h += '<a href="' + n.href + '" data-k="' + n.key + '"' + (n.key === section ? ' class="active"' : '') + '>' + icon(n.ic, "ni") + n.label + '</a>';
      if (n.key === "notes" && section === "notes") {
        h += '<div class="nav-sub">';
        chapters.forEach(function (c) {
          h += '<a href="#/notes/' + c.id + '" data-k="notes-' + c.id + '"' + (c.id === chapterId ? ' class="active"' : '') + '>Chapter ' + c.no + ' — ' + esc(shortTitle(c.title)) + '</a>';
        });
        h += '</div>';
      }
    });
    sidebar.innerHTML = h;
  }
  function shortTitle(t) { return t.length > 26 ? t.slice(0, 24) + "…" : t; }

  /* ---------------- Right rail ---------------- */
  function buildRightRail() {
    var heads = content.querySelectorAll(".doc h2, .doc h3");
    if (!heads.length) { rightRail.innerHTML = ""; document.body.classList.remove("has-rail"); return; }
    var rr = '<div class="rt">On this page</div>';
    heads.forEach(function (el, i) {
      var id = slug(el.textContent, i); el.id = id;
      var lvl = el.tagName === "H3" ? " lvl4" : "";
      rr += '<a href="#' + id + '" class="rr-link' + lvl + '" data-id="' + id + '">' + esc(el.textContent) + '</a>';
    });
    rightRail.innerHTML = rr;
    document.body.classList.add("has-rail");
    rightRail.querySelectorAll(".rr-link").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var t = document.getElementById(a.dataset.id);
        if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 66, behavior: "smooth" });
        closeDrawers();
      });
    });
  }
  function clearRightRail() { rightRail.innerHTML = ""; document.body.classList.remove("has-rail"); }

  /* ---------------- Pages ---------------- */
  function pageOverview() {
    clearRightRail();
    var totalQ = chapters.reduce(function (s, c) { return s + c.questions.length; }, 0);
    var podCount = Object.keys(PODS).reduce(function (s, k) { return s + PODS[k].length; }, 0);
    var h = '<div class="doc">';
    h += '<h1>Systems Engineering Study Hub</h1>';
    h += '<p class="lede">Everything I\'m using to prepare for the INCOSE ASEP knowledge exam — handbook notes, audio walkthroughs, special topics, and an interactive question bank, all built from the Systems Engineering Handbook, 5th Edition (ISO/IEC/IEEE 15288:2023).</p>';
    h += '<div class="sb-stats" style="margin:18px 0 6px">';
    h += '<div class="stat"><div class="v">' + chapters.length + '</div><div class="l">Chapters</div></div>';
    h += '<div class="stat"><div class="v">' + totalQ + '</div><div class="l">Practice Qs</div></div>';
    h += '<div class="stat"><div class="v">' + podCount + '</div><div class="l">Podcasts</div></div>';
    h += '<div class="stat"><div class="v">' + TOPICS.length + '</div><div class="l">Topics</div></div>';
    h += '</div>';
    h += '<h2 style="border:none">Start here</h2><div class="ov-grid">';
    var cards = [
      ["about", "exam", "About the exam", "Format, eligibility, fees, timeline and how to prepare for the ASEP."],
      ["notes", "notes", "Handbook notes", "Concept summaries for each chapter, with tables and quick-reference detail."],
      ["podcasts", "pod", "Podcasts", "Quick-summary and deep-dive audio for each chapter."],
      ["topics", "star", "Special topics", "The 6-week study plan and the full INCOSE certification pathway."],
      ["practice", "quiz", "Practice questions", "Build a custom set, answer at your pace, then score and review."]
    ];
    cards.forEach(function (c) {
      h += '<a class="ov-card" href="#/' + c[0] + '"><div class="tc-icon" style="width:42px;height:42px;border-radius:11px;margin-bottom:12px">' + icon(c[1]) + '</div>';
      h += '<h3>' + c[2] + '</h3><p>' + c[3] + '</p></a>';
    });
    h += '</div>';
    h += '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:24px">';
    h += '<a class="btn" href="#/practice">Start practising</a><a class="btn ghost" href="#/about">About the exam</a></div>';
    h += '</div>';
    content.innerHTML = h;
  }

  function pageAbout() {
    content.innerHTML = '<div class="doc"><div class="crumb">Reference</div><h1>About the exam</h1>' +
      '<p class="lede">What the INCOSE ASEP knowledge exam involves and how to prepare.</p>' +
      '<div class="panel">' + (META.aboutExamHtml || "") + '</div></div>';
    buildRightRail();
  }

  function pageNotesLanding() {
    clearRightRail();
    var h = '<div class="doc"><div class="crumb">INCOSE Handbook Notes</div><h1>Handbook notes</h1>';
    h += '<p class="lede">Concept summaries condensed from the INCOSE Systems Engineering Handbook. Pick a chapter from the menu or a card below.</p>';
    h += '<div class="ov-grid">';
    chapters.forEach(function (c) {
      h += '<a class="ov-card" href="#/notes/' + c.id + '"><div class="cn">Chapter ' + c.no + '</div><h3>' + esc(c.title) + '</h3><p>' + esc(c.subtitle) + '</p></a>';
    });
    h += '</div></div>';
    content.innerHTML = h;
  }

  function pageNotesChapter(c) {
    var h = '<div class="doc"><div class="crumb">Handbook Notes &nbsp;&rsaquo;&nbsp; Chapter ' + c.no + '</div>';
    h += '<h1>' + esc(c.title) + '</h1><p class="lede">' + esc(c.subtitle) + '</p>';
    h += '<div class="panel">' + c.notesHtml + '</div></div>';
    content.innerHTML = h;
    buildRightRail();
  }

  function pagePodcasts() {
    clearRightRail();
    var h = '<div class="doc"><div class="crumb">Audio</div><h1>Podcasts</h1>';
    h += '<p class="lede">Audio walkthroughs for each chapter — a quick summary to revise fast, and a deep dive for the full picture.</p>';
    var any = false;
    chapters.forEach(function (c) {
      var eps = PODS[String(c.no)] || [];
      h += '<div class="pod-ch"><h2>Chapter ' + c.no + ' — ' + esc(c.title) + '</h2>';
      if (!eps.length) { h += '<p class="pod-empty">No audio added for this chapter yet.</p></div>'; return; }
      any = true;
      h += '<div class="pc-sub">' + eps.length + ' episode' + (eps.length > 1 ? "s" : "") + '</div>';
      eps.forEach(function (ep) {
        var src = "audio/" + encodeURIComponent(ep.file);
        h += '<div class="pod-ep"><div class="pe-icon">' + icon("play") + '</div>' +
          '<div class="pe-meta"><div class="pe-label">' + esc(ep.label) + '</div><div class="pe-ch">Chapter ' + c.no + '</div></div>' +
          '<audio controls preload="none" controlsList="nodownload" src="' + src + '"></audio></div>';
      });
      h += '</div>';
    });
    if (!any) h += '<p class="pod-empty">Drop chapter audio into the <code>audio/</code> folder to populate this page.</p>';
    h += '</div>';
    content.innerHTML = h;
  }

  function pageTopicsLanding() {
    clearRightRail();
    var h = '<div class="doc"><div class="crumb">Special Topics</div><h1>Special topics</h1>';
    h += '<p class="lede">Supplementary study material beyond the chapter notes.</p>';
    TOPICS.forEach(function (t) {
      h += '<a class="topic-card" href="#/topics/' + t.id + '"><div class="tc-icon">' + icon(t.icon || "star") + '</div>' +
        '<div><h3>' + esc(t.title) + '</h3><p>' + esc(t.blurb) + '</p></div></a>';
    });
    content.innerHTML = h;
  }

  function pageTopic(t) {
    content.innerHTML = '<div class="doc"><div class="crumb"><a href="#/topics" style="color:inherit">Special Topics</a> &nbsp;&rsaquo;&nbsp; ' + esc(t.title) + '</div>' +
      '<h1>' + esc(t.title) + '</h1><p class="lede">' + esc(t.blurb) + '</p>' +
      '<div class="panel">' + t.html + '</div></div>';
    buildRightRail();
  }

  function pageExamRedirect() { location.hash = "#/about"; }

  /* ---------------- Quiz ---------------- */
  var quiz = null;

  function pagePractice() {
    clearRightRail();
    if (!quiz) quiz = { chapters: chapters.map(function (c) { return c.id; }), count: "20", order: "order", items: [], answers: {}, submitted: false, filter: "all" };
    renderSetup();
  }

  function renderSetup() {
    var h = '<div class="doc"><div class="crumb">Practice</div><h1>Practice questions</h1>';
    h += '<p class="lede">Choose chapters and how many questions, answer at your own pace, and submit whenever you like — you don\'t have to finish them all.</p>';
    h += '<div class="panel quiz-setup">';
    h += '<label>Chapters</label><div class="chips" id="q-chapters">';
    chapters.forEach(function (c) {
      var on = quiz.chapters.indexOf(c.id) !== -1;
      h += '<button data-id="' + c.id + '"' + (on ? ' class="on"' : '') + '><svg class="ck" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>Chapter ' + c.no + '</button>';
    });
    h += '</div>';
    h += '<label>How many questions</label><div class="seg" id="q-count">';
    [["10", "10"], ["20", "20"], ["50", "50"], ["all", "All"]].forEach(function (o) {
      h += '<button data-v="' + o[0] + '"' + (o[0] === quiz.count ? ' class="on"' : '') + '>' + o[1] + '</button>';
    });
    h += '</div>';
    h += '<label>Order</label><div class="seg" id="q-order">';
    [["order", "In order"], ["shuffle", "Shuffle"]].forEach(function (o) {
      h += '<button data-v="' + o[0] + '"' + (o[0] === quiz.order ? ' class="on"' : '') + '>' + o[1] + '</button>';
    });
    h += '</div>';
    h += '<div style="margin-top:22px"><button class="btn" id="q-start">Start practising</button> <span id="q-hint" style="color:var(--text-dim);font-size:.86rem;margin-left:8px"></span></div>';
    h += '</div></div>';
    content.innerHTML = h;

    var chWrap = document.getElementById("q-chapters");
    chWrap.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.dataset.id, i = quiz.chapters.indexOf(id);
        if (i === -1) quiz.chapters.push(id); else quiz.chapters.splice(i, 1);
        b.classList.toggle("on", quiz.chapters.indexOf(id) !== -1);
        updateStartState();
      });
    });
    bindSeg("q-count", function (v) { quiz.count = v; });
    bindSeg("q-order", function (v) { quiz.order = v; });
    document.getElementById("q-start").addEventListener("click", function () { if (quiz.chapters.length) startQuiz(); });
    updateStartState();
  }
  function updateStartState() {
    var btn = document.getElementById("q-start"), hint = document.getElementById("q-hint");
    if (!btn) return;
    var ok = quiz.chapters.length > 0;
    btn.disabled = !ok;
    hint.textContent = ok ? "" : "Select at least one chapter.";
  }

  function bindSeg(id, cb) {
    var seg = document.getElementById(id);
    seg.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        seg.querySelectorAll("button").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on"); cb(b.dataset.v);
      });
    });
  }

  function buildPool() {
    var pool = [];
    quiz.chapters.map(function (id) { return byId[id]; }).sort(function (a, b) { return a.no - b.no; }).forEach(function (c) {
      c.questions.forEach(function (q) { pool.push({ chNo: c.no, n: q.n, q: q.q, options: q.options, correct: q.correct, explanation: q.explanation }); });
    });
    if (quiz.order === "shuffle") {
      for (var i = pool.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
    }
    if (quiz.count !== "all") pool = pool.slice(0, parseInt(quiz.count, 10));
    return pool;
  }

  function startQuiz() {
    quiz.items = buildPool(); quiz.answers = {}; quiz.submitted = false; quiz.filter = "all";
    renderQuiz(); window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function startQuizSameItems() { quiz.answers = {}; quiz.submitted = false; quiz.filter = "all"; renderQuiz(); window.scrollTo({ top: 0, behavior: "smooth" }); }

  function renderQuiz() {
    var multi = quiz.chapters.length > 1;
    var h = '<div class="doc"><div id="sb-slot"></div>';
    h += '<div class="quizbar"><span class="prog" id="q-prog"></span><span class="grow"></span>';
    h += '<button class="btn ghost" id="q-change">Change set</button><button class="btn" id="q-submit">Submit</button>';
    h += '</div><div id="q-list">';
    quiz.items.forEach(function (it, qi) {
      h += '<div class="q-card" id="qc-' + qi + '">';
      h += '<div class="qnum">' + (multi ? "Ch" + it.chNo + " · " : "") + 'Question ' + (qi + 1) + ' of ' + quiz.items.length + '<span id="qs-' + qi + '"></span></div>';
      h += '<div class="qtext">' + esc(it.q) + '</div>';
      it.options.forEach(function (o, oi) {
        h += '<div class="opt" data-qi="' + qi + '" data-oi="' + oi + '"><span class="mark">' + letter(oi) + '</span><span class="otext">' + esc(o) + '</span></div>';
      });
      h += '<div id="ex-' + qi + '"></div></div>';
    });
    h += '</div></div>';
    content.innerHTML = h;

    content.querySelectorAll(".opt").forEach(function (opt) {
      opt.addEventListener("click", function () {
        if (quiz.submitted) return;
        var qi = +opt.dataset.qi, oi = +opt.dataset.oi;
        quiz.answers[qi] = oi;
        document.getElementById("qc-" + qi).querySelectorAll(".opt").forEach(function (o) { o.classList.toggle("sel", +o.dataset.oi === oi); });
        updateProgress();
      });
    });
    document.getElementById("q-submit").addEventListener("click", submitQuiz);
    document.getElementById("q-change").addEventListener("click", renderSetup);
    updateProgress();
  }

  function updateProgress() {
    var el = document.getElementById("q-prog");
    if (el) el.textContent = quiz.submitted ? "Submitted" : (Object.keys(quiz.answers).length + " of " + quiz.items.length + " answered");
  }

  function submitQuiz() {
    quiz.submitted = true;
    var total = quiz.items.length, attempted = 0, correct = 0;
    quiz.items.forEach(function (it, qi) {
      var a = quiz.answers[qi], card = document.getElementById("qc-" + qi);
      card.querySelectorAll(".opt").forEach(function (o) {
        o.classList.add("locked"); o.classList.remove("sel");
        var oi = +o.dataset.oi;
        if (oi === it.correct) o.classList.add("correct");
        if (a !== undefined && a === oi && a !== it.correct) o.classList.add("wrong");
      });
      var state, badge;
      if (a === undefined) { state = "skip"; badge = '<span class="q-state s-skip">Not attempted</span>'; }
      else if (a === it.correct) { state = "correct"; correct++; attempted++; badge = '<span class="q-state s-correct">Correct</span>'; }
      else { state = "wrong"; attempted++; badge = '<span class="q-state s-wrong">Incorrect</span>'; }
      card.dataset.state = state;
      document.getElementById("qs-" + qi).innerHTML = " &nbsp;" + badge;
      document.getElementById("ex-" + qi).innerHTML = '<div class="expl"><strong>Correct answer: ' + letter(it.correct) + '.</strong> ' + esc(it.explanation) + '</div>';
    });
    renderScoreboard(total, attempted, correct);
    var holder = document.querySelector(".quizbar");
    if (holder) {
      holder.querySelectorAll(".btn").forEach(function (b) { b.remove(); });
      var retry = document.createElement("button"); retry.className = "btn ghost"; retry.textContent = "Retry"; retry.addEventListener("click", startQuizSameItems);
      var nw = document.createElement("button"); nw.className = "btn"; nw.textContent = "New practice"; nw.addEventListener("click", renderSetup);
      holder.appendChild(retry); holder.appendChild(nw);
    }
    updateProgress();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderScoreboard(total, attempted, correct) {
    var pct = total ? Math.round((correct / total) * 100) : 0;
    var msg = pct >= 90 ? "Outstanding! 🎯" : pct >= 75 ? "Great work!" : pct >= 50 ? "Solid progress" : "Keep practising";
    var h = '<div class="scoreboard"><div class="sb-head"><div class="sb-msg">' + msg + '</div><span class="grow" style="flex:1"></span>';
    h += '<div class="filters"><span class="fl-label">Show</span>';
    [["all", "All"], ["correct", "Correct"], ["wrong", "Wrong"], ["skip", "Unattempted"]].forEach(function (f) {
      h += '<button class="seg-f" data-f="' + f[0] + '">' + f[1] + '</button>';
    });
    h += '</div></div><div class="sb-stats">';
    h += '<div class="stat"><div class="v">' + total + '</div><div class="l">Questions</div></div>';
    h += '<div class="stat"><div class="v">' + attempted + '</div><div class="l">Attempted</div></div>';
    h += '<div class="stat good"><div class="v">' + correct + '</div><div class="l">Correct</div></div>';
    h += '<div class="stat ' + (pct >= 50 ? "good" : "bad") + '"><div class="v">' + pct + '%</div><div class="l">Score</div></div>';
    h += '</div></div>';
    document.getElementById("sb-slot").innerHTML = h;

    var fbtns = document.querySelectorAll(".seg-f");
    fbtns.forEach(function (b) {
      b.style.cssText = "cursor:pointer;font:inherit;font-weight:600;font-size:.84rem;color:var(--text);padding:7px 13px;border-radius:999px;background:var(--card-bg);border:1px solid var(--card-border)";
      if (b.dataset.f === quiz.filter) fOn(b);
      b.addEventListener("click", function () { quiz.filter = b.dataset.f; fbtns.forEach(fOff); fOn(b); applyFilter(); });
    });
  }
  function fOn(b) { b.style.background = "linear-gradient(135deg,#7873f5,#4facfe)"; b.style.color = "#fff"; b.style.borderColor = "transparent"; }
  function fOff(b) { b.style.background = "var(--card-bg)"; b.style.color = "var(--text)"; b.style.borderColor = "var(--card-border)"; }
  function applyFilter() {
    quiz.items.forEach(function (it, qi) {
      var card = document.getElementById("qc-" + qi);
      card.style.display = (quiz.filter === "all" || card.dataset.state === quiz.filter) ? "" : "none";
    });
  }

  /* ---------------- Router ---------------- */
  function route() {
    var hash = location.hash.replace(/^#/, "");
    if (!hash || hash[0] !== "/") { location.hash = "#/overview"; return; }
    var parts = hash.split("/").filter(Boolean);
    closeDrawers();
    var sec = parts[0];

    if (sec === "overview") { buildSidebar(""); pageOverview(); }
    else if (sec === "about") { buildSidebar("about"); pageAbout(); }
    else if (sec === "exam") { pageExamRedirect(); return; }
    else if (sec === "podcasts") { buildSidebar("podcasts"); pagePodcasts(); }
    else if (sec === "topics") {
      if (parts[1] && topicById[parts[1]]) { buildSidebar("topics"); pageTopic(topicById[parts[1]]); }
      else { buildSidebar("topics"); pageTopicsLanding(); }
    }
    else if (sec === "practice") { buildSidebar("practice"); pagePractice(); }
    else if (sec === "notes") {
      if (parts[1] && byId[parts[1]]) { buildSidebar("notes", parts[1]); pageNotesChapter(byId[parts[1]]); }
      else { buildSidebar("notes"); pageNotesLanding(); }
    }
    else { location.hash = "#/overview"; return; }
    window.scrollTo({ top: 0 });
  }
  window.addEventListener("hashchange", route);

  /* ---------------- Drawers + to-top ---------------- */
  var backdrop = document.getElementById("sb-backdrop");
  function openLeft() { sidebar.classList.add("open"); rightRail.classList.remove("open"); backdrop.classList.add("open"); }
  function openRight() { rightRail.classList.add("open"); sidebar.classList.remove("open"); backdrop.classList.add("open"); }
  function closeDrawers() { sidebar.classList.remove("open"); rightRail.classList.remove("open"); backdrop.classList.remove("open"); }
  document.getElementById("menu-btn").addEventListener("click", function () { sidebar.classList.contains("open") ? closeDrawers() : openLeft(); });
  document.getElementById("right-btn").addEventListener("click", function () { rightRail.classList.contains("open") ? closeDrawers() : openRight(); });
  backdrop.addEventListener("click", closeDrawers);
  sidebar.addEventListener("click", function (e) { if (e.target.closest("a")) closeDrawers(); });

  var toTop = document.getElementById("to-top");
  toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  window.addEventListener("scroll", function () {
    toTop.classList.toggle("visible", window.scrollY > 320);
    var links = rightRail.querySelectorAll(".rr-link");
    if (links.length) {
      var pos = window.scrollY + 90, current = null;
      content.querySelectorAll(".doc h2, .doc h3").forEach(function (el) { if (el.offsetTop <= pos) current = el.id; });
      links.forEach(function (a) { a.classList.toggle("active", a.dataset.id === current); });
    }
  }, { passive: true });

  document.querySelector(".se-brand").addEventListener("click", function () { location.hash = "#/overview"; });
  document.querySelector(".se-brand").style.cursor = "pointer";

  /* ---------------- Init ---------------- */
  route();
})();
