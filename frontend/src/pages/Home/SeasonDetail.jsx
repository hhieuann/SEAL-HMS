import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Trophy } from 'lucide-react';
import SiteHeader from '../../components/public/SiteHeader';
import SiteFooter from '../../components/public/SiteFooter';
import useLanguage from '../../i18n/useLanguage';
import { pickLocalized } from '../../i18n/translate';
import { formatDate, formatDateRange, formatMoney } from '../../i18n/format';
import { SEASONS, findSeason } from '../../data/seasons';
import './SeasonDetail.css';

// Listed 1-2-3 for screen readers; the stylesheet lays them out 2-1-3 like a podium.
const PODIUM = [
  { key: 'first', place: 1 },
  { key: 'second', place: 2 },
  { key: 'third', place: 3 },
];

const NotFound = () => {
  const { t } = useLanguage();
  return (
    <section className="pub-section">
      <div className="pub-container pub-season__missing">
        <h1 className="pub-section__title">{t('season.notFoundTitle')}</h1>
        <p className="pub-section__desc">{t('season.notFoundDesc')}</p>
        <Link to="/" className="pub-btn pub-btn--primary">{t('season.backHome')}</Link>
      </div>
    </section>
  );
};

const SeasonNav = ({ season }) => {
  const { t } = useLanguage();
  const index = SEASONS.indexOf(season);
  const older = SEASONS[index + 1];
  const newer = SEASONS[index - 1];

  return (
    <nav className="pub-container pub-season__nav" aria-label={t('season.allSeasons')}>
      {older ? (
        <Link to={`/seasons/${older.slug}`} className="pub-season__nav-link">
          <span className="pub-season__nav-hint"><ChevronLeft size={16} aria-hidden="true" />{t('season.older')}</span>
          <span className="pub-season__nav-name">SEAL Hackathon {older.name}</span>
        </Link>
      ) : <span />}
      {newer ? (
        <Link to={`/seasons/${newer.slug}`} className="pub-season__nav-link pub-season__nav-link--end">
          <span className="pub-season__nav-hint">{t('season.newer')}<ChevronRight size={16} aria-hidden="true" /></span>
          <span className="pub-season__nav-name">SEAL Hackathon {newer.name}</span>
        </Link>
      ) : (
        <Link to="/#past" className="pub-season__nav-link pub-season__nav-link--end">
          <span className="pub-season__nav-hint">{t('season.backHome')}<ChevronRight size={16} aria-hidden="true" /></span>
          <span className="pub-season__nav-name">{t('season.allSeasons')}</span>
        </Link>
      )}
    </nav>
  );
};

