import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardCheck, GraduationCap, LayoutDashboard } from 'lucide-react';
import useLanguage from '../../i18n/useLanguage';

const ROLES = [
  { key: 'student', Icon: GraduationCap, to: '/register' },
  { key: 'lecturer', Icon: ClipboardCheck, to: '/login' },
  { key: 'organizer', Icon: LayoutDashboard, to: '/login' },
];

const ForYou = () => {
  const { t } = useLanguage();

  return (
    <section id="for-you" className="pub-section" aria-labelledby="for-you-title">
      <div className="pub-container">
        <div className="pub-section__head">
          <div className="pub-section__intro">
            <span className="pub-kicker">{t('forYou.kicker')}</span>
            <h2 id="for-you-title" className="pub-section__title">{t('forYou.title')}</h2>
          </div>
        </div>

        <ul className="pub-roles">
          {ROLES.map(({ key, Icon, to }) => (
            <li key={key} className="pub-role">
              <span className="pub-role__icon"><Icon size={28} aria-hidden="true" /></span>
              <h3 className="pub-role__title">{t(`forYou.${key}.title`)}</h3>
              <p className="pub-role__desc">{t(`forYou.${key}.desc`)}</p>
              <ul className="pub-role__points">
                {t(`forYou.${key}.points`).map((point) => <li key={point}>{point}</li>)}
              </ul>
              <Link to={to} className="pub-link pub-role__cta">
                {t(`forYou.${key}.cta`)}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default ForYou;
