import { useEffect, useState } from "react";
import { Badge, Card, FloatButton, Button } from "antd";
import { BellOutlined, CloseOutlined } from "@ant-design/icons";
import bannerImg from "../../img/promo_banner.jpg";

const PromoPopup = () => {
    const [open, setOpen] = useState(false);
    const [minimized, setMinimized] = useState(false);

    useEffect(() => {
        const seen = localStorage.getItem("promo_seen");

        if (seen) {
            setMinimized(true);
            return;
        }

        const timer = setTimeout(() => {
            setOpen(true);
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setOpen(false);
        setMinimized(true);
        localStorage.setItem("promo_seen", "1");
    };

    return (
        <>
            {/* 🔥 Popup */}
            {open && (
                <div
                    style={{
                        position: "fixed",
                        bottom: 90,
                        left: 20,
                        zIndex: 9999,
                    }}
                >
                    <Card
                        size="small"
                        style={{
                            width: 300,
                            borderRadius: 16,
                            overflow: "hidden",
                            boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
                            background: "#e1dbd3"
                        }}
                        cover={
                            <img
                                src={bannerImg}
                                alt="promo"
                                style={{ height: 160, objectFit: "cover" }}
                            />
                        }
                        extra={<CloseOutlined onClick={handleClose} />}
                    >
                        <div style={{ padding: "4px 0" }}>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                                Hành trình Việt Nam Thức Tỉnh
                            </h3>

                            <p style={{ margin: "6px 0", color: "#aaa", fontSize: 13 }}>
                                Huế - Đà Nẵng
                            </p>

                            <p style={{ margin: "6px 0", fontSize: 13 }}>
                                📅 1/5 - 4/5/2026
                            </p>

                            <Button
                                type="primary"
                                block
                                style={{
                                    marginTop: 10,
                                    background: "#facc15",
                                    borderColor: "#facc15",
                                    color: "#000",
                                    fontWeight: 600,
                                }}
                                onClick={() =>
                                    window.open("https://phatphapcaptien.github.io/hanhtrinhvietnamthuctinh/", "_blank")
                                }
                            >
                                Xem ngay
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* 🔔 FloatButton */}
            {minimized && !open && (
                <FloatButton
                    icon={
                        <Badge dot>
                            <BellOutlined />
                        </Badge>
                    }
                    type="primary"
                    style={{
                        left: 10,
                        bottom: 80,
                        animation: "pulse 1.5s infinite",
                    }}
                    onClick={() => {
                        setOpen(true);
                        setMinimized(false);
                    }}
                />
            )}

            {/* animation */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
            `}</style>
        </>
    );
};

export default PromoPopup;