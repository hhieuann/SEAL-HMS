import { Link } from 'react-router-dom';
import { ArrowRight, Trophy } from 'lucide-react';
import useLanguage from '../../i18n/useLanguage';

const HallOfFame = ({ seasons }) => {
  const { t } = useLanguage();

  return (
    <section id="hall-of-fame" className="pub-section pub-section--dark" aria-labelledby="fame-title">
      <div className="pub-container">
        <div className="pub-section__head">
          <div className="pub-section__intro">
            <span className="pub-kicker">{t('fame.kicker')}</span>
            <h2 id="fame-title" className="pub-section__title">{t('fame.title')}</h2>
            <p className="pub-section__desc">{t('fame.desc')}</p>
          </div>
          <Link to="/#past" className="pub-fame__all">
            {t('fame.all')}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>

        <ul className="pub-fame__grid">
          {seasons.map((season) => {
            const winner = season.winners?.first;
            return (
              <li key={season.slug}>
                <Link to={`/seasons/${season.slug}`} className="pub-fame__card">
                  <span className="pub-fame__label">
                    <span className="pub-fame__icon"><Trophy size={22} aria-hidden="true" /></span>
                    {season.code} · {t('fame.champion')}
                  </span>
                  {winner ? (
                    <>
                      <span className="pub-fame__team">{winner.team}</span>
                      {winner.project && <span className="pub-fame__project">{t('fame.project')}: {winner.project}</span>}
                      {winner.track && <span className="pub-fame__project">{t('fame.track')}: {winner.track}</span>}
                    </>
                  ) : (
                    <>
                      <span className="pub-fame__team pub-fame__team--pending">{t('fame.pending')}</span>
                      <span className="pub-fame__project">SEAL Hackathon {season.name}</span>
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

export default HallOfFame;
