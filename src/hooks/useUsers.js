import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext.js';
import { useTranslation } from "react-i18next";
import { notification } from 'antd';
import isEqual from "lodash/isEqual";

export const useUsers = () => {
    const [users, setUsers] = useState([]);
    const [myLocation, setMyLocation] = useState(null);
    const [gpsError, setGpsError] = useState(null);

    const { userInfo } = useAuth();
    const { userRole, userId } = userInfo;
    const { t } = useTranslation();

    const lastUpdateRef = useRef(0);
    const lastFetchRef = useRef(0);
    const lastLocationRef = useRef(null);
    const usersRef = useRef([]);
    const watchIdRef = useRef(null);

    const MIN_DISTANCE = 10;
    const UPDATE_INTERVAL = 60000;
    const FETCH_INTERVAL = 30000;
    const LAST_SEEN_INTERVAL = 30000;

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

        const { error } = await supabase.from("user_locations").upsert({
            user_id: userId,
            location: `POINT(${lng} ${lat})`,
            last_seen: new Date().toISOString()
        });

        if (error) console.error("updateLocation error:", error);
    };

    // ✅ FETCH NEARBY
    const fetchNearbySmart = async (lat, lng) => {
        if (!lat || !lng) return;

        const now = Date.now();

        const isFirstFetch = lastFetchRef.current === 0;
        if (!isFirstFetch && now - lastFetchRef.current < FETCH_INTERVAL) return;

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

        if (!isEqual(usersRef.current, data)) {
            usersRef.current = data;
            setUsers(data || []);
        }
    };

    // ✅ GPS
    useEffect(() => {
        if (!userId) return;

        if (!navigator.geolocation) {
            notification.warning({ message: t("alert.browser_not_support_location") });
            return;
        }

        const handleSuccess = (pos) => {
            const { latitude, longitude } = pos.coords;
            const last = lastLocationRef.current;

            setGpsError(null);

            const isFirst = !last;

            if (!isFirst) {
                const dist = getDistance(last.lat, last.lng, latitude, longitude);
                if (dist < MIN_DISTANCE) return;
            }

            lastLocationRef.current = { lat: latitude, lng: longitude };

            updateLocation(latitude, longitude);
            fetchNearbySmart(latitude, longitude);
        };

        const handleError = (err) => {
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

            if (gpsError !== err.code) {
                setGpsError(err.code);
                notification.error({
                    message: t("userCardList.location_error") || "Lỗi định vị",
                    description: errorMessage,
                    duration: 5,
                });
            }
        };

        // ✅ 🔥 FIX: LẤY LOCATION NGAY LẬP TỨC
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                lastLocationRef.current = { lat: latitude, lng: longitude };
                updateLocation(latitude, longitude);
                fetchNearbySmart(latitude, longitude);
            },
            () => {},
            { 
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 10000 
            }
        );

        // ✅ WATCH
        watchIdRef.current = navigator.geolocation.watchPosition(
            handleSuccess,
            handleError,
            {
                enableHighAccuracy: true,  // 🔥 FIX
                timeout: 15000,            // 🔥 FIX
                maximumAge: 10000,         // 🔥 FIX
            }
        );

        return () => {
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, [userId]); // 🔥 FIX: bỏ gpsError

    // ✅ HEARTBEAT
    useEffect(() => {
        if (!userId || userRole === 'anon') return;

        const intervalId = setInterval(async () => {
            await supabase
                .from("user_locations")
                .update({ last_seen: new Date().toISOString() })
                .eq("user_id", userId);
        }, LAST_SEEN_INTERVAL);

        return () => clearInterval(intervalId);
    }, [userId, userRole]);

    // ✅ REALTIME
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
                () => {
                    const loc = lastLocationRef.current;
                    if (loc) fetchNearbySmart(loc.lat, loc.lng);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, userRole]);

    return { users, myLocation };
};