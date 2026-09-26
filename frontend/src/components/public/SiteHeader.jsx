import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import useLanguage from '../../i18n/useLanguage';
import LanguageSwitch from './LanguageSwitch';
import { sessionHomePath } from './session';
import './public.css';

// Section ids on the home page; the season pages link back to them as "/#id".
const NAV_ITEMS = [
  { id: 'seasons', key: 'nav.seasons' },
  { id: 'past', key: 'nav.past' },
  { id: 'moments', key: 'nav.moments' },
  { id: 'hall-of-fame', key: 'nav.fame' },
  { id: 'for-you', key: 'nav.forYou' },
];

export const BrandMark = ({ small = false }) => (
  <span className={`pub-mark${small ? ' pub-mark--sm' : ''}`} aria-hidden="true">
    SEAL<br />HACK
  </span>
);

const SiteHeader = ({ current }) => {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const homePath = sessionHomePath();

  const accountLinks = homePath ? (
    <Link to={homePath} className="pub-btn pub-btn--primary pub-btn--sm">{t('common.myEvents')}</Link>
  ) : (
    <>
      <Link to="/login" className="pub-header__login">{t('common.login')}</Link>
      <Link to="/register" className="pub-btn pub-btn--primary pub-btn--sm">{t('common.signup')}</Link>
    </>
  );

  const navLinks = (onNavigate) => NAV_ITEMS.map((item) => (
    <Link
      key={item.id}
      to={`/#${item.id}`}
      className="pub-nav__link"
      aria-current={current === item.id ? 'page' : undefined}
      onClick={onNavigate}
    >
      {t(item.key)}
    </Link>
  ));

  return (
    <header className="pub-header">
      <div className="pub-container pub-header__inner">
        <Link to="/" className="pub-brand" aria-label={t('common.homeLabel')}>
          <BrandMark />
          <span className="pub-brand__text">
            <span className="pub-brand__name">SEAL Hackathon</span>
            <span className="pub-brand__campus">{t('common.campus')}</span>
          </span>
        </Link>

        <nav className="pub-nav" aria-label={t('nav.label')}>{navLinks()}</nav>

        <div className="pub-header__actions">
          <LanguageSwitch />
          <div className="pub-header__account">{accountLinks}</div>
          <button
            type="button"
            className="pub-menu-btn"
            aria-expanded={menuOpen}
            aria-controls="pub-mobile-menu"
            aria-label={menuOpen ? t('common.closeMenu') : t('common.openMenu')}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div id="pub-mobile-menu" className="pub-mobile-menu">
          <nav className="pub-mobile-menu__nav" aria-label={t('nav.label')}>
            {navLinks(() => setMenuOpen(false))}
          </nav>
          <div className="pub-mobile-menu__account">{accountLinks}</div>
        </div>
      )}
    </header>
  );
};

export default SiteHeader;
