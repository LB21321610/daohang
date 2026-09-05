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
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";

import generatedCatalog from "../generated/sites.json";
import { searchSites } from "../domain/search";
import type { CategoryId, LinkedSite, Site, SiteCatalog } from "../domain/site";
import { readFavoriteIds, toggleFavorite } from "../features/favorites/favoriteStore";

const RISK_ACKNOWLEDGEMENT_KEY = "personal-nav:risk-ack:v1";
const DISCLAIMER =
  "本站仅提供公开网址索引，不存储、上传或分发第三方文件，也不对外部站点的合法性、安全性、准确性或可用性作保证。访问和使用第三方内容前，请自行确认所在地法律、软件许可及版权要求；由此产生的风险由访问者自行承担。";

type ViewId = "home" | CategoryId;
type ModalState = { kind: "disclaimer" } | { kind: "risk"; site: LinkedSite } | null;

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
  video: FilmStrip,
  media: Newspaper,
};

function getStoredFavorites(): string[] {
  return typeof window === "undefined" ? [] : readFavoriteIds(window.localStorage);
}

function getRiskAcknowledgement(): boolean {
  return typeof window !== "undefined" && window.sessionStorage.getItem(RISK_ACKNOWLEDGEMENT_KEY) === "true";
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
  state,
  onClose,
  onContinue,
}: {
  state: Exclude<ModalState, null>;
  onClose: () => void;
  onContinue: (site: LinkedSite) => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const isRisk = state.kind === "risk";

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
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
      previousFocusRef.current?.focus();
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
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
        <button className="modal-close" onClick={onClose} ref={closeButtonRef} type="button">
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
          <button className="button button--secondary" onClick={onClose} type="button">
            {isRisk ? "取消" : "知道了"}
          </button>
          {isRisk ? (
            <button className="button button--primary" onClick={() => onContinue(state.site)} type="button">
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
  const contents = (
    <>
      <SiteIcon site={site} />
      <span className="site-name">{site.name}</span>
      <span className="site-description">{site.description}</span>
    </>
  );

  return (
    <article className="site-row">
      {gated ? (
        <button
          aria-label={`${site.name}，${site.description}`}
          className="site-link site-link-button"
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
          aria-label={`${site.name}，${site.description}`}
          className="site-link"
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
        onClick={() => onFavorite(site.id)}
        type="button"
      >
        <Star size={20} weight={isFavorite ? "fill" : "regular"} />
        <span>{isFavorite ? "已收藏" : "收藏"}</span>
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
  const [query, setQuery] = useState("");
  const [riskAcknowledged, setRiskAcknowledged] = useState(getRiskAcknowledgement);

  const closeModal = useCallback(() => setModal(null), []);

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
    setFavoriteIds(toggleFavorite(window.localStorage, siteId));
  };

  const handleRiskClick = (event: MouseEvent<HTMLElement>, site: LinkedSite) => {
    event.preventDefault();
    setModal({ kind: "risk", site });
  };

  const handleContinue = (site: LinkedSite) => {
    window.sessionStorage.setItem(RISK_ACKNOWLEDGEMENT_KEY, "true");
    setRiskAcknowledged(true);
    setModal(null);
    window.open(site.url, "_blank", "noopener,noreferrer");
  };

  const navItems = [...catalog.categories]
    .sort((left, right) => left.order - right.order)
    .map((category) => ({
      categoryId: category.id,
      id: category.id === "common" ? ("home" as const) : category.id,
      label: category.navLabel,
    }));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <Compass size={21} weight="fill" />
          </span>
          <span>个人导航</span>
        </div>

        <nav aria-label="网站分类" className="sidebar-nav">
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
                type="button"
              >
                <NavIcon size={23} weight={isActive ? "fill" : "regular"} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button className="disclaimer-button" onClick={() => setModal({ kind: "disclaimer" })} type="button">
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

        <main className="main-content">
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
                onDisclaimer={() => setModal({ kind: "disclaimer" })}
                onFavorite={handleFavorite}
                onRiskClick={handleRiskClick}
                riskAcknowledged={riskAcknowledged}
                section={section}
              />
            ))
          )}
        </main>
      </div>

      {modal ? <Modal onClose={closeModal} onContinue={handleContinue} state={modal} /> : null}
    </div>
  );
}
