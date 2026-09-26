import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import useLanguage from '../../i18n/useLanguage';
import { BrandMark } from './SiteHeader';
import './public.css';

const SiteFooter = () => {
  const { t } = useLanguage();

  return (
    <footer className="pub-footer">
      <div className="pub-container">
        <div className="pub-footer__grid">
          <div className="pub-footer__brand">
            <span className="pub-footer__brand-row">
              <BrandMark small />
              <span className="pub-footer__name">SEAL Hackathon</span>
            </span>
            <p>{t('footer.desc')}</p>
          </div>

          <nav className="pub-footer__col" aria-label={t('footer.explore')}>
            <span className="pub-footer__heading">{t('footer.explore')}</span>
            <Link to="/#seasons">{t('nav.seasons')}</Link>
            <Link to="/#past">{t('nav.past')}</Link>
            <Link to="/#hall-of-fame">{t('nav.fame')}</Link>
          </nav>

          <nav className="pub-footer__col" aria-label={t('footer.account')}>
            <span className="pub-footer__heading">{t('footer.account')}</span>
            <Link to="/login">{t('common.login')}</Link>
            <Link to="/register">{t('common.signup')}</Link>
            <Link to="/#for-you">{t('nav.forYou')}</Link>
          </nav>

          <address className="pub-footer__col">
            <span className="pub-footer__heading">{t('footer.contact')}</span>
            <span className="pub-footer__contact"><MapPin size={18} aria-hidden="true" />{t('footer.address')}</span>
            <span className="pub-footer__contact"><Phone size={18} aria-hidden="true" />(028) 7300 5588</span>
            <a className="pub-footer__contact" href="mailto:tuyensinhhcm@fpt.edu.vn">
              <Mail size={18} aria-hidden="true" />tuyensinhhcm@fpt.edu.vn
            </a>
          </address>
        </div>
        <p className="pub-footer__bottom">{t('footer.copyright', { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
};

export default SiteFooter;
