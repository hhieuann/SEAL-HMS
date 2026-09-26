import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Trophy, Users } from 'lucide-react';
import useLanguage from '../../i18n/useLanguage';
import { pickLocalized } from '../../i18n/translate';
import { formatDateRange } from '../../i18n/format';

const SeasonCard = ({ season }) => {
  const { lang, t } = useLanguage();
  const dates = formatDateRange(season.startDate, season.endDate, lang) || t('common.updating');
  const alt = season.card.placeholder ? t('common.placeholderAlt') : pickLocalized(season.card.alt, lang);
  const champion = season.winners?.first?.team || t('common.updating');

  return (
    <Link to={`/seasons/${season.slug}`} className="pub-card">
      <div className="pub-card__media">
        <img src={season.card.src} alt={alt} loading="lazy" />
        <span className="pub-card__badge">{season.code} · {t('common.seasonNo', { n: season.number })}</span>
      </div>
      <div className="pub-card__body">
        <span className="pub-card__dates">{dates}</span>
        <h3 className="pub-card__title">SEAL Hackathon {season.name}</h3>
        <p className="pub-card__theme">{season.theme || t('past.firstSeason')}</p>
        <p className="pub-card__meta">
          {season.stats.finalists != null && (
            <span><Users size={16} aria-hidden="true" />{t('past.finalists', { n: season.stats.finalists })}</span>
          )}
          <span><Trophy size={16} aria-hidden="true" />{t('hero.champion', { name: champion })}</span>
        </p>
        <span className="pub-card__more">
          {t('past.recap')}
          <ArrowRight size={16} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
};

const PastSeasons = ({ seasons }) => {
  const { t } = useLanguage();
  const [year, setYear] = useState('all');
  const years = [...new Set(seasons.map((season) => season.year))].sort((a, b) => b - a);
  const visible = year === 'all' ? seasons : seasons.filter((season) => season.year === year);

  return (
    <section id="past" className="pub-section" aria-labelledby="past-title">
      <div className="pub-container">
        <div className="pub-section__head">
          <div className="pub-section__intro">
            <span className="pub-kicker">{t('past.kicker', { n: seasons.length })}</span>
            <h2 id="past-title" className="pub-section__title">{t('past.title')}</h2>
            <p className="pub-section__desc">{t('past.desc')}</p>
          </div>
          <div className="pub-filter" role="group" aria-label={t('past.filter')}>
            {['all', ...years].map((value) => (
              <button
                key={value}
                type="button"
                className="pub-chip"
                aria-pressed={year === value}
                onClick={() => setYear(value)}
              >
                {value === 'all' ? t('past.all') : value}
              </button>
            ))}
          </div>
        </div>

        {visible.length > 0 ? (
          <ul className="pub-past__grid">
            {visible.map((season) => (
              <li key={season.slug}><SeasonCard season={season} /></li>
            ))}
          </ul>
        ) : (
          <p className="pub-section__desc">{t('past.empty')}</p>
        )}
      </div>
    </section>
  );
};

export default PastSeasons;
