import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import useLanguage from '../../i18n/useLanguage';
import { pickLocalized } from '../../i18n/translate';
import { formatDateRange } from '../../i18n/format';

const pad2 = (n) => String(n).padStart(2, '0');

const HeroCarousel = ({ seasons, photosSeasonSlug }) => {
  const { lang, t } = useLanguage();
  const [index, setIndex] = useState(0);
  const count = seasons.length;
  const season = seasons[index];
  const go = (next) => setIndex((next + count) % count);

  const dates = formatDateRange(season.startDate, season.endDate, lang);
  const kicker = [season.code, t('common.seasonNo', { n: season.number }), dates].filter(Boolean).join(' · ');
  const champion = season.winners?.first?.team || t('common.updating');
  const alt = season.cover.placeholder ? t('common.placeholderAlt') : pickLocalized(season.cover.alt, lang);
  const stats = [
    { value: season.stats.teams, label: t('hero.teams') },
    { value: season.stats.finalists, label: t('hero.finalists') },
    { value: season.stats.prizes, label: t('hero.prizes') },
  ].filter((stat) => stat.value != null);

  return (
    <section id="seasons" className="pub-hero" aria-label={t('hero.label')}>
      <div className="pub-hero__tabs" role="group" aria-label={t('hero.tabs')}>
        {seasons.map((item, i) => (
          <button
            key={item.slug}
            type="button"
            className="pub-hero__tab"
            aria-pressed={i === index}
            onClick={() => setIndex(i)}
          >
            {item.name}
          </button>
        ))}
      </div>

      <div className="pub-hero__stage">
        <img
          key={season.slug}
          className="pub-hero__img"
          src={season.cover.src}
          alt={alt}
          style={{ objectPosition: season.cover.position }}
        />
        <div className="pub-container pub-hero__overlay">
          <div className="pub-hero__card" aria-live="polite">
            <span className="pub-kicker">{kicker}</span>
            <h1 className="pub-hero__title">SEAL Hackathon {season.name}</h1>
            <p className="pub-hero__theme">{season.theme || t('past.firstSeason')}</p>
            <p className="pub-hero__champion">
              <Trophy size={20} aria-hidden="true" />
              {t('hero.champion', { name: champion })}
            </p>
            {stats.length > 0 && (
              <dl className="pub-hero__stats">
                {stats.map((stat) => (
                  <div key={stat.label} className="pub-stat">
                    <dt>{stat.label}</dt>
                    <dd>{stat.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <div className="pub-hero__actions">
              <Link to={`/seasons/${season.slug}`} className="pub-btn pub-btn--primary">
                {t('hero.recap')}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              {season.slug === photosSeasonSlug && (
                <Link to="/#moments" className="pub-btn pub-btn--outline">{t('hero.photos')}</Link>
              )}
            </div>
          </div>

          {count > 1 && (
            <div className="pub-hero__controls">
              <button type="button" className="pub-icon-btn" aria-label={t('hero.prev')} onClick={() => go(index - 1)}>
                <ChevronLeft size={22} aria-hidden="true" />
              </button>
              <span className="pub-hero__counter">{pad2(index + 1)} / {pad2(count)}</span>
              <button type="button" className="pub-icon-btn" aria-label={t('hero.next')} onClick={() => go(index + 1)}>
                <ChevronRight size={22} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroCarousel;
