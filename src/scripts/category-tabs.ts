export type TabActivationSource = 'initial' | 'keyboard' | 'pointer' | 'programmatic';

type TabChange = {
  index: number;
  source: TabActivationSource;
  animate: boolean;
  showPanels: () => void;
};

type CategoryTabsOptions = {
  tabList: HTMLElement;
  panels: HTMLElement[];
  onChange?: (change: TabChange) => void;
};

type ActivateOptions = {
  animate?: boolean;
  focus?: boolean;
  source?: TabActivationSource;
};

export function initCategoryTabs({ tabList, panels, onChange }: CategoryTabsOptions) {
  const tabs = Array.from(tabList.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const selector = tabList.querySelector<HTMLElement>('.selector');

  const setSelector = (tab: HTMLElement) => {
    if (!selector) return;
    selector.style.width = `${tab.offsetWidth}px`;
    selector.style.left = `${tab.offsetLeft}px`;
  };

  const activate = (index: number, options: ActivateOptions = {}) => {
    const tab = tabs[index];
    if (!tab) return;

    const source = options.source ?? 'programmatic';
    const animate = options.animate ?? true;
    tabs.forEach((item, itemIndex) => {
      const isSelected = itemIndex === index;
      item.setAttribute('aria-selected', String(isSelected));
      item.tabIndex = isSelected ? 0 : -1;
    });
    setSelector(tab);

    const showPanels = () => {
      panels.forEach((panel, panelIndex) => {
        panel.hidden = panelIndex !== index;
      });
    };

    if (onChange) onChange({ index, source, animate, showPanels });
    else showPanels();

    if (options.focus) tab.focus();
  };

  tabList.addEventListener('click', (event) => {
    const tab = (event.target as HTMLElement).closest<HTMLButtonElement>('[role="tab"]');
    if (!tab || !tabList.contains(tab)) return;
    activate(tabs.indexOf(tab), { source: 'pointer' });
  });

  tabList.addEventListener('keydown', (event) => {
    const currentTab = (event.target as HTMLElement).closest<HTMLButtonElement>('[role="tab"]');
    if (!currentTab || !tabList.contains(currentTab)) return;

    const currentIndex = tabs.indexOf(currentTab);
    let nextIndex: number | undefined;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown')
      nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;
    if (nextIndex === undefined) return;

    event.preventDefault();
    activate(nextIndex, { focus: true, source: 'keyboard' });
  });

  const initialIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true'),
  );
  activate(initialIndex, { animate: false, source: 'initial' });
  window.addEventListener('resize', () => {
    const selectedTab = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true');
    if (selectedTab) setSelector(selectedTab);
  });

  return { activate };
}
