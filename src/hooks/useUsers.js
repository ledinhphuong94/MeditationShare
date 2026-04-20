import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext.js';
import { useTranslation } from "react-i18next";
import isEqual from "lodash/isEqual";

export const useUsers = () => {
    const [users, setUsers] = useState([]);
    const [myLocation, setMyLocation] = useState(null);

    const { userInfo } = useAuth();
    const {userRole, userId} = userInfo;
    const { t } = useTranslation();
    const lastUpdateRef = useRef(0);
    const lastFetchRef = useRef(0);
    const lastLocationRef = useRef(null);
    const usersRef = useRef([]);

    const MIN_DISTANCE = 10; // mét
    const UPDATE_INTERVAL = 60000; // ms
    const FETCH_INTERVAL = 40000; // ms
    const LAST_SEEN_INTERVAL = 10000; // ms

    const getDistance = (lat1, lng1, lat2, lng2) => {
        const R = 6371000;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;

        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;

        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    // ✅ UPDATE LOCATION (throttle)
    const updateLocation = async (lat, lng) => {
        setMyLocation({ lat, lng });
        // console.log('-> Update location')
        if (!userId || userRole === 'anon') return;

        const now = Date.now();
        if (now - lastUpdateRef.current < UPDATE_INTERVAL) return;

        lastUpdateRef.current = now;

        // console.log('userRole', userRole)
        const { error } = await supabase.from("user_locations").upsert({
            user_id: userId,
            location: `POINT(${lng} ${lat})`,
            last_seen: new Date()
        });

        if (error) console.error("updateLocation error:", error);
    };

    // ✅ FETCH NEARBY (debounce)
    const fetchNearbySmart = async (lat, lng) => {
        if (!lat || !lng) return;

        const now = Date.now();
        // console.log('now - lastFetchRef.current', now - lastFetchRef.current)
        if (now - lastFetchRef.current < FETCH_INTERVAL) return;

        lastFetchRef.current = now;

        const { data, error } = await supabase.rpc("get_nearby_users", {
            user_lng: lng,
            user_lat: lat,
            limit_count: 20,
        });

        if (error) {
            console.error("fetchNearby error:", error);
            return;
        }

        // 🔥 CHỈ update khi data THẬT SỰ đổi
        if (!isEqual(usersRef.current, data)) {
            usersRef.current = data;
            setUsers(data || []);
        }

    };

    // ✅ WATCH GPS (chỉ update location)
    useEffect(() => {
        if (!userId) return;

        // 1. Kiểm tra xem trình duyệt có hỗ trợ Geolocation không
        if (!navigator.geolocation) {
            alert(t("alert.browser_not_support_location"));
            return;
        }

        // 👇 THÊM: lấy vị trí ngay lập tức
        // navigator.geolocation.getCurrentPosition(
        //     (pos) => {
        //         const { latitude, longitude } = pos.coords
        //         lastLocationRef.current = { lat: latitude, lng: longitude }
        //         updateLocation(latitude, longitude)
        //         fetchNearbySmart(latitude, longitude)
        //     },
        //     () => {}, // watchPosition sẽ handle lỗi
        //     { enableHighAccuracy: false, timeout: 5000 }
        // );

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                const last = lastLocationRef.current;

                if (last) {
                    const dist = getDistance(last.lat, last.lng, latitude, longitude);
                    if (dist < MIN_DISTANCE) return;
                }

                lastLocationRef.current = { lat: latitude, lng: longitude };                
                console.log("REAL MOVE:", latitude, longitude);
                updateLocation(latitude, longitude);

                // fetch nearby ngay khi có vị trí mới (không cần debounce vì đã có throttle ở updateLocation)
                fetchNearbySmart(latitude, longitude);
            },
            (err) => {
                console.log(err)
                // 2. Handle các mã lỗi cụ thể từ Geolocation API
                let errorMessage = "";
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        errorMessage = t("alert.refuse_share_location");
                        break;
                    case err.POSITION_UNAVAILABLE:
                        errorMessage = t("alert.location_unavailable");
                        break;
                    case err.TIMEOUT:
                        errorMessage = t("alert.location_request_timeout");
                        break;
                    default:
                        errorMessage = t("alert.unknown_error");
                }
                
                console.warn("GPS error:", errorMessage);
                alert(errorMessage);
                // Có thể thêm logic retry hoặc thông báo toast ở đây
            },
            {
                enableHighAccuracy: true,
                maximumAge: 10000,
                timeout: 20000,
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [userId]);

    // ✅ KEEP ALIVE + FETCH LOOP
    useEffect(() => {
        if (!userId || userRole === 'anon') return;

        const intervalId = setInterval(async () => {
            if (!lastLocationRef.current) return;
            // console.log("Updating last_seen...", userId);
            // console.log('userRole KEEP ALIVE', userRole)
            const { data, error } = await supabase
                .from("user_locations")
                .update({ last_seen: new Date().toISOString() })
                .eq("user_id", userId)
                .select();

            // if (error) {
            //     console.error("❌ Update error:", error);
            // } else {
            //     console.log("✅ Updated:", data);
            // }
        }, LAST_SEEN_INTERVAL);

        return () => clearInterval(intervalId);
    }, [userId]);

    useEffect(() => {
        if (!userId || userRole === 'anon') return;

        const channel = supabase
            .channel("nearby-users")
            .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "user_locations",
            },
            (payload) => {
                // refetch nearby khi có thay đổi
                // console.log('userRole', userRole)
               
                const loc = lastLocationRef.current
                // console.log("refetching nearby...", loc);
                if (loc) {
                    fetchNearbySmart(loc.lat, loc.lng);
                }
            }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    return { users, myLocation };
};