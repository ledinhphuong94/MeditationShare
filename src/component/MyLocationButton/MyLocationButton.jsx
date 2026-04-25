import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Popup, CircleMarker } from "react-leaflet";
import { GiPositionMarker } from "react-icons/gi";
import { useTranslation } from "react-i18next";
import { FloatButton, message, Tooltip } from 'antd';
import { useUsersContext } from '../../context/UsersContext.js';
import "./MyLocationButton.css";

const MyLocationButton = ({ mapRef, handleClickOnMap }) => {
    const { t } = useTranslation();
    const { myLocation } = useUsersContext();
    const [isFlying, setIsFlying] = useState(false);
    const markerRef = useRef(null);

    // Tự động bay về vị trí cũ khi mở app
    useEffect(() => {
        const savedPos = localStorage.getItem('meditation_currPos');
        if (savedPos && mapRef.current) {
            try {
                const pos = JSON.parse(savedPos);
                mapRef.current.flyTo(pos, 13, { duration: 1.5 });
            } catch (e) { console.error(e); }
        }
    }, [mapRef]);

    const handleFlyToMe = () => {
        if (!myLocation?.lat || !myLocation?.lng) {
            message.error(t("alert.location_unavailable"));
            return;
        }

        const coords = [myLocation.lat, myLocation.lng];
        localStorage.setItem('meditation_currPos', JSON.stringify(coords));

        setIsFlying(true);
        mapRef.current.flyTo(coords, 16, {
            duration: 1.5,
            easeLinearity: 0.25
        });

        // Đợi bay xong thì mở popup chào mừng
        mapRef.current.once('moveend', () => {
            setIsFlying(false);
            markerRef.current?.openPopup();
        });
    };

    // Marker này chỉ vẽ "vị trí của tôi" trên bản đồ
    const MyPositionMarker = useMemo(() => {
        if (!myLocation?.lat) return null;
        return (
            <CircleMarker
                ref={markerRef}
                center={[myLocation.lat, myLocation.lng]}
                pathOptions={{
                    color: '#fff',
                    fillColor: '#1677ff',
                    fillOpacity: 0.9,
                    weight: 2
                }}
                radius={8}
            >
                <Popup>{t("dashboard.you_are_here")}</Popup>
            </CircleMarker>
        );
    }, [myLocation, t]);

    return (
        <>
            {/* Nút bấm nổi (UI cố định) */}
            <div className="leaflet-top leaflet-right">
                <div className="leaflet-control" style={{ margin: '20px' }}>
                
                <Tooltip title={t("dashboard.my_location")} placement="left">
                    <FloatButton
                        shape="default" // Hoặc "circle" nếu bạn muốn nút tròn
                        icon={<GiPositionMarker style={{ fontSize: '12px' }} />}
                        loading={isFlying} // Hiệu ứng xoay của Antd cực đẹp
                        onClick={(e) => {
                            e.stopPropagation(); // Ngăn chặn sự kiện click lan truyền lên các phần tử khác
                            e.preventDefault();
                            handleFlyToMe();
                        }}
                        className="my-location-btn" // Vẫn giữ class để tùy chỉnh thêm nếu cần
                        style={{
                            width: '20px',
                            height: '20px',
                            padding: '0 18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                            pointerEvents: 'auto', // Đảm bảo luôn bấm được
                        }}
                    >
                        {/* Chỉ hiện chữ khi không đang bay hoặc trên màn hình đủ rộng */}
                        {!isFlying && <span style={{ marginLeft: 8 }}>{t("dashboard.my_location")}</span>}
                    </FloatButton>
                </Tooltip>

                </div>
            </div>

            {/* Vẽ điểm tròn xanh trên bản đồ */}
            {MyPositionMarker}
        </>
    );
};

export default React.memo(MyLocationButton);