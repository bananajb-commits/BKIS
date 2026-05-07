function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripMathJaxText(text) {
  // Remove LaTeX markers to improve search matching.
  return text
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/\$[^$]*\$/g, " ")
    .replace(/\\\[[\s\S]*?\\\]/g, " ")
    .replace(/\\\([\s\S]*?\\\)/g, " ");
}

function setTocOpen(isOpen) {
  const toc = document.getElementById("toc");
  const btn = document.getElementById("toggleToc");
  if (!toc || !btn) return;

  toc.classList.toggle("hidden", !isOpen);
  btn.setAttribute("aria-expanded", String(isOpen));
}

function highlightMatches(root, query) {
  // Clear existing highlights
  root.querySelectorAll("span.mark").forEach((el) => {
    const parent = el.parentNode;
    if (!parent) return;
    parent.replaceChild(document.createTextNode(el.textContent || ""), el);
    parent.normalize();
  });

  if (!query) return;

  const q = query.trim();
  if (!q) return;

  const re = new RegExp(escapeRegExp(q), "gi");

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (
        parent.closest("script, style, textarea, pre, code, mjx-container, .toc")
      ) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  for (const node of textNodes) {
    const text = node.nodeValue || "";
    const plain = stripMathJaxText(text);
    if (!re.test(plain)) {
      re.lastIndex = 0;
      continue;
    }
    re.lastIndex = 0;

    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    let match;

    while ((match = re.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (start > lastIndex) frag.appendChild(document.createTextNode(text.slice(lastIndex, start)));
      const span = document.createElement("span");
      span.className = "mark";
      span.textContent = text.slice(start, end);
      frag.appendChild(span);
      lastIndex = end;
    }

    if (lastIndex < text.length) frag.appendChild(document.createTextNode(text.slice(lastIndex)));

    node.parentNode.replaceChild(frag, node);
  }
}

function filterSections(query) {
  const root = document.getElementById("bookRoot");
  if (!root) return;

  const q = (query || "").trim().toLowerCase();
  const sections = root.querySelectorAll(".section, .subsection");

  if (!q) {
    sections.forEach((s) => s.classList.remove("hidden"));
    highlightMatches(root, "");
    return;
  }

  sections.forEach((s) => {
    const text = stripMathJaxText(s.innerText || "").toLowerCase();
    const show = text.includes(q);
    s.classList.toggle("hidden", !show);
  });

  // Ensure parent sections are visible if a subsection matches.
  root.querySelectorAll(".subsection:not(.hidden)").forEach((sub) => {
    const parent = sub.closest(".section");
    if (parent) parent.classList.remove("hidden");
  });

  highlightMatches(root, query);
}

function init() {
  const input = document.getElementById("searchInput");
  const toggle = document.getElementById("toggleToc");

  if (toggle) {
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      setTocOpen(!expanded);
    });
  }

  if (input) {
    const apply = () => filterSections(input.value);
    input.addEventListener("input", apply);
    input.addEventListener("search", apply);
  }

  // Start open on desktop, closed if very narrow.
  setTocOpen(window.matchMedia("(max-width: 560px)").matches ? false : true);
}

document.addEventListener("DOMContentLoaded", init);

