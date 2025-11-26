import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet'; 
import * as L from 'leaflet';

// 1. Import MaptilerLayer từ SDK đã cài đặt
import { MaptilerLayer } from "@maptiler/leaflet-maptilersdk";
import 'leaflet/dist/leaflet.css'; 

// 2. Thiết lập thông tin bản đồ của bạn
// Vui lòng thay thế bằng API Key và Style ID chính xác của bạn!
const YOUR_API_KEY = process.env.REACT_APP_MAPTILER_API_KEY; 
const CUSTOM_STYLE_ID = process.env.REACT_APP_MAPTILER_CUSTOM_STYLE_ID; 
const FULL_STYLE_URL = `https://api.maptiler.com/maps/${CUSTOM_STYLE_ID}/style.json`;

const MapTilerVectorLayer = () => {
    const map = useMap(); // Lấy đối tượng map (của Leaflet)

    useEffect(() => {
        // Kiểm tra xem lớp đã tồn tại chưa để tránh thêm nhiều lần
        if (!map) return;

        // 3. Khởi tạo lớp MapTiler Layer
        const mtLayer = new MaptilerLayer({
            // Sử dụng API Key và ID Style đã tùy chỉnh của bạn
            apiKey: YOUR_API_KEY, 
            style: FULL_STYLE_URL, // Format style cần là maptiler/{style-id}
            attribution: false,
            gl: { 
                antialias: false // Tắt làm mịn
            }
        });

        // 4. Thêm lớp vào bản đồ Leaflet
        mtLayer.addTo(map);

        // 5. Dọn dẹp: xóa lớp khi component bị hủy
        return () => {
            map.removeLayer(mtLayer);
        };

    }, [map]);

    // Component này không render gì trong DOM, nó chỉ quản lý lớp bản đồ
    return null; 
};

export default MapTilerVectorLayer;