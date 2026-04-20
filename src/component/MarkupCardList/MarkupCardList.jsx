import './MarkupCardList.css'
import React, { useEffect, useRef } from "react";
import { Empty } from 'antd'; // Ant Design
import { useAuth } from '../../context/AuthContext.js';
import { t } from 'i18next';
import CardItem from "./CardItem.jsx";

const MarkupCardList = ({ markers, activeId, mapRef, handleUpdateMess, handleDeleteMess, onCloseDrawer, hasMoreRef, onLoadMore, loadingMoreRef }) => {
    const { userInfo } = useAuth();
    const itemRefs = useRef({});
    const listRef = useRef(null);
    const onLoadMoreRef = useRef(onLoadMore);
    const observerRef = useRef(null);

    useEffect(() => {
        onLoadMoreRef.current = onLoadMore;
    }, [onLoadMore]);

    const setLoadMoreRef = (node) => {
        // cleanup observer cũ
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        if (!node) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (
                    entries[0].isIntersecting &&
                    !loadingMoreRef.current &&
                    hasMoreRef.current
                ) {
                    onLoadMoreRef.current();
                }
            },
            {
                root: listRef.current,
                threshold: 0.1,
                rootMargin: "100px",
            }
        );

        observerRef.current.observe(node);
    };


    useEffect(() => {
        if (!activeId) return;

        const el = itemRefs.current[activeId];
        if (!el) return;

        // 🔥 CHỈ scroll khi user click, không phải khi realtime update
        el.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
        });

    }, [activeId]);

    // 2. Xử lý khi Click vào Card để tìm nến trên Map
    const handleCardClick = (item) => {
        const map = mapRef.current;
        if (!map) return;
        if (onCloseDrawer) onCloseDrawer();
        map.flyTo([item.lat, item.lng], 16, { duration: 1 });

        // Sửa lỗi: Thay vì loop từng layer, ta mở popup dựa trên tọa độ chính xác
        map.once('moveend', () => {
            map.eachLayer(layer => {
                // Kiểm tra layer là Marker và có tọa độ trùng khớp
                if (layer.getLatLng && layer.getLatLng().lat === item.lat) {
                    layer.openPopup();
                }
            });
        });
    };

    if (!markers || markers.length === 0) {
        return <Empty description={t("userCardList.empty_candle")} style={{ marginTop: 50 }} />;
    }

    return (
        <div 
            className="list-markups"
            ref={listRef}
        >
            {/* <div 
                className='list-markups-container'
            > */}
                {markers.map((item) => {
                    const isOwner = userInfo.userId === item.user_id;
                    const isAdmin = userInfo.userRole === 'admin';

                    return (
                        <CardItem 
                            key={item.id}
                            item={item}
                            isOwner={isOwner}
                            isAdmin={isAdmin}
                            itemRefs={itemRefs}
                            isActive={activeId === item.id}
                            handleCardClick={handleCardClick}
                            handleUpdateMess={handleUpdateMess}
                            handleDeleteMess={handleDeleteMess}
                        />
                    );
                })}
                {hasMoreRef.current && <div ref={setLoadMoreRef} style={{ height: 20 }} />}
            {/* </div> */}
        </div>
    );
};


export default React.memo(MarkupCardList);