import {
  AppWindow,
  AppleLogo,
  Archive,
  Brain,
  ChatCircleDots,
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
  ShieldWarning,
  Sparkle,
  SquaresFour,
  Star,
  WindowsLogo,
  X,
  type Icon,
} from "@phosphor-icons/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";

import generatedCatalog from "../generated/sites.json";
import { searchSites } from "../domain/search";
import type { CategoryId, LinkedSite, Site, SiteCatalog } from "../domain/site";
import { readFavoriteIds, toggleFavorite } from "../features/favorites/favoriteStore";

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
  showsDisclaimer?: boolean;
}

const iconByName: Record<string, Icon> = {
  "app-window": AppWindow,
  anthropic: ChatCircleDots,
  archive: Archive,
  bilibili: Desktop,
  database: SquaresFour,
  github: GithubLogo,
  google: GoogleLogo,
  microsoft: SquaresFour,
  midjourney: PaintBrush,
  notion: NotionLogo,
  openai: OpenAiLogo,
  perplexity: Sparkle,
  windows: WindowsLogo,
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
};

function getStoredFavorites(): string[] {
  return typeof window === "undefined" ? [] : readFavoriteIds(window.localStorage);
}

function getRiskAcknowledgement(): boolean {
  return typeof window !== "undefined" && window.sessionStorage.getItem(RISK_ACKNOWLEDGEMENT_KEY) === "true";
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
  isFavorite,
  onFavorite,
  onRiskClick,
  riskAcknowledged,
}: {
  site: Site;
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
          <span className="site-name">{site.name}</span>
          <span className="site-description">{site.description}</span>
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
        <span className="site-name">{site.name}</span>
        {site.linkStatus === "unchecked" ? (
          <span aria-hidden="true" className="site-link-status">
            待核验
          </span>
        ) : null}
      </span>
      <span className="site-description">{site.description}</span>
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
  favoriteIds,
  onFavorite,
  onDisclaimer,
  onRiskClick,
  riskAcknowledged,
}: {
  section: Section;
  favoriteIds: string[];
  onFavorite: (siteId: string) => void;
  onDisclaimer: () => void;
  onRiskClick: (event: MouseEvent<HTMLElement>, site: LinkedSite) => void;
  riskAcknowledged: boolean;
}) {
  return (
    <section className="site-section" aria-labelledby={`section-${section.id}`}>
      <div className="section-heading">
        <h2 id={`section-${section.id}`}>{section.title}</h2>
        {section.showsDisclaimer ? (
          <button className="inline-disclaimer" onClick={onDisclaimer} type="button">
            （外部站点，请自行甄别）
          </button>
        ) : null}
      </div>
      <div className="site-list">
        {section.sites.map((site) => (
          <SiteRow
            isFavorite={favoriteIds.includes(site.id)}
            key={site.id}
            onFavorite={onFavorite}
            onRiskClick={onRiskClick}
            riskAcknowledged={riskAcknowledged}
            site={site}
          />
        ))}
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
  const contentAnimationRef = useRef<Animation | null>(null);
  const favoriteAnimationRef = useRef<Animation | null>(null);
  const pendingFavoriteIdRef = useRef<string | null>(null);
  const modalActionHandledRef = useRef(false);
  const previousContentStateRef = useRef<{ mode: ContentMode; view: ViewId } | null>(null);

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
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      const sites = searchSites(catalog.sites, catalog.categories, trimmedQuery);
      return [
        {
          id: "search",
          title: "搜索结果",
          sites,
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
              showsDisclaimer: sectionSites.some((site) => site.riskLevel === "high"),
            };
          });
      }
      return category
        ? [
            {
              id: category.id,
              title: category.homeLabel,
              sites,
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
      ...(favoriteSites.length ? [{ id: "favorites", title: "我的收藏", sites: favoriteSites }] : []),
      ...[...homeGroups.values()].sort((left, right) => left.order - right.order),
    ];
  }, [activeView, catalog.categories, catalog.sites, categoryById, favoriteIds, query]);

  const handleFavorite = (siteId: string) => {
    pendingFavoriteIdRef.current = siteId;
    setFavoriteIds(toggleFavorite(window.localStorage, siteId));
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
    window.sessionStorage.setItem(RISK_ACKNOWLEDGEMENT_KEY, "true");
    setRiskAcknowledged(true);
    window.open(site.url, "_blank", "noopener,noreferrer");
    closeModal();
  };

  const navItems = [...catalog.categories]
    .sort((left, right) => left.order - right.order)
    .map((category) => ({
      categoryId: category.id,
      id: category.id === "common" ? ("home" as const) : category.id,
      label: category.navLabel,
    }));
  const contentMode: ContentMode = query.trim()
    ? sections[0]?.sites.length
      ? "search-results"
      : "search-empty"
    : "browse";

  useLayoutEffect(() => {
    const currentState = { mode: contentMode, view: activeView };
    const previousState = previousContentStateRef.current;
    previousContentStateRef.current = currentState;
    if (!previousState) return;

    const categoryChanged = previousState.view !== activeView;
    const searchStateChanged = previousState.mode !== contentMode;
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
  }, [activeView, contentMode]);

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

  const positionNavIndicator = useCallback(() => {
    const navigation = navRef.current;
    const activeButton = navButtonRefs.current.get(activeView);
    if (!navigation || !activeButton) return;

    navigation.style.setProperty("--nav-indicator-x", `${activeButton.offsetLeft}px`);
    navigation.style.setProperty("--nav-indicator-y", `${activeButton.offsetTop}px`);
    navigation.style.setProperty("--nav-indicator-width", `${activeButton.offsetWidth}px`);
    navigation.style.setProperty("--nav-indicator-height", `${activeButton.offsetHeight}px`);
    navigation.dataset.indicatorReady = "true";
    navigation.dataset.indicatorVisible = query ? "false" : "true";
  }, [activeView, query]);

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
            const isActive = activeView === item.id && !query;
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
          <label className="search-field">
            <MagnifyingGlass size={24} aria-hidden="true" />
            <span className="sr-only">搜索网站</span>
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索网站、分类或标签"
              type="search"
              value={query}
            />
          </label>
        </header>

        <main className="main-content" data-testid="content-stage" ref={contentRef}>
          {query.trim() && sections[0]?.sites.length === 0 ? (
            <div className="empty-state">
              <MagnifyingGlass size={32} />
              <h2>没有找到匹配的网站</h2>
              <p>换一个名称、域名、分类或标签试试。</p>
            </div>
          ) : (
            sections.map((section) => (
              <SiteSection
                favoriteIds={favoriteIds}
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
