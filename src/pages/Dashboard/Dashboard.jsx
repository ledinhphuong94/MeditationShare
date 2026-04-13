import './Dashboard.css'
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../../supabaseClient.js";
import MessageModal from '../../component/MessageModal/MessageModal.js';
import Mapty from '../../component/Mapty/Mapty.jsx';
import MarkupCardHeader from '../../component/MarkupCardHeader/MarkupCardHeader.js';
import MarkupCardList from '../../component/MarkupCardList/MarkupCardList.js';
// import logoImg from "./img/logo.png";
import bellSound from "../../sound/bell2.mp3";
import { useAuth } from '../../context/AuthContext.js';
import { useUsersContext } from '../../context/UsersContext.js';
import AuthButtons from "../../component/AuthButton/AuthButtons.jsx";
import LanguageSwitcher from "../../component/LanguageSwitcher/LanguageSwitcher.jsx";
import { useTranslation } from "react-i18next";
import TabsSwitcher from '../../component/TabsSwitcher/TabsSwitcher.jsx';
import UserCardList from '../../component/UserCardList/UserCardList.jsx';
import ChatDrawer from '../../component/ChatDrawer/ChatDrawer.jsx';

const playAudio = (audio) => {
  try {
      audio.play().catch(err => {
          if (err.name === 'NotAllowedError') {
              console.warn('Âm thanh bị chặn. Cần tương tác người dùng.');
          } else {
              console.error('Lỗi phát âm thanh khác:', err);
          }
      });
  } catch (err) {
      console.error('Lỗi sync khi gọi audio.play:', err);
  }
}
function Dashboard() {
    const { t, i18n } = useTranslation();
    const [markers, setMarkers] = useState([]);
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [currPos, setCurrPos] = useState([null, null]);
    const [activeId, setActiveId] = useState(null);
    const [isEffectActive, setIsEffectActive] = useState(false);
    const [formData, setFormData] = useState(null);
    const mapRef = useRef(null);
    const { userInfo } = useAuth();
    const { userRole, userId } = userInfo;
    const [totalUsers, setTotalUsers] = useState(0);
    const [activeTab, setActiveTab] = useState('candles');
    const { users, myLocation } = useUsersContext();
    const [activeUserId, setActiveUserId] = useState(null);
    const [chatTarget, setChatTarget] = useState(null)
   
    const handleGlowingEffect = () => {
            if (isEffectActive) {
                setIsEffectActive(false);
            }
            setTimeout(() => {
                setIsEffectActive(true);
                setTimeout(() => {
                    setIsEffectActive(false);
                }, 4000);
            }, 10);
    };

    const getTotalUsers = async () => {
        const { data, error } = await supabase.rpc('count_unique_users');
        
        if (error) {
            console.error('Lỗi khi thống kê users:', error);
        } else {
            const uniqueUserCount = data; // Supabase có thể trả về giá trị trực tiếp
            setTotalUsers(uniqueUserCount);
        }
    }

   // ============================
  // 2. Load markers ban đầu
  // ============================
    useEffect(() => {
        const loadMarkers = async () => {
            let { data } = await supabase.from("markers")
            .select("*")
            .order('updated_at', { ascending: false })
            // .order('created_at', { ascending: false })
            .limit(100);
            setMarkers(data || []);
        };
        // Load markers
        loadMarkers();

        // Get total user
        getTotalUsers();
    }, []);

    // ============================
    // 3. Realtime markers
    // ============================
    useEffect(() => {
        const audio = new Audio(bellSound);
        const channel = supabase
        .channel("realtime-markers")
        .on( // Add
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "markers" },
            (payload) => {
                handleGlowingEffect();
                setMarkers((prev) => [payload.new, ...prev]);
                setActiveId(payload.new.id);
                getTotalUsers();
                playAudio(audio);
            }
        )
        .on( // Update 
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "markers" },
            (payload) => {
                // Xử lý cập nhật: tìm và thay thế marker cũ bằng payload.new
                handleGlowingEffect();
                setMarkers((prev) => [payload.new, ...prev.filter((i) => i.id !== payload.old.id)]);
                setActiveId(payload.new.id);
                playAudio(audio);
            }
        )
        .on( //delete
            'postgres_changes',
            { event: 'DELETE', schema: 'public', table: 'markers' },
            (payload) => {
                console.log('Marker đã bị xóa:', payload);
            // Xử lý cập nhật: tìm và thay thế marker cũ bằng payload.new
                setMarkers((prev) => [...prev.filter((i) => i.id !== payload.old.id)]);
                getTotalUsers();
            }
        )
        .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    useEffect(() => {
        if (!userId || userRole === 'anon') {
            setActiveTab('candles')
        }
    }, [userId, userRole])

    const handleCloseModal = useCallback(() => {
        setIsOpenModal(false);
        setFormData(null);
    }, [setIsOpenModal, setFormData]);

    async function handleSubmitModal(data) {
        const {name, message, isEdited, messId} = data;
        window.localStorage.setItem('meditation_user_name', name);
        
        if (!isEdited) {
        const { data, error } = await supabase.from("markers").insert([
            {
            user_id: userId,
            name,
            message,
            lat: currPos[0],
            lng: currPos[1],
            },
        ]);
        if (error) {
            alert(t("dashboard.error_send_mess"))
        }

        } else {
            const { data, error } = await supabase.from('markers') 
            .update({ 
                message: message,
                updated_at: new Date().toISOString(),
                isEdited: true,
            })
            .eq('id', messId) // Điều kiện 1: ID của tin nhắn cụ thể
            .eq('user_id', userId)

        if (error) {
            alert(t("dashboard.error_update_mess"))
        }
        }
    }

    function handleClickOnMap(pos) {
        setIsOpenModal(true);
        setCurrPos(pos);
    }

    function handleUpdateMess(item) {
        setFormData({id: item.id, message: item.message, name: item.name});
        setIsOpenModal(true);
    };

    async function handleDeleteMess(item) {
        const isConfirmed = window.confirm(t("dashboard.are_you_sure_delete"));
        if (!isConfirmed) return;
        try {
            // Gọi hàm RPC đã tạo
            const { error } = await supabase.rpc('delete_marker_by_id', {
                marker_id_to_delete: item.id 
            });

            if (error) {
                // Lỗi sẽ bao gồm cả lỗi "Permission denied" từ SQL Function
                alert(`${t("dashboard.error_when_remove")}: ${error.message}`);
                console.error('Lỗi khi gọi RPC xóa marker:', error);
                return;
            }

            // Nếu thành công, sự kiện xóa sẽ được Realtime lắng nghe và cập nhật giao diện (Bước 3)
            alert(`Nến ID ${item.id} đã được xóa thành công.`);

        } catch (e) {
            console.error("Lỗi mạng hoặc lỗi không xác định:", e);
            alert(t("dashboard.fail_delete_candle"));
        }
    };

    return (
        <>
            <div className={isEffectActive ? 'glowing-effect' : ''}></div>

            <div className="container">
            <MessageModal
                formData={formData}
                isOpen={isOpenModal}
                onClose={handleCloseModal}
                onSubmit={handleSubmitModal}
            />

            <div className="container-left">
                <Mapty
                    markers={markers} 
                    handleClickOnMap={handleClickOnMap}
                    onMarkerClick={(id) => setActiveId(id)} 
                    mapRef={mapRef}
                    lang={i18n.language}
                    activeTab={activeTab}  
                    users={users}
                    onUserMarkerClick={(userId) => setActiveUserId(userId)}
                    myUserId={userId}
                />
                
                <div className='logo'>
                {/* <img alt='' src={logoImg}/> */}
                © 2025 {t("dashboard.light_map")} | {t("dashboard.version")} 1.3
                </div>
                <div className='logo-hidder'></div>
            </div>

            <div className="container-right">
                <div className='right-top-header'>
                    <AuthButtons />
                    <LanguageSwitcher />
                </div>

                <TabsSwitcher
                    myUserRole={userRole}
                    activeTab={activeTab}
                    onChange={(tab) => setActiveTab(tab)}
                />
                
                {activeTab === 'candles' ? (
                    <>
                        <MarkupCardHeader totalUsers={totalUsers} />
                        <MarkupCardList
                            markers={markers}
                            activeId={activeId}
                            mapRef={mapRef}
                            handleUpdateMess={handleUpdateMess}
                            handleDeleteMess={handleDeleteMess}
                        />
                    </>
                ) : (
                    <>
                        <UserCardList
                            myUserId={userId}
                            users={users}
                            mapRef={mapRef}
                            activeUserId={activeUserId} 
                            onSendMessage={(user) => setChatTarget(user)}
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
        </>

  );
}

export default Dashboard;
