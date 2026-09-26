import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import useLanguage from '../../i18n/useLanguage';
import { upcomingStatus } from './upcomingEvent';

const AnnouncementBar = ({ event }) => {
  const { t } = useLanguage();
  if (!event) return null;

  return (
    <div className="pub-announce">
      <div className="pub-container pub-announce__inner">
        <span>{t(`announce.${upcomingStatus(event)}`, { name: event.name })}</span>
        <Link to="/#upcoming" className="pub-announce__cta">
          {t('announce.cta')}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
};

export default AnnouncementBar;
