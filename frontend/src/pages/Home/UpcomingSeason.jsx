import { Link } from 'react-router-dom';
import { CalendarDays, Trophy, Users } from 'lucide-react';
import useLanguage from '../../i18n/useLanguage';
import { formatDateRange } from '../../i18n/format';
import { sessionHomePath } from '../../components/public/session';
import { upcomingStatus } from './upcomingEvent';

// `event` is undefined while the list loads, null when nothing is scheduled.
const UpcomingSeason = ({ event }) => {
  const { lang, t } = useLanguage();
  const homePath = sessionHomePath();

  if (event === undefined) {
    return (
      <section id="upcoming" className="pub-upcoming" aria-busy="true" aria-label={t('upcoming.label')}>
        <div className="pub-container">
          <div className="pub-upcoming__box pub-upcoming__box--loading" />
        </div>
      </section>
    );
  }

  if (!event) {
    return (
      <section id="upcoming" className="pub-upcoming" aria-label={t('upcoming.label')}>
        <div className="pub-container">
          <div className="pub-upcoming__box pub-upcoming__box--empty">
            <div className="pub-upcoming__info">
              <span className="pub-kicker">{t('upcoming.emptyKicker')}</span>
              <h2 className="pub-upcoming__title">{t('upcoming.emptyTitle')}</h2>
              <p className="pub-upcoming__desc">{t('upcoming.emptyDesc')}</p>
            </div>
            {!homePath && (
              <Link to="/register" className="pub-btn pub-btn--primary">{t('upcoming.emptyCta')}</Link>
            )}
          </div>
        </div>
      </section>
    );
  }

  const registration = formatDateRange(event.registrationStartDate, event.registrationEndDate, lang);
  const competition = formatDateRange(event.startDate, event.endDate, lang);
  const steps = t('upcoming.steps');

  return (
    <section id="upcoming" className="pub-upcoming" aria-label={t('upcoming.label')}>
      <div className="pub-container">
        <div className="pub-upcoming__box">
          <div className="pub-upcoming__info">
            <span className="pub-kicker">{t(`upcoming.status.${upcomingStatus(event)}`)}</span>
            <h2 className="pub-upcoming__title">{event.name}</h2>
            <p className="pub-upcoming__desc">{event.description || t('upcoming.defaultDesc')}</p>
            <ul className="pub-upcoming__meta">
              {registration && (
                <li><CalendarDays size={18} aria-hidden="true" />{t('upcoming.registration', { range: registration })}</li>
              )}
              {competition && (
                <li><Trophy size={18} aria-hidden="true" />{t('upcoming.competition', { range: competition })}</li>
              )}
              {event.maxTeams != null && (
                <li><Users size={18} aria-hidden="true" />{t('upcoming.maxTeams', { n: event.maxTeams })}</li>
              )}
              {event.currentTeams > 0 && (
                <li><Users size={18} aria-hidden="true" />{t('upcoming.joined', { n: event.currentTeams })}</li>
              )}
            </ul>
          </div>

          <div className="pub-upcoming__side">
            <ol className="pub-steps">
              {steps.map((step, i) => (
                <li key={step}>
                  <span className="pub-steps__num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="pub-steps__label">{step}</span>
                </li>
              ))}
            </ol>
            <div className="pub-upcoming__actions">
              {homePath ? (
                <Link to={homePath} className="pub-btn pub-btn--primary">{t('upcoming.enter')}</Link>
              ) : (
                <>
                  <Link to="/register" className="pub-btn pub-btn--primary">{t('upcoming.register')}</Link>
                  <Link to="/login" className="pub-btn pub-btn--outline">{t('common.login')}</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UpcomingSeason;
