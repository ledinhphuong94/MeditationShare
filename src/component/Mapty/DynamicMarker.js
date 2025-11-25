import React, { useState, useEffect, useMemo } from 'react';
import { useMapEvents, Marker, Popup } from 'react-leaflet';
import candleIcon from '../../img/candle2.gif';
import L from 'leaflet';

const MIN_ICON_SIZE = 15;
const MAX_ICON_SIZE = 40;
const MIN_ZOOM = 5;
const MAX_ZOOM = 18;

// Hàm tính kích thước icon dựa trên mức zoom
const calculateSize = (currentZoom) => {
    // Nếu zoom nhỏ hơn min, dùng kích thước tối thiểu
    if (currentZoom <= MIN_ZOOM) return MIN_ICON_SIZE;
    
    // Nếu zoom lớn hơn max, dùng kích thước tối đa
    if (currentZoom >= MAX_ZOOM) return MAX_ICON_SIZE;

    // Tính toán kích thước tuyến tính giữa MIN và MAX dựa trên mức zoom hiện tại
    const zoomRange = MAX_ZOOM - MIN_ZOOM; // 13
    const sizeRange = MAX_ICON_SIZE - MIN_ICON_SIZE; // 25
    
    // Tỷ lệ tăng trưởng: (Zoom hiện tại - Zoom tối thiểu) / (Phạm vi Zoom)
    const ratio = (currentZoom - MIN_ZOOM) / zoomRange;
    
    // Kích thước = Kích thước tối thiểu + (Tỷ lệ * Phạm vi kích thước)
    const newSize = MIN_ICON_SIZE + (ratio * sizeRange);
    
    // Trả về số nguyên
    return Math.round(newSize);
};
const DynamicMarker = ({ keyProp, position, children, eventHandlers }) => {
    const map = useMapEvents({}); // Lấy đối tượng map

    // State lưu trữ mức zoom hiện tại
    const [currentZoom, setCurrentZoom] = useState(map.getZoom());

    // Lắng nghe sự kiện zoom để cập nhật state
    useMapEvents({
        zoomend: () => {
            setCurrentZoom(map.getZoom());
        },
    });

    // Sử dụng useMemo để chỉ tạo lại L.Icon khi kích thước thay đổi
    const dynamicIcon = useMemo(() => {
        const size = calculateSize(currentZoom);
        return new L.Icon({
            iconUrl: candleIcon,
            iconSize: [size, size * (41 / 25)], 
        });
    }, [currentZoom]); // Phụ thuộc vào currentZoom

    return (
        <Marker key={keyProp} position={position} icon={dynamicIcon} eventHandlers={eventHandlers}>
            {children}
        </Marker>
    );
};

export default DynamicMarker;