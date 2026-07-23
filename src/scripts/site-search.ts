type PagefindResult = {
  data: () => Promise<{
    url: string;
    meta: { title?: string };
    excerpt?: string;
  }>;
};

type Pagefind = {
  search: (query: string) => Promise<{ results: PagefindResult[] }>;
};

const dialog = document.querySelector<HTMLElement>('#site-search-dialog');
const input = document.querySelector<HTMLInputElement>('#site-search-input');
const form = document.querySelector<HTMLFormElement>('.site-search-form');
const searchStatus = document.querySelector<HTMLElement>('#site-search-status');
const results = document.querySelector<HTMLElement>('#site-search-results');
const openButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-search-open]'));
const closeButtons = Array.from(document.querySelectorAll<HTMLElement>('[data-search-close]'));
const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let previousFocus: HTMLElement | null = null;
let pagefindPromise: Promise<Pagefind | null> | undefined;
let searchTimer: number | undefined;

function getPagefind() {
  if (!pagefindPromise) {
    const pagefindUrl = '/pagefind/pagefind.js';
    pagefindPromise = import(/* @vite-ignore */ pagefindUrl)
      .then((module) => module as Pagefind)
      .catch(() => null);
  }
  return pagefindPromise;
}

function getFallbackResults(query: string) {
  const normalizedQuery = query.toLocaleLowerCase();
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.navbar-desktop-dropdown a, #navbar-mobile-menu a'));
  const uniqueLinks = new Map<string, HTMLAnchorElement>();
  links.forEach((link) => {
    if (link.href && !uniqueLinks.has(link.href)) uniqueLinks.set(link.href, link);
  });

  return Array.from(uniqueLinks.values())
    .filter((link) => link.textContent?.toLocaleLowerCase().includes(normalizedQuery))
    .map((link) => ({ url: link.href, title: link.textContent?.trim() || 'JPEG XL' }));
}

function clearResults(message: string) {
  if (results) results.replaceChildren();
  if (searchStatus) searchStatus.textContent = message;
}

function renderResults(items: Array<{ url: string; title: string; excerpt?: string }>) {
  if (!results || !searchStatus) return;
  results.replaceChildren();
  searchStatus.textContent = items.length ? `${items.length} result${items.length === 1 ? '' : 's'}` : 'No results found.';

  items.forEach((item) => {
    const link = document.createElement('a');
    link.className = 'site-search-result';
    link.href = item.url;

    const title = document.createElement('span');
    title.className = 'site-search-result-title';
    title.textContent = item.title;
    link.append(title);

    if (item.excerpt) {
      const excerpt = document.createElement('span');
      excerpt.className = 'site-search-result-excerpt';
      excerpt.innerHTML = item.excerpt;
      link.append(excerpt);
    }
    results.append(link);
  });
}

async function search(query: string) {
  const term = query.trim();
  if (!term) {
    clearResults('Search pages, guides, FAQs, and articles.');
    return;
  }

  if (searchStatus) searchStatus.textContent = 'Searching…';
  const pagefind = await getPagefind();
  if (!pagefind) {
    renderResults(getFallbackResults(term));
    return;
  }

  const response = await pagefind.search(term);
  const data = await Promise.all(response.results.slice(0, 8).map((result) => result.data()));
  renderResults(
    data.map((result) => ({
      url: result.url,
      title: result.meta.title || 'JPEG XL',
      excerpt: result.excerpt,
    })),
  );
}

function setSearchOpen(open: boolean, returnFocus = true) {
  if (!dialog) return;
  dialog.hidden = !open;
  document.body.classList.toggle('site-search-open', open);

  if (open) {
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    window.setTimeout(() => input?.focus(), 0);
  } else if (returnFocus) {
    previousFocus?.focus();
  }
}

openButtons.forEach((button) => {
  button.addEventListener('click', () => setSearchOpen(true));
});

closeButtons.forEach((button) => {
  button.addEventListener('click', () => setSearchOpen(false));
});

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  search(input?.value || '');
});

input?.addEventListener('input', () => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => search(input.value), 160);
});

results?.addEventListener('click', () => setSearchOpen(false, false));

document.addEventListener('keydown', (event) => {
  const isSearchShortcut = (event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k';
  if (isSearchShortcut) {
    event.preventDefault();
    setSearchOpen(true);
    return;
  }

  if (!dialog || dialog.hidden) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    setSearchOpen(false);
    return;
  }

  if (event.key === 'Tab') {
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});
