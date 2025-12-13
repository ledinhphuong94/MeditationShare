import './MarkupCardHeader.css';
import { useTranslation } from "react-i18next";

export default function MarkupCardHeader({ totalUsers }) {
    const { t } = useTranslation();
    return (
        <>
            <div className='markup-header'>
                <h2 className='markup-title'>{t("dashboard.light_map")}</h2>
                <div className="markup-title-description">{t("dashboard.tap_map_light_candle")}</div>
                <p className='total-users'>{totalUsers} {t("dashboard.people_lit_candles")}</p>
            </div>
        </>
    
    );
}


