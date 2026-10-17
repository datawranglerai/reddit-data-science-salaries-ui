const EVENT_LABELS = {
  'nav-skip': 'Skip to explorer',
  'nav-reports': 'Navigate to reports',
  'nav-about': 'Navigate to data notes',
  'nav-top': 'Back to top',
  'data-pipeline': 'Open data pipeline',
  'source-code': 'Open source code',
  'logo-credit': 'Open logo source credit',
  'support-coffee': 'Buy me a coffee',
  'pay-base': 'Base salary measure',
  'pay-total': 'Total compensation measure',
  'filter-country': 'Country filter',
  'filter-year': 'Year filter',
  'filter-role': 'Role filter',
  'filter-stage': 'Career stage filter',
  'filter-work': 'Work arrangement filter',
  'filter-search': 'Search filter',
  'remove-country': 'Remove country filter',
  'remove-year': 'Remove year filter',
  'remove-role': 'Remove role filter',
  'remove-stage': 'Remove career stage filter',
  'remove-work': 'Remove work arrangement filter',
  'remove-search': 'Remove search filter',
  'reset-view': 'Reset explorer',
  'more-filters': 'Additional filters',
  'breakdown-country': 'Country breakdown',
  'breakdown-role': 'Role breakdown',
  'breakdown-year': 'Year breakdown',
  'groups-show-all': 'Show all comparison groups',
  'groups-show-fewer': 'Show fewer comparison groups',
  'chart-distribution': 'Salary distribution chart',
  'chart-country': 'Country comparison chart',
  'chart-role': 'Role comparison chart',
  'chart-year': 'Year comparison chart',
  'distribution-data': 'Distribution data table',
  'comparison-data': 'Comparison data table',
  'salary-position': 'Salary comparison',
  'salary-input': 'Salary comparison input',
  'export-csv': 'Download filtered CSV',
  'sort-title': 'Sort reports by title',
  'sort-year': 'Sort reports by year',
  'sort-base': 'Sort reports by base salary',
  'sort-total': 'Sort reports by total compensation',
  'source-report': 'Inspect source report',
  'source-reddit': 'Open Reddit source',
  'page-previous': 'Previous report page',
  'page-next': 'Next report page',
  'method-source': 'Source and coverage notes',
  'method-pay': 'Pay and exclusion notes',
  'method-labels': 'Label and summary notes',
  'method-limits': 'Data limitations',
} as const;

type InteractionAction = 'click' | 'change' | 'open' | 'close';

export interface InteractionEvent {
  path: string;
  title: string;
  event: true;
  no_session: true;
}

declare global {
  interface Window {
    goatcounter?: { count?: (event: InteractionEvent) => unknown };
  }
}

export function interactionEvent(name: string, action: InteractionAction): InteractionEvent | null {
  if (!Object.hasOwn(EVENT_LABELS, name)) return null;
  return {
    path: `ui/${name}/${action}`,
    title: `${EVENT_LABELS[name as keyof typeof EVENT_LABELS]} (${action})`,
    event: true,
    no_session: true,
  };
}

export function installInteractionTracking(): () => void {
  const script = document.getElementById('goatcounter-script');
  const pending: InteractionEvent[] = [];
  let unavailable = false;

  function disable() {
    unavailable = true;
    pending.length = 0;
  }

  function send(event: InteractionEvent) {
    if (unavailable) return;
    if (typeof window.goatcounter?.count !== 'function') {
      // Preserve a bounded set of value-free actions while the async script loads.
      if (script && pending.length < 30) pending.push(event);
      return;
    }
    try {
      window.goatcounter.count(event);
    } catch (error) {
      // An optional third-party service must never break explorer interactions.
      disable();
      console.warn('GoatCounter interaction tracking is unavailable.', error);
    }
  }

  function flush() {
    if (typeof window.goatcounter?.count !== 'function') {
      disable();
      return;
    }
    const queued = pending.splice(0);
    queued.forEach(send);
  }

  function trackClick(event: MouseEvent) {
    if (!(event.target instanceof Element)) return;
    const element = event.target.closest('[data-analytics-event]');
    if (!element || element.matches(':disabled')) return;
    if (event.type === 'auxclick' && (event.button !== 1 || element.tagName !== 'A')) return;
    const action = element.tagName === 'SUMMARY'
      ? element.parentElement?.hasAttribute('open') ? 'close' : 'open'
      : 'click';
    const payload = interactionEvent(element.getAttribute('data-analytics-event') ?? '', action);
    if (payload) send(payload);
  }

  function trackChange(event: Event) {
    if (!(event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement)) return;
    const payload = interactionEvent(event.target.getAttribute('data-analytics-event') ?? '', 'change');
    if (payload) send(payload);
  }

  // Capture the action before React changes/removes the clicked control. This also
  // handles controls added by pagination without rebinding or counting labels twice.
  document.addEventListener('click', trackClick, true);
  document.addEventListener('auxclick', trackClick, true);
  document.addEventListener('change', trackChange, true);
  script?.addEventListener('load', flush, { once: true });
  script?.addEventListener('error', disable, { once: true });

  return () => {
    document.removeEventListener('click', trackClick, true);
    document.removeEventListener('auxclick', trackClick, true);
    document.removeEventListener('change', trackChange, true);
    script?.removeEventListener('load', flush);
    script?.removeEventListener('error', disable);
    disable();
  };
}
