(() => {
  'use strict';
  // Never instrument the unlisted personal dashboard.
  if (location.pathname.startsWith('/xyzzy')) return;
  const websiteId = window.UDE_ANALYTICS_WEBSITE_ID;
  if (typeof websiteId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(websiteId)) return;
  const tracker = document.createElement('script');
  tracker.defer = true;
  tracker.src = 'https://cloud.umami.is/script.js';
  tracker.dataset.websiteId = websiteId;
  document.head.appendChild(tracker);

  // Track aggregate interactions, not search terms, personal content or URLs.
  document.addEventListener('click', event => {
    const element = event.target.closest('a, .tile-toggle, .filter-button');
    if (!element || !window.umami || typeof window.umami.track !== 'function') return;
    const tile = element.closest('[data-key]');
    const project = tile?.dataset.key || '';
    if (element.matches('.tile-toggle') && project) {
      window.umami.track('project-open', {project});
    } else if (element.matches('a') && project) {
      const href = element.getAttribute('href') || '';
      // Do not transmit arbitrary link destinations or personal data.
      if (/^https?:|^webcal:|^\//i.test(href)) {
        window.umami.track('project-link', {project, type: href.startsWith('webcal:') ? 'subscribe' : 'open'});
      }
    } else if (element.matches('.filter-button')) {
      window.umami.track('category-filter');
    }
  });
})();
