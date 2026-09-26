import useLanguage from '../../i18n/useLanguage';
import { pickLocalized } from '../../i18n/translate';

const MomentsGallery = ({ season }) => {
  const { lang, t } = useLanguage();
  if (!season) return null;

  return (
    <section id="moments" className="pub-section pub-section--paper" aria-labelledby="moments-title">
      <div className="pub-container">
        <div className="pub-section__head">
          <div className="pub-section__intro">
            <span className="pub-kicker">{t('moments.kicker', { season: season.name })}</span>
            <h2 id="moments-title" className="pub-section__title">{t('moments.title')}</h2>
            {season.momentsIntro && <p className="pub-section__desc">{pickLocalized(season.momentsIntro, lang)}</p>}
          </div>
          <span className="pub-credit">{t('common.photoCredit')}</span>
        </div>

        <ul className="pub-moments">
          {season.moments.slice(0, 5).map((moment) => {
            const caption = pickLocalized(moment.caption, lang);
            return (
              <li key={moment.src}>
                <figure className="pub-photo">
                  <img src={moment.src} alt={`${caption}, SEAL Hackathon ${season.name}`} loading="lazy" />
                  <figcaption>{caption}</figcaption>
                </figure>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};

export default MomentsGallery;
