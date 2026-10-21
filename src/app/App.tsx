import {
  AppWindow,
  AppleLogo,
  Archive,
  ArrowSquareOut,
  Brain,
  ChatCircleDots,
  ChatsCircle,
  Compass,
  Desktop,
  FilmStrip,
  GameController,
  GithubLogo,
  Globe,
  GoogleLogo,
  House,
  Info,
  MagnifyingGlass,
  MusicNotes,
  Newspaper,
  NotionLogo,
  OpenAiLogo,
  PaintBrush,
  Question,
  ShieldWarning,
  Sparkle,
  SquaresFour,
  Star,
  WindowsLogo,
  X,
  type Icon,
} from "@phosphor-icons/react";
import {
  Fragment,
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";

import generatedCatalog from "../generated/sites.json";
import { highlightSegments, searchSites } from "../domain/search";
import type { CategoryId, LinkedSite, Site, SiteCatalog } from "../domain/site";
import { readFavoriteIds, toggleFavorite } from "../features/favorites/favoriteStore";
import { getBrowserStorage, readStorageItem, writeStorageItem } from "../features/storage/browserStorage";

const RISK_ACKNOWLEDGEMENT_KEY = "personal-nav:risk-ack:v1";
const MOTION_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const DISCLAIMER =
  "本站仅提供公开网址索引，不存储、上传或分发第三方文件，也不对外部站点的合法性、安全性、准确性或可用性作保证。访问和使用第三方内容前，请自行确认所在地法律、软件许可及版权要求；由此产生的风险由访问者自行承担。";

type ViewId = "home" | CategoryId;
type ModalState = { kind: "disclaimer" } | { kind: "risk"; site: LinkedSite } | null;
type ContentMode = "browse" | "search-empty" | "search-results";

interface AppProps {
  catalog?: SiteCatalog;
}

interface Section {
  id: string;
  title: string;
  sites: Site[];
  count?: number;
  showsDisclaimer?: boolean;
  showsSubsections?: boolean;
}

const iconByName: Record<string, Icon> = {
  "app-window": AppWindow,
  anthropic: ChatCircleDots,
  apple: AppleLogo,
  archive: Archive,
  bilibili: Desktop,
  chat: ChatsCircle,
  database: SquaresFour,
  github: GithubLogo,
  google: GoogleLogo,
  microsoft: SquaresFour,
  midjourney: PaintBrush,
  notion: NotionLogo,
  openai: OpenAiLogo,
  perplexity: Sparkle,
  windows: WindowsLogo,
  zhihu: Question,
};

const navIconById: Record<CategoryId, Icon> = {
  common: House,
  ai: Brain,
  windows: WindowsLogo,
  mac: AppleLogo,
  "cross-platform": SquaresFour,
  games: GameController,
  audio: MusicNotes,
  video: FilmStrip,
  media: Newspaper,
  "awesome-mac": GithubLogo,
};

function getStoredFavorites(): string[] {
  return readFavoriteIds(getBrowserStorage("localStorage"));
}

function getRiskAcknowledgement(): boolean {
  return readStorageItem(getBrowserStorage("sessionStorage"), RISK_ACKNOWLEDGEMENT_KEY) === "true";
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName))
  );
}

function Highlight({ text, query }: { text: string; query?: string }) {
  if (!query) return text;
  return highlightSegments(text, query).map((segment, index) =>
    segment.match ? (
      <mark className="search-match" key={index}>
        {segment.text}
      </mark>
    ) : (
      segment.text
    ),
  );
}

function SiteIcon({ site }: { site: Site }) {
  const SiteIconComponent = iconByName[site.icon ?? ""] ?? Globe;

  return (
    <span className={`site-icon site-icon--${site.icon ?? "generic"}`} aria-hidden="true">
      <SiteIconComponent size={22} weight={site.icon === "openai" ? "regular" : "bold"} />
    </span>
  );
}

