import React, { useState, useEffect, useRef } from "react";
import MarkupCardHeader from "../MarkupCardHeader/MarkupCardHeader";
import MarkupCardList from "../MarkupCardList/MarkupCardList";
import UserCardList from "../UserCardList/UserCardList";
import ChatDrawer from "../ChatDrawer/ChatDrawer";
import TabsSwitcher from "../TabsSwitcher/TabsSwitcher";
import AuthButtons from "../AuthButton/AuthButtons";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import { supabase } from '../../supabaseClient';
import notiSound from "../../sound/noti.mp3"

function SidebarContent({
    userRole,
    activeTab,
    setActiveTab,
    totalUsers,
    markers,
    activeId,
    mapRef,
    handleUpdateMess,
    handleDeleteMess,
    userId,
    activeUserId,
    setChatTarget,
    chatTarget,
    userInfo,
    onCloseDrawer,
    hasMoreRef,
    onLoadMore,
    loadingMoreRef
    }) {
    const [totalUnread, setTotalUnread] = useState(0)
    const prevUnreadRef = useRef(0);
    const audioRef = useRef(new Audio(notiSound));

    useEffect(() => {
        if (!userId) return
        fetchTotalUnread()

        const channel = supabase
            .channel('tab-unread-badge')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'messages',
                filter: `receiver_id=eq.${userId}`,
            }, fetchTotalUnread)
            .subscribe()

        return () => supabase.removeChannel(channel)
    }, [userId]);

    const fetchTotalUnread = async () => {
        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', userId)
            .eq('is_read', false)

        if (!error) setTotalUnread(count || 0)
    };

    useEffect(() => {
        if (
            totalUnread > prevUnreadRef.current &&
            !chatTarget // đang không mở chat
        ) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
        }

        prevUnreadRef.current = totalUnread;
    }, [totalUnread]);

    return (
        <div className="sidebar-inner">
            <div className="sidebar-header">
                <AuthButtons />
                <LanguageSwitcher />
            </div>

            <TabsSwitcher
                myUserRole={userRole}
                activeTab={activeTab}
                onChange={setActiveTab}
                unreadCount={totalUnread}
            />

            <div className="sidebar-content">
                {activeTab === "candles" ? (
                <>
                    <MarkupCardHeader totalUsers={totalUsers} />

                    {/* ❗ KHÔNG cần display:none nữa */}
                    <MarkupCardList
                        markers={markers}
                        activeId={activeId}
                        mapRef={mapRef}
                        handleUpdateMess={handleUpdateMess}
                        handleDeleteMess={handleDeleteMess}
                        onCloseDrawer={onCloseDrawer}
                        hasMoreRef={hasMoreRef} 
                        onLoadMore={onLoadMore}
                        loadingMoreRef={loadingMoreRef}
                    />
                </>
                ) : (
                <>
                    <UserCardList
                    myUserId={userId}
                    mapRef={mapRef}
                    activeUserId={activeUserId}
                    onSendMessage={setChatTarget}
                    />

                    <ChatDrawer
                    open={!!chatTarget}
                    onClose={() => setChatTarget(null)}
                    currentUser={{ id: userInfo.userId }}
                    targetUser={chatTarget}
                    />
                </>
                )}
            </div>
        </div>
    );
}

export default React.memo(SidebarContent);