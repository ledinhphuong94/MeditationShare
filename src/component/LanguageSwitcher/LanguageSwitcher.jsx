import "./LanguageSwitcher.css"
import { useTranslation } from "react-i18next";

function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (e) => {
    const lang = e.target.value;
    i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang);
  };

  return (

    <select
      className="select_language_switch"
      name="select_language"
      value={i18n.language}
      onChange={changeLanguage}
    >
      <option value="vi">🇻🇳 Tiếng Việt</option>
      <option value="en">🇬🇧 English</option>
    </select>
  );
}

export default LanguageSwitcher;
