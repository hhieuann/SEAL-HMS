import useLanguage from '../../i18n/useLanguage';

const OPTIONS = [
  { lang: 'vi', short: 'VI', label: 'Tiếng Việt' },
  { lang: 'en', short: 'EN', label: 'English' },
];

const LanguageSwitch = () => {
  const { lang, setLang, t } = useLanguage();

  return (
    <div className="pub-lang" role="group" aria-label={t('common.language')}>
      {OPTIONS.map((option) => (
        <button
          key={option.lang}
          type="button"
          lang={option.lang}
          className="pub-lang__btn"
          aria-pressed={lang === option.lang}
          aria-label={option.label}
          onClick={() => setLang(option.lang)}
        >
          {option.short}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitch;
