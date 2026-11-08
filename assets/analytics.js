(() => {
  'use strict';
  if (location.pathname.startsWith('/xyzzy')) return;
  const track = (name, data) => {
    if (window.umami && typeof window.umami.track === 'function') {
      window.umami.track(name, data);
    }
  };
  document.addEventListener('click', event => {
    const el = event.target.closest('a, .tile-toggle, .filter-button, .project');
    if (!el) return;
    const tile = el.closest('[data-key], .projects .project');
    const project = tile?.dataset.key || tile?.id || '';
    if (el.closest('.tile-toggle') && project) {
      // Only count opening, not closing.
      if (el.closest('.tile-toggle').getAttribute('aria-expanded') === 'false')
        track('project-open', {project});
    } else if (el.closest('a') && project) {
      const href = el.closest('a').getAttribute('href') || '';
      if (/^(https?:|webcal:|\/)/i.test(href)) {
        const type = href.startsWith('webcal:') ? 'subscribe' :
          /github\.com/.test(href) ? 'source' : 'launch';
        track('project-link', {project, type});
      }
    } else if (el.closest('.filter-button')) {
      track('category-filter');
    } else if (tile && !el.closest('a,button,input') &&
      tile.matches('.projects .project') && tile.getAttribute('aria-expanded') === 'false') {
      track('project-open', {project});
    }
  }, true);
  // Workshop tiles can also be opened with the keyboard.
  document.addEventListener('keydown', event => {
    if (!['Enter',' '].includes(event.key)) return;
    const card = event.target.closest('.projects .project');
    if (card && event.target === card && card.getAttribute('aria-expanded') === 'false')
      track('project-open', {project:card.id});
  }, true);
})();
