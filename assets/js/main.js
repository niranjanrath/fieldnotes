/* Fieldnotes — progressive enhancement. No dependencies. */
(function () {
  "use strict";

  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Theme toggle ---------------------------------------------- */
  $$("[data-theme-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      btn.setAttribute("aria-pressed", next === "dark");
    });
    btn.setAttribute("aria-pressed", root.getAttribute("data-theme") === "dark");
  });

  /* ---------- Back to top ----------------------------------------------- */
  var toTop = $("[data-to-top]");
  if (toTop) toTop.addEventListener("click", function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  /* ---------- Article enhancements -------------------------------------- */
  var prose = $("[data-prose]");

  if (prose) {
    // Heading anchors
    var heads = $$("h2[id], h3[id]", prose);
    heads.forEach(function (h) {
      var a = document.createElement("a");
      a.className = "anchor";
      a.href = "#" + h.id;
      a.setAttribute("aria-label", "Link to this section");
      a.textContent = "#";
      h.insertBefore(a, h.firstChild);
    });

    // Code blocks: language label + copy button
    $$("div.highlighter-rouge", prose).forEach(function (block) {
      var langMatch = (block.className.match(/language-([\w+#-]+)/) || [])[1] || "code";
      var labels = { js: "javascript", sh: "shell", bash: "shell", yml: "yaml", html: "html", md: "markdown" };
      var bar = document.createElement("div");
      bar.className = "code-bar";
      var lang = document.createElement("span");
      lang.textContent = labels[langMatch] || langMatch;
      var copy = document.createElement("button");
      copy.type = "button";
      copy.className = "copy-btn";
      copy.textContent = "Copy";
      copy.addEventListener("click", function () {
        var code = $("pre", block);
        var text = code ? code.innerText.replace(/\n$/, "") : "";
        var done = function () {
          copy.textContent = "Copied ✓";
          copy.classList.add("is-done");
          setTimeout(function () { copy.textContent = "Copy"; copy.classList.remove("is-done"); }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () {});
        } else {
          var ta = document.createElement("textarea");
          ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
          document.body.appendChild(ta); ta.select();
          try { document.execCommand("copy"); done(); } catch (e) {}
          document.body.removeChild(ta);
        }
      });
      bar.appendChild(lang);
      bar.appendChild(copy);
      block.insertBefore(bar, block.firstChild);
    });

    // Table of contents (posts only, when there is enough to navigate)
    var toc = $("[data-toc]");
    if (toc && heads.length >= 3) {
      var details = document.createElement("details");
      details.className = "toc-inner";
      var summary = document.createElement("summary");
      summary.className = "toc-title";
      summary.textContent = "In this post";
      var list = document.createElement("ol");
      var links = {};
      heads.forEach(function (h) {
        var li = document.createElement("li");
        if (h.tagName === "H3") li.className = "is-sub";
        var a = document.createElement("a");
        a.href = "#" + h.id;
        a.textContent = h.textContent.replace(/^#/, "");
        li.appendChild(a);
        list.appendChild(li);
        links[h.id] = a;
      });
      details.appendChild(summary);
      details.appendChild(list);
      toc.appendChild(details);

      var wide = matchMedia("(min-width: 1200px)");
      var sync = function () { details.open = wide.matches; };
      sync();
      (wide.addEventListener ? wide.addEventListener("change", sync) : wide.addListener(sync));
      summary.addEventListener("click", function (e) { if (wide.matches) e.preventDefault(); });

      // Scrollspy
      if ("IntersectionObserver" in window) {
        var current = null;
        var visible = {};
        var setActive = function (id) {
          if (id === current) return;
          if (current && links[current]) links[current].classList.remove("is-active");
          current = id;
          if (id && links[id]) links[id].classList.add("is-active");
        };
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
          var first = heads.filter(function (h) { return visible[h.id]; })[0];
          if (first) setActive(first.id);
          else {
            // none in the viewport band → keep the last heading above it
            var above = heads.filter(function (h) { return h.getBoundingClientRect().top < 120; });
            if (above.length) setActive(above[above.length - 1].id);
          }
        }, { rootMargin: "-80px 0px -65% 0px", threshold: 0 });
        heads.forEach(function (h) { io.observe(h); });
      }
    }

    // Reading progress (posts)
    var bar = $(".progress span");
    if (bar && document.body.classList.contains("layout-post")) {
      var ticking = false;
      var update = function () {
        var rect = prose.getBoundingClientRect();
        var total = rect.height - window.innerHeight * 0.6;
        var done = Math.min(Math.max(-rect.top + window.innerHeight * 0.2, 0), total);
        bar.style.transform = "scaleX(" + (total > 0 ? done / total : 0) + ")";
        ticking = false;
      };
      var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
      addEventListener("scroll", onScroll, { passive: true });
      addEventListener("resize", onScroll);
      update();
    }
  }

  /* ---------- Search ----------------------------------------------------- */
  var dialog = $("#search");
  var input = $("#search-input");
  var results = $("#search-results");
  var hint = $("#search-hint");
  var index = null, loading = null, active = -1, shown = [];

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function reEsc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  function load() {
    if (index) return Promise.resolve(index);
    if (loading) return loading;
    loading = fetch(document.body.getAttribute("data-search"))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        index = d.map(function (p) {
          p._t = p.title.toLowerCase();
          p._g = p.tags.join(" ").toLowerCase();
          p._c = p.content.toLowerCase();
          return p;
        });
        return index;
      })
      .catch(function () { loading = null; index = []; return index; });
    return loading;
  }

  function search(q) {
    var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return index.map(function (p) {
      var score = 0;
      for (var i = 0; i < terms.length; i++) {
        var t = terms[i], hit = false;
        if (p._t.indexOf(t) > -1) { score += 10; hit = true; }
        if (p._g.indexOf(t) > -1) { score += 6; hit = true; }
        var pos = p._c.indexOf(t);
        if (pos > -1) { score += 2 + Math.min(3, p._c.split(t).length - 1) * .5; hit = true; }
        if (!hit) return null; // every term must match somewhere
      }
      return { p: p, score: score, terms: terms };
    }).filter(Boolean).sort(function (a, b) { return b.score - a.score; }).slice(0, 8);
  }

  function highlight(text, terms) {
    var safe = esc(text);
    var re = new RegExp("(" + terms.map(reEsc).map(esc).join("|") + ")", "gi");
    return safe.replace(re, "<mark>$1</mark>");
  }

  function snippet(p, terms) {
    var c = p.content, lc = p._c, best = -1;
    for (var i = 0; i < terms.length; i++) { var k = lc.indexOf(terms[i]); if (k > -1 && (best < 0 || k < best)) best = k; }
    if (best < 0) return p.excerpt;
    var start = Math.max(0, best - 60);
    var out = c.slice(start, start + 170);
    return (start > 0 ? "…" : "") + out + (start + 170 < c.length ? "…" : "");
  }

  function render(items, q) {
    shown = items;
    active = items.length ? 0 : -1;
    if (!q.trim()) { results.innerHTML = ""; hint.hidden = false; return; }
    if (!items.length) {
      results.innerHTML = '<li class="search-empty" role="presentation">No posts match “' + esc(q) + '”.</li>';
      return;
    }
    results.innerHTML = items.map(function (it, i) {
      var p = it.p;
      return '<li role="option" id="sr-' + i + '" aria-selected="' + (i === 0) + '">' +
        '<a href="' + esc(p.url) + '">' +
        '<span class="sr-title">' + highlight(p.title, it.terms) + '</span>' +
        '<span class="sr-snippet">' + highlight(snippet(p, it.terms), it.terms) + '</span>' +
        '<span class="sr-meta">' + esc(p.date) + (p.tags.length ? " · " + esc(p.tags.join(", ")) : "") + '</span>' +
        '</a></li>';
    }).join("");
  }

  function setActive(i) {
    if (!shown.length) return;
    active = (i + shown.length) % shown.length;
    $$("li[role=option]", results).forEach(function (li, n) { li.setAttribute("aria-selected", n === active); });
    var el = $("#sr-" + active); if (el) el.scrollIntoView({ block: "nearest" });
    input.setAttribute("aria-activedescendant", "sr-" + active);
  }

  function openSearch() {
    if (!dialog) return;
    if (typeof dialog.showModal === "function") { if (!dialog.open) dialog.showModal(); }
    else dialog.setAttribute("open", "");
    input.focus(); input.select();
    load();
  }

  if (dialog && input) {
    $$("[data-search-open]").forEach(function (b) { b.addEventListener("click", openSearch); });

    input.addEventListener("input", function () {
      var q = input.value;
      load().then(function () { render(search(q), q); });
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); setActive(active + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActive(active - 1); }
      else if (e.key === "Enter") {
        e.preventDefault();
        if (shown[active]) window.location.href = shown[active].p.url;
      }
    });

    // click outside to close
    dialog.addEventListener("click", function (e) {
      var r = dialog.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
    });
    dialog.addEventListener("close", function () { input.value = ""; results.innerHTML = ""; });

    document.addEventListener("keydown", function (e) {
      var tag = (e.target.tagName || "").toLowerCase();
      var typing = tag === "input" || tag === "textarea" || e.target.isContentEditable;
      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") || (e.key === "/" && !typing)) {
        e.preventDefault(); openSearch();
      }
    });
  }
})();