function Modal({
  isClosing,
  state,
  onClose,
  onContinue,
  onExited,
}: {
  isClosing: boolean;
  state: Exclude<ModalState, null>;
  onClose: () => void;
  onContinue: (site: LinkedSite) => void;
  onExited: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const previousFocusKeyRef = useRef<string | null>(null);
  const isRisk = state.kind === "risk";
  const requestClose = () => {
    if (!isClosing) onClose();
  };

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    previousFocusKeyRef.current = previousFocusRef.current?.dataset.focusKey ?? null;
    const background = [
      document.querySelector<HTMLElement>(".sidebar"),
      document.querySelector<HTMLElement>(".content-shell"),
    ].filter((element): element is HTMLElement => element !== null);
    const previousInertValues = background.map((element) => element.inert);
    background.forEach((element) => {
      element.inert = true;
    });
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !modalRef.current) return;

      const focusable = [...modalRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), [href]")];
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
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      background.forEach((element, index) => {
        element.inert = previousInertValues[index] ?? false;
      });
      const previousFocus = previousFocusRef.current;
      if (previousFocus?.isConnected) {
        previousFocus.focus();
        return;
      }

      const previousFocusKey = previousFocusKeyRef.current;
      if (!previousFocusKey) return;
      const replacement = [...document.querySelectorAll<HTMLElement>("[data-focus-key]")].find(
        (element) => element.dataset.focusKey === previousFocusKey,
      );
      replacement?.focus();
    };
  }, [onClose]);

  useEffect(() => {
    if (!isClosing) return;
    const exitFallback = window.setTimeout(onExited, 200);
    return () => window.clearTimeout(exitFallback);
  }, [isClosing, onExited]);

  return (
    <div
      className={`modal-backdrop ${isClosing ? "is-closing" : ""}`}
      onAnimationEnd={(event) => {
        if (isClosing && event.target === event.currentTarget) onExited();
      }}
      onMouseDown={requestClose}
    >
      <div
        aria-describedby="modal-description"
        aria-labelledby="modal-title"
        aria-modal="true"
        className="modal-card"
        onMouseDown={(event) => event.stopPropagation()}
        ref={modalRef}
        role="dialog"
      >
        <div className={`modal-icon ${isRisk ? "modal-icon--warning" : ""}`} aria-hidden="true">
          {isRisk ? <ShieldWarning size={24} weight="duotone" /> : <Info size={24} weight="duotone" />}
        </div>
        <button className="modal-close" onClick={requestClose} ref={closeButtonRef} type="button">
          <X size={18} />
          <span className="sr-only">关闭</span>
        </button>
        <h2 id="modal-title">{isRisk ? "访问外部站点" : "免责声明"}</h2>
        <div className="modal-description" id="modal-description">
          {isRisk ? (
            <>
              <p>{`即将访问 ${state.site.name}（${state.site.domain}）。该站点内容未经本站验证，请确认风险后继续。`}</p>
              <p className="modal-disclaimer-copy">{DISCLAIMER}</p>
            </>
          ) : (
            <p>{DISCLAIMER}</p>
          )}
        </div>
        <div className="modal-actions">
          <button className="button button--secondary" onClick={requestClose} type="button">
            {isRisk ? "取消" : "知道了"}
          </button>
          {isRisk ? (
            <button
              className="button button--primary"
              onClick={() => {
                if (!isClosing) onContinue(state.site);
              }}
              type="button"
            >
              继续访问
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SiteRow({
  site,
  highlightQuery,
  isFavorite,
  onFavorite,
  onRiskClick,
  riskAcknowledged,
}: {
  site: Site;
  highlightQuery?: string;
  isFavorite: boolean;
  onFavorite: (siteId: string) => void;
  onRiskClick: (event: MouseEvent<HTMLElement>, site: LinkedSite) => void;
  riskAcknowledged: boolean;
}) {
  if (site.linkStatus === "unavailable") {
    return (
      <article
        aria-disabled="true"
        aria-label={`${site.name}，${site.description}，暂无稳定链接`}
        className="site-row site-row--unavailable"
        role="group"
      >
        <div className="site-link site-link--unavailable">
          <SiteIcon site={site} />
          <span className="site-name">
            <Highlight query={highlightQuery} text={site.name} />
          </span>
          <span className="site-description">
            <Highlight query={highlightQuery} text={site.description} />
          </span>
        </div>
        <span className="site-unavailable-status">暂无稳定链接</span>
      </article>
    );
  }

  const gated = site.riskLevel === "high" && !riskAcknowledged;
  const verificationLabel = site.linkStatus === "unchecked" ? "，待核验" : "";
  const contents = (
    <>
      <SiteIcon site={site} />
      <span className="site-title">
        <span className="site-name">
          <Highlight query={highlightQuery} text={site.name} />
        </span>
        {site.linkStatus === "unchecked" ? (
          <span aria-hidden="true" className="site-link-status">
            待核验
          </span>
        ) : null}
      </span>
      <span className="site-description">
        <Highlight query={highlightQuery} text={site.description} />
      </span>
    </>
  );

  return (
    <article className="site-row">
      {gated ? (
          <button
            aria-label={`${site.name}，${site.description}${verificationLabel}`}
            className="site-link site-link-button"
            data-focus-key={`site-link:${site.id}`}
          onAuxClick={(event) => {
            if (event.button === 1) onRiskClick(event, site);
          }}
          onClick={(event) => onRiskClick(event, site)}
          role="link"
          type="button"
        >
          {contents}
        </button>
      ) : (
          <a
            aria-label={`${site.name}，${site.description}${verificationLabel}`}
            className="site-link"
            data-focus-key={`site-link:${site.id}`}
          href={site.url}
          rel="noopener noreferrer nofollow"
          target="_blank"
        >
          {contents}
        </a>
      )}
      <button
        aria-label={`${isFavorite ? "取消收藏" : "收藏"} ${site.name}`}
        className={`favorite-button ${isFavorite ? "is-favorite" : ""}`}
        data-favorite-site-id={site.id}
        onClick={() => onFavorite(site.id)}
        type="button"
      >
        <span aria-hidden="true" className="favorite-icon">
          <Star size={20} weight={isFavorite ? "fill" : "regular"} />
        </span>
        <span className="favorite-label">{isFavorite ? "已收藏" : "收藏"}</span>
      </button>
    </article>
  );
}

function SiteSection({
  section,
  highlightQuery,
  favoriteIds,
  onFavorite,
  onDisclaimer,
  onRiskClick,
  riskAcknowledged,
}: {
  section: Section;
  highlightQuery?: string;
  favoriteIds: string[];
  onFavorite: (siteId: string) => void;
  onDisclaimer: () => void;
  onRiskClick: (event: MouseEvent<HTMLElement>, site: LinkedSite) => void;
  riskAcknowledged: boolean;
}) {
  return (
    <section className="site-section" aria-labelledby={`section-${section.id}`}>
      <div className="section-heading">
        <h2 id={`section-${section.id}`} tabIndex={-1}>
          {section.title}
        </h2>
        {section.count !== undefined ? <span className="section-count">{section.count} 个</span> : null}
        {section.showsDisclaimer ? (
          <button className="inline-disclaimer" onClick={onDisclaimer} type="button">
            （外部站点，请自行甄别）
          </button>
        ) : null}
      </div>
      <div className="site-list">
        {section.sites.map((site, index) => {
          const subsection = section.showsSubsections ? site.subsection : undefined;
          const startsSubsection = subsection !== undefined && subsection !== section.sites[index - 1]?.subsection;
          return (
            <Fragment key={site.id}>
              {startsSubsection ? <h3 className="site-subsection">{subsection}</h3> : null}
              <SiteRow
                highlightQuery={highlightQuery}
                isFavorite={favoriteIds.includes(site.id)}
                onFavorite={onFavorite}
                onRiskClick={onRiskClick}
                riskAcknowledged={riskAcknowledged}
                site={site}
              />
            </Fragment>
          );
        })}
      </div>
    </section>
  );
}

export function App({ catalog = generatedCatalog as SiteCatalog }: AppProps) {
  const [activeView, setActiveView] = useState<ViewId>("home");
  const [favoriteIds, setFavoriteIds] = useState<string[]>(getStoredFavorites);
  const [modal, setModal] = useState<ModalState>(null);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [query, setQuery] = useState("");
  const [riskAcknowledged, setRiskAcknowledged] = useState(getRiskAcknowledgement);
  const navRef = useRef<HTMLElement>(null);
  const navButtonRefs = useRef(new Map<ViewId, HTMLButtonElement>());
  const contentRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sectionJumpRef = useRef<HTMLElement>(null);
  const contentAnimationRef = useRef<Animation | null>(null);
  const favoriteAnimationRef = useRef<Animation | null>(null);
  const pendingFavoriteIdRef = useRef<string | null>(null);
  const modalActionHandledRef = useRef(false);
  const previousContentStateRef = useRef<{ mode: ContentMode; query: string; view: ViewId } | null>(null);
  // Set to null after a failed write so later toggles build on the in-memory list.
  const favoriteStorageRef = useRef(getBrowserStorage("localStorage"));
  // Results render from a deferred copy so typing stays responsive across 1500+ sites.
  const trimmedQuery = useDeferredValue(query).trim();
  const isSearching = trimmedQuery !== "";

  const closeModal = useCallback(() => {
    if (prefersReducedMotion()) {
      setModal(null);
      setIsModalClosing(false);
      return;
    }
    setIsModalClosing(true);
  }, []);
  const finishModalClose = useCallback(() => {
    setModal(null);
    setIsModalClosing(false);
  }, []);
  const openModal = useCallback((nextModal: Exclude<ModalState, null>) => {
    modalActionHandledRef.current = false;
    setIsModalClosing(false);
    setModal(nextModal);
  }, []);

  const categoryById = useMemo(
    () => new Map(catalog.categories.map((category) => [category.id, category])),
    [catalog.categories],
  );

  const sections = useMemo<Section[]>(() => {
    if (isSearching) {
      const sites = searchSites(catalog.sites, catalog.categories, trimmedQuery);
      return [
        {
          id: "search",
          title: "搜索结果",
          sites,
          count: sites.length,
          showsDisclaimer: sites.some((site) => site.riskLevel === "high"),
        },
      ];
    }

    if (activeView !== "home") {
      const category = categoryById.get(activeView);
      const sites = catalog.sites.filter((site) => site.category === activeView);
      if (category?.sections) {
        return [...category.sections]
          .sort((left, right) => left.order - right.order)
          .map((categorySection) => {
            const sectionSites = sites.filter((site) => site.section === categorySection.id);
            return {
              id: `${category.id}-${categorySection.id}`,
              title: categorySection.label,
              sites: sectionSites,
              count: sectionSites.length,
              showsDisclaimer: sectionSites.some((site) => site.riskLevel === "high"),
              showsSubsections: true,
            };
          });
      }
      return category
        ? [
            {
              id: category.id,
              title: category.homeLabel,
              sites,
              count: sites.length,
              showsDisclaimer: sites.some((site) => site.riskLevel === "high"),
            },
          ]
        : [];
    }

    const favoriteSites = favoriteIds
      .map((favoriteId) => catalog.sites.find((site) => site.id === favoriteId))
      .filter((site): site is Site => Boolean(site));
    const isNotFavorite = (site: Site) => !favoriteIds.includes(site.id);
    const homeGroups = new Map<string, Section & { order: number }>();
    for (const category of [...catalog.categories].sort((left, right) => left.order - right.order)) {
      if (category.homeMode === "hidden") continue;

      const candidates = catalog.sites.filter(
        (site) => site.category === category.id && isNotFavorite(site),
      );
      const categorySites =
        category.homeMode === "featured" ? candidates.filter((site) => site.featured) : candidates.slice(0, 1);
      if (categorySites.length === 0) continue;

      const existing = homeGroups.get(category.homeGroup);
      if (existing) {
        existing.sites.push(...categorySites);
        existing.showsDisclaimer ||= categorySites.some((site) => site.riskLevel === "high");
      } else {
        homeGroups.set(category.homeGroup, {
          id: category.homeGroup,
          order: category.homeOrder,
          showsDisclaimer: categorySites.some((site) => site.riskLevel === "high"),
          sites: [...categorySites],
          title: category.homeLabel,
        });
      }
    }

    return [
      ...(favoriteSites.length
        ? [
            {
              id: "favorites",
              title: "我的收藏",
              sites: favoriteSites,
              showsDisclaimer: favoriteSites.some((site) => site.riskLevel === "high"),
            },
          ]
        : []),
      ...[...homeGroups.values()].sort((left, right) => left.order - right.order),
    ];
  }, [activeView, catalog.categories, catalog.sites, categoryById, favoriteIds, isSearching, trimmedQuery]);

  const handleFavorite = (siteId: string) => {
    const { ids, persisted } = toggleFavorite(favoriteStorageRef.current, siteId, favoriteIds);
    if (!persisted) favoriteStorageRef.current = null;
    pendingFavoriteIdRef.current = siteId;
    setFavoriteIds(ids);
  };

  useLayoutEffect(() => {
    const siteId = pendingFavoriteIdRef.current;
    if (!siteId) return;
    pendingFavoriteIdRef.current = null;

    const favoriteButton = [...document.querySelectorAll<HTMLButtonElement>("[data-favorite-site-id]")].find(
      (button) => button.dataset.favoriteSiteId === siteId,
    );
    const focusTarget = favoriteButton ?? navButtonRefs.current.get(activeView);
    focusTarget?.focus({ preventScroll: true });

    const icon = favoriteButton?.querySelector<HTMLElement>(".favorite-icon");
    favoriteAnimationRef.current?.cancel();
    favoriteAnimationRef.current = null;
    if (!icon || typeof icon.animate !== "function" || prefersReducedMotion()) return;

    favoriteAnimationRef.current = icon.animate(
      [
        { transform: "scale(1)" },
        { offset: 0.45, transform: "scale(1.08)" },
        { transform: "scale(1)" },
      ],
      { duration: 220, easing: MOTION_EASING },
    );
  }, [activeView, favoriteIds]);

  const handleRiskClick = (event: MouseEvent<HTMLElement>, site: LinkedSite) => {
    event.preventDefault();
    openModal({ kind: "risk", site });
  };

  const handleContinue = (site: LinkedSite) => {
    if (modalActionHandledRef.current) return;
    modalActionHandledRef.current = true;
    writeStorageItem(getBrowserStorage("sessionStorage"), RISK_ACKNOWLEDGEMENT_KEY, "true");
    setRiskAcknowledged(true);
    window.open(site.url, "_blank", "noopener,noreferrer");
    closeModal();
  };

  const jumpToSection = (event: MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const heading = document.getElementById(`section-${sectionId}`);
    if (!heading) return;
    event.preventDefault();
    const target = heading.closest("section") ?? heading;
    if (typeof target.scrollIntoView === "function") {
      target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    }
    heading.focus({ preventScroll: true });
  };

  const clearSearch = () => {
    setQuery("");
    searchInputRef.current?.focus();
  };

  const navItems = [...catalog.categories]
    .sort((left, right) => left.order - right.order)
    .map((category) => ({
      categoryId: category.id,
      id: category.id === "common" ? ("home" as const) : category.id,
      label: category.navLabel,
    }));
  const contentMode: ContentMode = isSearching
    ? sections[0]?.sites.length
      ? "search-results"
      : "search-empty"
    : "browse";
  const activeCategory = activeView === "home" ? undefined : categoryById.get(activeView);
  const showsPageHeader = !isSearching && Boolean(activeCategory?.sections);
  const resultCount = isSearching ? (sections[0]?.sites.length ?? 0) : 0;

  useLayoutEffect(() => {
    const currentState = { mode: contentMode, query: trimmedQuery, view: activeView };
    const previousState = previousContentStateRef.current;
    previousContentStateRef.current = currentState;
    if (!previousState) return;

    const categoryChanged = previousState.view !== activeView;
    const searchStateChanged = previousState.mode !== contentMode;
    const queryChanged = previousState.query !== trimmedQuery;
    if (!categoryChanged && !searchStateChanged && !queryChanged) return;

    // The window may be scrolled deep into a long list; new content should start at its top.
    window.scrollTo({ top: 0, behavior: "instant" });
    // An instant scroll does not stop a section jump's smooth scroll from landing one more frame.
    requestAnimationFrame(() => {
      if (window.scrollY !== 0) window.scrollTo({ top: 0, behavior: "instant" });
    });
    if (!categoryChanged && !searchStateChanged) return;

    contentAnimationRef.current?.cancel();
    contentAnimationRef.current = null;
    if (prefersReducedMotion()) return;

    const content = contentRef.current;
    if (!content || typeof content.animate !== "function") return;

    const isCategoryTransition = categoryChanged && contentMode === "browse";
    contentAnimationRef.current = content.animate(
      isCategoryTransition
        ? [
            { opacity: 0.86, transform: "translateY(4px)" },
            { opacity: 1, transform: "translateY(0)" },
          ]
        : [{ opacity: 0.86 }, { opacity: 1 }],
      {
        duration: isCategoryTransition ? 240 : 200,
        easing: MOTION_EASING,
      },
    );
  }, [activeView, contentMode, trimmedQuery]);

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleReducedMotionChange = (event: MediaQueryListEvent) => {
      if (!event.matches) return;
      contentAnimationRef.current?.cancel();
      contentAnimationRef.current = null;
      favoriteAnimationRef.current?.cancel();
      favoriteAnimationRef.current = null;
    };

    reducedMotionQuery.addEventListener("change", handleReducedMotionChange);
    return () => reducedMotionQuery.removeEventListener("change", handleReducedMotionChange);
  }, []);

  useEffect(
    () => () => {
      contentAnimationRef.current?.cancel();
      favoriteAnimationRef.current?.cancel();
    },
    [],
  );

  useEffect(() => {
    if (modal) return;

    const handleShortcut = (event: KeyboardEvent) => {
      if (event.isComposing || event.altKey) return;
      const isCommandK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      const isSlash = event.key === "/" && !event.metaKey && !event.ctrlKey && !isEditableTarget(event.target);
      if (!isCommandK && !isSlash) return;

      const input = searchInputRef.current;
      if (!input) return;
      event.preventDefault();
      input.focus();
      input.select();
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [modal]);

  // Long jump bars overflow sideways; let a plain mouse wheel scroll them until an edge is reached.
  useEffect(() => {
    const jumpBar = sectionJumpRef.current;
    if (!showsPageHeader || !jumpBar) return;

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const maxScroll = jumpBar.scrollWidth - jumpBar.clientWidth;
      if (maxScroll <= 0) return;

      const delta = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaY * 16 : event.deltaY;
      const nextScroll = Math.min(maxScroll, Math.max(0, jumpBar.scrollLeft + delta));
      if (nextScroll === jumpBar.scrollLeft) return;
      event.preventDefault();
      jumpBar.scrollLeft = nextScroll;
    };

    jumpBar.addEventListener("wheel", handleWheel, { passive: false });
    return () => jumpBar.removeEventListener("wheel", handleWheel);
  }, [activeView, showsPageHeader]);

  const positionNavIndicator = useCallback(() => {
    const navigation = navRef.current;
    const activeButton = navButtonRefs.current.get(activeView);
    if (!navigation || !activeButton) return;

    navigation.style.setProperty("--nav-indicator-x", `${activeButton.offsetLeft}px`);
    navigation.style.setProperty("--nav-indicator-y", `${activeButton.offsetTop}px`);
    navigation.style.setProperty("--nav-indicator-width", `${activeButton.offsetWidth}px`);
    navigation.style.setProperty("--nav-indicator-height", `${activeButton.offsetHeight}px`);
    navigation.dataset.indicatorReady = "true";
    navigation.dataset.indicatorVisible = isSearching ? "false" : "true";
  }, [activeView, isSearching]);

  useLayoutEffect(() => {
    positionNavIndicator();
    window.addEventListener("resize", positionNavIndicator);
    return () => window.removeEventListener("resize", positionNavIndicator);
  }, [positionNavIndicator]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <Compass size={21} weight="fill" />
          </span>
          <span>kx导航站</span>
        </div>

        <nav aria-label="网站分类" className="sidebar-nav" ref={navRef}>
          <span aria-hidden="true" className="nav-indicator" data-testid="nav-indicator" />
          {navItems.map((item) => {
            const NavIcon = navIconById[item.categoryId];
            const isActive = activeView === item.id && !isSearching;
            return (
              <button
                aria-current={isActive ? "page" : undefined}
                className={`nav-item ${isActive ? "is-active" : ""}`}
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setQuery("");
                }}
                ref={(element) => {
                  if (element) navButtonRefs.current.set(item.id, element);
                  else navButtonRefs.current.delete(item.id);
                }}
                type="button"
              >
                <NavIcon size={23} weight={isActive ? "fill" : "regular"} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button className="disclaimer-button" onClick={() => openModal({ kind: "disclaimer" })} type="button">
          <ShieldWarning size={18} />
          免责声明
        </button>
      </aside>

      <div className="content-shell">
        <header className="topbar">
          <div className="search-field">
            <label className="search-label">
              <MagnifyingGlass size={24} aria-hidden="true" />
              <span className="sr-only">搜索网站</span>
              <input
                aria-keyshortcuts="/ Control+K Meta+K"
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Escape" || query === "") return;
                  event.preventDefault();
                  setQuery("");
                }}
                placeholder="搜索网站、分类或标签"
                ref={searchInputRef}
                type="search"
                value={query}
              />
            </label>
            {query ? (
              <button aria-label="清除搜索" className="search-clear" onClick={clearSearch} type="button">
                <X size={18} />
              </button>
            ) : (
              <kbd aria-hidden="true" className="search-shortcut">
                /
              </kbd>
            )}
          </div>
        </header>
        <p aria-live="polite" className="sr-only">
          {isSearching ? (resultCount ? `找到 ${resultCount} 个网站` : "没有找到匹配的网站") : ""}
        </p>

        <main className="main-content" data-testid="content-stage" ref={contentRef}>
          {showsPageHeader && activeCategory ? (
            <>
              <header className="page-header">
                <h1>{activeCategory.label}</h1>
                <span className="page-header-count">
                  {sections.reduce((total, section) => total + section.sites.length, 0)} 个网站
                </span>
              </header>
              {activeCategory.credit ? (
                <p className="page-credit">
                  <GithubLogo aria-hidden="true" className="page-credit-icon" size={16} weight="fill" />
                  <span>
                    本栏目收录自 GitHub 开源项目{" "}
                    <a href={activeCategory.credit.url} rel="noopener noreferrer" target="_blank">
                      {activeCategory.credit.label}
                      <ArrowSquareOut aria-hidden="true" size={13} />
                    </a>
                    ，依{" "}
                    <a href={activeCategory.credit.licenseUrl} rel="noopener noreferrer license" target="_blank">
                      {activeCategory.credit.license}
                    </a>{" "}
                    协议署名引用
                  </span>
                </p>
              ) : null}
              <nav aria-label="小节" className="section-jump" ref={sectionJumpRef}>
                {sections
                  .filter((section) => section.sites.length > 0)
                  .map((section) => (
                    <a
                      className="section-jump-link"
                      href={`#section-${section.id}`}
                      key={section.id}
                      onClick={(event) => jumpToSection(event, section.id)}
                    >
                      {section.title}
                      <span className="section-jump-count">{section.sites.length}</span>
                    </a>
                  ))}
              </nav>
            </>
          ) : null}
          {contentMode === "search-empty" ? (
            <div className="empty-state">
              <MagnifyingGlass size={32} />
              <h2>没有找到匹配的网站</h2>
              <p>换一个名称、域名、分类或标签试试。</p>
            </div>
          ) : (
            sections.map((section) => (
              <SiteSection
                favoriteIds={favoriteIds}
                highlightQuery={isSearching ? trimmedQuery : undefined}
                key={section.id}
                onDisclaimer={() => openModal({ kind: "disclaimer" })}
                onFavorite={handleFavorite}
                onRiskClick={handleRiskClick}
                riskAcknowledged={riskAcknowledged}
                section={section}
              />
            ))
          )}
        </main>
      </div>

      {modal ? (
        <Modal
          isClosing={isModalClosing}
          onClose={closeModal}
          onContinue={handleContinue}
          onExited={finishModalClose}
          state={modal}
        />
      ) : null}
    </div>
  );
}
