import './App.css'
import { useEffect, useState, useRef } from "react";
import { supabase } from "./supabaseClient";
import MessageModal from './component/MessageModal/MessageModal';
import Mapty from './component/Mapty/Mapty';
import MarkupCardList from './component/MarkupCardList/MarkupCardList';
import logoImg from "./img/logo.png";
import bellSound from "./sound/bell2.mp3";

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    width: "100%",
    overflow: "hidden",
  },
  left: {
    flex: 7.5,
    background: "#f4f4f4",
    padding: "10px",
    overflowY: "auto",
    position: "relative",
  },
  right: {
    flex: 2.5,
    background: "#e5e5e5",
    padding: "10px",
    borderLeft: "1px solid #ccc",
    overflowY: "auto",
  },
};
function App() {
  const [markers, setMarkers] = useState([]);
  const [session, setSession] = useState(null);

  const [isOpenModal, setIsOpenModal] = useState(false);
  const [currPos, setCurrPos] = useState([null, null]);

  const [name, setName] = useState( window.localStorage.getItem("meditationShare") || "");
  const [message, setMessage] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [isEffectActive, setIsEffectActive] = useState(false);
  const mapRef = useRef(null);

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

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('sess', session)
      if (!session) {
        const { data } = await supabase.auth.signInAnonymously();
        setSession(data.session);
      } else {
        setSession(session);
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);
   // ============================
  // 2. Load markers ban đầu
  // ============================
  useEffect(() => {
      const loadMarkers = async () => {
          let { data } = await supabase.from("markers")
          .select("*")
          .order('created_at', { ascending: false })
          .limit(100);
          setMarkers(data || []);
      };
      loadMarkers();
  }, []);

  // ============================
  // 3. Realtime markers
  // ============================
  useEffect(() => {
      const audio = new Audio(bellSound);
      const channel = supabase
      .channel("realtime-markers")
      .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "markers" },
          (payload) => {
              audio.play();
              handleGlowingEffect();
              setMarkers((prev) => [payload.new, ...prev]);
              setActiveId(payload.new.id)
          }
      )
      .subscribe();

      return () => supabase.removeChannel(channel);
  }, []);

  function handleCloseModal() {
    setIsOpenModal(false);
  }

  async function handleSubmitModal(data) {
    const {name, message} = data;
    window.localStorage.setItem('meditationShare', name);
    setName(name);
    setMessage(message);
    await supabase.from("markers").insert([
      {
        user_id: session.user.id,
        name,
        message,
        lat: currPos[0],
        lng: currPos[1],
      },
    ]);
  }

  function handleClickOnMap(pos) {
      setIsOpenModal(true);
      setCurrPos(pos);
  }
  return (
    <>
    <div className={isEffectActive ? 'glowing-effect' : ''}></div>
    <div className="container" style={{ height: '100vh', width: "100vw" }}>
      <MessageModal username={name} isOpen={isOpenModal} onClose={handleCloseModal} onSubmit={handleSubmitModal}/>
      {/* Bản đồ */}
      
      <div style={styles.container}>
        <div className="container-left" style={styles.left}>
           <Mapty 
              markers={markers} 
              handleClickOnMap={handleClickOnMap}
              onMarkerClick={(id) => setActiveId(id)} 
              mapRef={mapRef}
           />
           <div className='logo'>
              {/* <img src={logoImg}/> */}
           </div>
           
        </div>

        <div className="container-right" style={styles.right}>
          <MarkupCardList 
            markers={markers}
            activeId={activeId}
            mapRef={mapRef}
          />
        </div>
      </div>
     
    </div>
    </>
  );
}

export default App;
