import './Dashboard.css'
import { useEffect, useState, useRef, useCallback } from "react";
import { Layout, App, Drawer } from "antd";
import { supabase } from "../../supabaseClient.js";
import MessageModal from '../../component/MessageModal/MessageModal.jsx';
import PromoPopup from '../../component/PromoPopup/PromoPopup.jsx';
import Mapty from '../../component/Mapty/Mapty.jsx';
import bellSound from "../../sound/bell2.mp3";
import { useAuth } from '../../context/AuthContext.js';
import { useTranslation } from "react-i18next";
import { UsersProvider } from '../../context/UsersContext.js';
import SidebarContent from "../../component/SidebarContent/SidebarContent";
import bg from "../../img/sunrise.jpg";
import { usePushNotification } from '../../hooks/usePushNotification'
// import InstallPWA from "../../component/InstallPWA/InstallPWA.jsx"

const { Content, Sider } = Layout;
function Dashboard() {
    const { t, i18n } = useTranslation();
    const tRef = useRef(t);
    tRef.current = t;
    const { message, modal, notification } = App.useApp(); // Antd Static Functions
    const [markers, setMarkers] = useState([]);
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [activeId, setActiveId] = useState(null);
    const [isEffectActive, setIsEffectActive] = useState(false);
    const [formData, setFormData] = useState(null);
    const mapRef = useRef(null);
    const { userInfo } = useAuth();
    const { userRole, userId } = userInfo;
    const [totalUsers, setTotalUsers] = useState(0);
    const [activeTab, setActiveTab] = useState('candles');
    const [activeUserId, setActiveUserId] = useState(null);
    const [chatTarget, setChatTarget] = useState(null)
    const audioRef = useRef(new Audio(bellSound));
    const getIsMobile = () => window.innerWidth < 768;
    const [isMobile, setIsMobile] = useState(getIsMobile);
    const [openDrawer, setOpenDrawer] = useState(true);
    const currPosRef = useRef([null, null]);

    // ============== load more cards on scroll  ==============
    const loadingMoreRef = useRef(false);
    const hasMoreRef = useRef(true);
    const pageRef = useRef(0);
    usePushNotification(userId, userRole)

    const PAGE_SIZE = 75;
    const fetchMarkers = useCallback( async (pageIndex = 0) => {
        const from = pageIndex * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data, count, error } = await supabase
            .from("markers")
            .select("*", { count: "exact", head: false })
            .order("updated_at", { ascending: false })
            .range(from, to);
        if (error) return;

        const totalLoaded = from + data.length;
        if (totalLoaded >= count) {
            // setHasMore(false);
            hasMoreRef.current = false
        }
        setMarkers((prev) =>
            pageIndex === 0 ? data : [...prev, ...data]
        );
    }, []);

    const loadMore = useCallback(async () => {
        if (loadingMoreRef.current || !hasMoreRef.current) return;

        loadingMoreRef.current = true;

        const nextPage = pageRef.current + 1;
        pageRef.current = nextPage;

        await fetchMarkers(nextPage);

        loadingMoreRef.current = false;
    }, [fetchMarkers]);

    // ============================
    //switch tab when logout
    useEffect(() => {
        if (userRole === 'anon') {
            setActiveTab('candles');
        }
    }, [userRole]);

    // Detect mobile
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, []);
   
    // Hiệu ứng hào quang khi có nến mới
    const handleGlowingEffect = useCallback(() => {
        setIsEffectActive(true);
        setTimeout(() => setIsEffectActive(false), 4000);
    }, []);

   // Thống kê users
    const fetchStats = useCallback(async () => {
        const { data, error } = await supabase.rpc('count_unique_users');
        if (!error) setTotalUsers(data);
    }, []);

    // Load markers ban đầu
    useEffect(() => {
        const loadData = async () => {
            await fetchMarkers(0);
            // setMarkers(data || []);
            fetchStats();
        };
        loadData();
    }, [fetchStats]);

    // Realtime logic
    useEffect(() => {
        const channel = supabase.channel("realtime-dashboard")
            .on("postgres_changes", { event: "*", schema: "public", table: "markers" }, async (payload) => {
                const isMe = payload.new.user_id === userId;
                // setIsMyInsert(isMe);
                if (payload.eventType === "INSERT") {
                    setMarkers((prev) => [payload.new, ...prev]);
                    // setActiveId(payload.new.id);
                    handleGlowingEffect();
                    audioRef.current.currentTime = 0;
                    audioRef.current.play().catch(() => {}); // Silent catch for autoplay block
                    fetchStats();
                    notification.success({ message: t("dashboard.new_candle_lit") });

                    // ✅ Thêm vào đây — không gửi cho chính mình
                    if (!isMe) {
                        await supabase.functions.invoke('send-push', {
                            body: {
                                user_id: userId, // gửi cho user hiện tại
                                title: '🕯️ Nến mới được thắp',
                                body: `${payload.new.name}: ${payload.new.message?.slice(0, 80) || ''}`,
                                url: '/',
                            }
                        })
                    }
                } 
                else if (payload.eventType === "UPDATE") {
                    setMarkers((prev) => prev.map((i) => i.id === payload.new.id ? payload.new : i));
                    handleGlowingEffect();
                    audioRef.current.currentTime = 0;
                    audioRef.current.play().catch(() => {}); //
                } 
                else if (payload.eventType === "DELETE") {
                    setMarkers((prev) => [...prev.filter((i) => i.id !== payload.old.id)]);
                    fetchStats();
                }
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [handleGlowingEffect, fetchStats, notification]);

    // Handlers
    const handleClickOnMap = useCallback((pos) => {
        // setCurrPos(pos);
        currPosRef.current = pos;
        setIsOpenModal(true);
    }, []);

    const handleUpdateMess = useCallback((item) => {
        setFormData({
            id: item.id,
            message: item.message,
            name: item.name
        });
        setIsOpenModal(true);
    }, []);

    const handleDeleteMess = useCallback(async (item) => {
        modal.confirm({
            title: t("dashboard.are_you_sure_delete"),
            okText: t("common.delete"),
            okType: 'danger',
            cancelText: t("common.cancel"),
            onOk: async () => {
                const { error } = await supabase.rpc('delete_marker_by_id', { marker_id_to_delete: item.id });
                if (error) message.error(t("dashboard.error_when_remove"));
                else message.success(t("dashboard.delete_success"));
            }
        });
    }, [modal, t, message]);

    const handleCloseModal = useCallback(() => {
        setIsOpenModal(false);
        setFormData(null);
    }, []);

    const onCloseDrawer = useCallback((item) => {
        if (isMobile) {
            setOpenDrawer(false);
        }
    }, [isMobile]);

    const handleSubmitModal = async (data) => {
        const { name, message: msg, isEdited, messId } = data;
        localStorage.setItem('meditation_user_name', name);

        if (!isEdited) {
            const { error } = await supabase.from("markers").insert([{
                user_id: userId, name, message: msg, lat: currPosRef.current[0], lng: currPosRef.current[1]
            }]);
            if (error) message.error(t("dashboard.error_send_mess"));
        } else {
            const { error } = await supabase.from('markers')
                .update({ message: msg, updated_at: new Date().toISOString(), isEdited: true })
                .eq('id', messId).eq('user_id', userId);
            if (error) message.error(t("dashboard.error_update_mess"));
        }
        handleCloseModal();
    };

    return <UsersProvider>
        <Layout className="app-container">
            <div className={isEffectActive ? "glowing-effect" : ""}></div>

                <Content style={{ position: "relative", height: "100%" }}>
                    <Mapty
                        markers={markers}
                        handleClickOnMap={handleClickOnMap}
                        onMarkerClick={setActiveId}
                        mapRef={mapRef}
                        lang={i18n.language}
                        activeTab={activeTab}
                        onUserMarkerClick={setActiveUserId}
                        myUserId={userId}
                    />

                    <div className="map-footer">
                        © 2026 {t("dashboard.light_map")} | v2.0
                    </div>

                    {/* 👉 BUTTON mở drawer (mobile) */}
                    {isMobile && (
                        <button
                            className="open-drawer-btn"
                            onClick={() => setOpenDrawer(true)}
                        >
                            ☰
                        </button>
                    )}
                </Content>
                
                {/* ✅ DESKTOP */}
                {!isMobile && (
                    <Sider width={350} className="sidebar">
                        <SidebarContent
                            userRole={userRole}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            totalUsers={totalUsers}
                            markers={markers}
                            activeId={activeId}
                            mapRef={mapRef}
                            handleUpdateMess={handleUpdateMess}
                            handleDeleteMess={handleDeleteMess}
                            userId={userId}
                            activeUserId={activeUserId}
                            setChatTarget={setChatTarget}
                            chatTarget={chatTarget}
                            userInfo={userInfo}
                            hasMoreRef={hasMoreRef}
                            onLoadMore={loadMore}
                            loadingMoreRef={loadingMoreRef}
                        />
                    </Sider>
                )}

                {/* ✅ MOBILE */}
                {isMobile && (
                    <>
                    <Drawer
                        placement="bottom"   // 🔥 QUAN TRỌNG
                        height="80%"         // giống app thật
                        open={openDrawer}
                        onClose={() => setOpenDrawer(false)}
                        destroyOnClose={false}
                        bodyStyle={{ padding: 0 }}
                        styles={{
                                header: {
                                    background: "#1a1a1a",   // màu nền header
                                    borderBottom: "1px solid #2a2a2a",
                                    color: "#facc15"        // màu text (title)
                                },
                                body: {
                                    position: "relative",
                                    background: `
                                        linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)),
                                        url(${bg})
                                    `,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                }
                        }}
                    >
                        <SidebarContent
                            userRole={userRole}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            totalUsers={totalUsers}
                            markers={markers}
                            activeId={activeId}
                            mapRef={mapRef}
                            handleUpdateMess={handleUpdateMess}
                            handleDeleteMess={handleDeleteMess}
                            userId={userId}
                            activeUserId={activeUserId}
                            setChatTarget={setChatTarget}
                            chatTarget={chatTarget}
                            userInfo={userInfo}
                            onCloseDrawer={onCloseDrawer}
                            hasMoreRef={hasMoreRef}
                            onLoadMore={loadMore}
                            loadingMoreRef={loadingMoreRef}
                        />
                        
                    </Drawer>
                    {/* <InstallPWA /> */}
                    </>
                )}
        
            <MessageModal
                formData={formData}
                isOpen={isOpenModal}
                onClose={handleCloseModal}
                onSubmit={handleSubmitModal}
            />

            <PromoPopup />
        </Layout>
    </UsersProvider>
}

export default Dashboard;