const SeasonContent = ({ season }) => {
  const { lang, t } = useLanguage();
  const dates = formatDateRange(season.startDate, season.endDate, lang);
  const venue = pickLocalized(season.venue, lang);
  const bannerAlt = season.banner.placeholder ? t('common.placeholderAlt') : pickLocalized(season.banner.alt, lang);
  const stats = [
    { value: season.stats.teams, label: t('season.statTeams') },
    { value: season.stats.finalists, label: t('season.statFinalists') },
    { value: season.stats.prizes, label: t('season.statPrizes') },
    { value: season.stats.teamSize, label: t('season.statTeamSize') },
  ];
  const hasDetails = season.schedule || season.format || season.prizes;

  return (
    <>
      <nav className="pub-container pub-breadcrumb" aria-label={t('season.breadcrumb')}>
        <Link to="/">{t('season.home')}</Link>
        <span aria-hidden="true">/</span>
        <Link to="/#past">{t('season.past')}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{season.name}</span>
      </nav>

      <section className="pub-season__hero">
        <div className="pub-season__intro">
          <span className="pub-kicker">{t('season.kicker', { code: season.code, n: season.number })}</span>
          <h1 className="pub-season__title">SEAL Hackathon {season.name}</h1>
          {season.theme && (
            <div className="pub-season__theme">
              <span>{t('season.theme')}</span>
              <strong>{season.theme}</strong>
            </div>
          )}
          <p className="pub-season__summary">{pickLocalized(season.summary, lang)}</p>
          <ul className="pub-season__facts">
            <li><CalendarDays size={18} aria-hidden="true" />{dates || t('common.updating')}</li>
            {venue && <li><MapPin size={18} aria-hidden="true" />{venue}</li>}
          </ul>
          {hasDetails && (
            <div className="pub-season__actions">
              <a href="#results" className="pub-btn pub-btn--primary">{t('season.viewResults')}</a>
              {season.gallery && <a href="#photos" className="pub-btn pub-btn--outline">{t('season.viewPhotos')}</a>}
            </div>
          )}
        </div>
        <div className="pub-season__banner">
          <img src={season.banner.src} alt={bannerAlt} />
        </div>
      </section>

      <div className="pub-container">
        <dl className="pub-season__stats">
          {stats.map((stat) => (
            <div key={stat.label} className="pub-season__stat">
              <dt>{stat.label}</dt>
              <dd>{stat.value ?? '—'}</dd>
            </div>
          ))}
        </dl>
      </div>

      {!hasDetails && (
        <section className="pub-section">
          <div className="pub-container"><p className="pub-section__desc">{t('season.comingSoon')}</p></div>
        </section>
      )}

      {season.schedule && (
        <section className="pub-season__block" aria-labelledby="schedule-title">
          <div className="pub-container">
            <h2 id="schedule-title" className="pub-season__heading">{t('season.schedule')}</h2>
            <ol className="pub-timeline">
              {season.schedule.map((item, i) => (
                <li key={`${item.date}-${i}`} className={i === season.schedule.length - 1 ? 'is-last' : undefined}>
                  <span className="pub-timeline__when">
                    {[formatDate(item.date, lang), item.time].filter(Boolean).join(' · ')}
                  </span>
                  <span className="pub-timeline__title">{pickLocalized(item.title, lang)}</span>
                  <span className="pub-timeline__desc">{pickLocalized(item.desc, lang)}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {(season.format || season.prizes) && (
        <section className="pub-season__block">
          <div className="pub-container pub-season__split">
            {season.format && (
              <div>
                <h2 className="pub-season__heading">{t('season.format')}</h2>
                <ol className="pub-rules">
                  {season.format.map((rule, i) => (
                    <li key={i}>
                      <span className="pub-rules__num">{String(i + 1).padStart(2, '0')}</span>
                      <span>{pickLocalized(rule, lang)}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {season.prizes && (
              <div>
                <h2 className="pub-season__heading">{t('season.prizes')}</h2>
                <ul className="pub-prizes">
                  {season.prizes.map((prize, i) => (
                    <li key={prize.key} className={i === 0 ? 'is-top' : undefined}>
                      <span className="pub-prizes__name">
                        {i === 0 && <Trophy size={22} aria-hidden="true" />}
                        {t(`season.prizeNames.${prize.key}`)}
                      </span>
                      <span className="pub-prizes__amount">{formatMoney(prize.amount, lang)}</span>
                    </li>
                  ))}
                </ul>
                <p className="pub-season__note">{t('season.prizeNote')}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {season.criteria && (
        <section className="pub-season__block" aria-labelledby="criteria-title">
          <div className="pub-container">
            <h2 id="criteria-title" className="pub-season__heading">{t('season.criteria')}</h2>
            <div className="pub-season__split">
              {['prelim', 'final'].map((round) => (
                <div key={round}>
                  <h3 className="pub-season__subheading">{t(`season.${round}`)}</h3>
                  <ul className="pub-criteria">
                    {season.criteria[round].map((item) => (
                      <li key={item.weight + pickLocalized(item.label, 'vi')}>
                        <span>{pickLocalized(item.label, lang)}</span>
                        <span className="pub-criteria__weight">{item.weight}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {hasDetails && (
        <section id="results" className="pub-section" aria-labelledby="results-title">
          <div className="pub-container">
            <div className="pub-section__head">
              <h2 id="results-title" className="pub-season__heading">{t('season.results')}</h2>
              {!season.winners && <p className="pub-season__note">{t('season.resultsPending')}</p>}
            </div>
            <ol className="pub-podium">
              {PODIUM.map(({ key, place }) => {
                const winner = season.winners?.[key];
                return (
                  <li key={key} className={`pub-podium__slot pub-podium__slot--${place}`}>
                    <div className="pub-podium__card">
                      <span className="pub-podium__prize">
                        {place === 1 && <Trophy size={16} aria-hidden="true" />}
                        {t(`season.prizeNames.${key}`)}
                      </span>
                      <span className="pub-podium__team">{winner?.team || t('common.updating')}</span>
                      {winner?.project && <span className="pub-podium__project">{winner.project}</span>}
                    </div>
                    <div className="pub-podium__step" aria-hidden="true">{place}</div>
                  </li>
                );
              })}
            </ol>
            {season.finalists && (
              <div className="pub-finalists">
                <h3 className="pub-season__subheading">{t('season.finalistsTitle', { n: season.finalists.length })}</h3>
                <ul>
                  {season.finalists.map((team) => <li key={team}>{team}</li>)}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {season.gallery && (
        <section id="photos" className="pub-section pub-section--paper" aria-labelledby="photos-title">
          <div className="pub-container">
            <div className="pub-section__head">
              <h2 id="photos-title" className="pub-season__heading">{t('season.gallery')}</h2>
              <span className="pub-credit">{t('common.photoCredit')}</span>
            </div>
            <ul className="pub-gallery">
              {season.gallery.map((photo) => {
                const caption = pickLocalized(photo.caption, lang);
                return (
                  <li key={photo.src}>
                    <figure className="pub-photo">
                      <img src={photo.src} alt={`${caption}, SEAL Hackathon ${season.name}`} loading="lazy" />
                      <figcaption>{caption}</figcaption>
                    </figure>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      <SeasonNav season={season} />
    </>
  );
};

const SeasonDetail = () => {
  const { slug } = useParams();
  const season = findSeason(slug);

  useEffect(() => {
    window.scrollTo?.(0, 0);
  }, [slug]);

  return (
    <div className="pub">
      <SiteHeader current="past" />
      <main>{season ? <SeasonContent season={season} /> : <NotFound />}</main>
      <SiteFooter />
    </div>
  );
};

export default SeasonDetail;
