import './App.css'
import { useEffect, useState, useRef } from "react";
import { supabase } from "./supabaseClient";
import MessageModal from './component/MessageModal/MessageModal';
import Mapty from './component/Mapty/Mapty';
import MarkupCardHeader from './component/MarkupCardHeader/MarkupCardHeader.js';
import MarkupCardList from './component/MarkupCardList/MarkupCardList';
import logoImg from "./img/logo.png";
import bellSound from "./sound/bell2.mp3";
import { useUser } from './UserContext.js';

const playAudio = (audio) => {
  try {
      // audio.play() trả về một Promise, nên tốt nhất là dùng await hoặc .catch
      // Sử dụng .catch() là cách phổ biến hơn cho Promise không cần kết quả
      audio.play().catch(err => {
          // Chỉ ghi log lỗi liên quan đến việc bị chặn (NotAllowedError)
          if (err.name === 'NotAllowedError') {
              console.warn('Âm thanh bị chặn. Cần tương tác người dùng.');
          } else {
              console.error('Lỗi phát âm thanh khác:', err);
          }
      });
  } catch (err) {
      // try/catch này chủ yếu bắt các lỗi đồng bộ (sync errors)
      // Ví dụ: đối tượng audio chưa được khởi tạo
      console.error('Lỗi sync khi gọi audio.play:', err);
  }
}
function App() {
  const [markers, setMarkers] = useState([]);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [currPos, setCurrPos] = useState([null, null]);
  const [activeId, setActiveId] = useState(null);
  const [isEffectActive, setIsEffectActive] = useState(false);
  const [formData, setFormData] = useState(null);
  const mapRef = useRef(null);
  const { userId, login } = useUser();
  const [totalUsers, setTotalUsers] = useState(0);

  // ============================
  // 1. Login ẩn danh tự động
  // ============================
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

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        const { data } = await supabase.auth.signInAnonymously();
        login(data.session.user.id);
      } else {
        login(session.user.id);
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) login(session.user.id);
    });
  }, []);
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
      .subscribe();

      return () => supabase.removeChannel(channel);
  }, []);

  function handleCloseModal() {
    setIsOpenModal(false);
    setFormData(null);
  }

  async function handleSubmitModal(data) {
    const {name, message, isEdited, messId} = data;
    window.localStorage.setItem('meditationShare', name);
    
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
        alert('Lỗi khi thêm thông điệp')
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
        alert('Lỗi khi cập nhật thông điệp')
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
            />
            
            <div className='logo'>
              {/* <img alt='' src={logoImg}/> */}
              © 2025 LM v1
            </div>
          </div>

          <div className="container-right">
            <MarkupCardHeader totalUsers={totalUsers} />
            <MarkupCardList
              markers={markers}
              activeId={activeId}
              mapRef={mapRef}
              handleUpdateMess={handleUpdateMess}
            />
          </div>

        </div>
      </>

  );
}

export default App;
