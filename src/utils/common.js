// Kiểm tra online: last_seen trong vòng 5 phút
import L from "leaflet";

export const isOnline = (last_seen) => {
    if (!last_seen) return false
    const diff = (Date.now() - new Date(last_seen).getTime()) / 1000 / 60
    return diff <= 5
}

// Lấy chữ cái đầu của mỗi từ trong tên
export const getInitials = (name = '') =>
    name
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

// Màu avatar theo tên
export const getAvatarColor = (name = '') => {
    const colors = [
        '#e85d04', '#f48c06', '#2d6a4f', '#1d3557',
        '#6a0572', '#0077b6', '#c1121f', '#386641',
    ]
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

export const createUserIcon = (user, size = 32) => {
    const initials = getInitials(user.name)
    const bgColor = getAvatarColor(user.name)
    const online = isOnline(user.last_seen)

    const borderColor = online ? '#52c41a' : '#595959'
    const glowStyle = online
        ? 'box-shadow: 0 0 0 3px rgba(82,196,26,0.3), 0 2px 8px rgba(0,0,0,0.5);'
        : 'box-shadow: 0 2px 8px rgba(0,0,0,0.5);'

    return L.divIcon({
        className: '',
        html: `
            <div style="
                width: ${size}px; 
                height: ${size}px;
                border-radius: 50%;
                background: ${bgColor};
                border: 2.5px solid ${borderColor};
                ${glowStyle}
                display: flex;
                align-items: center;
                justify-content: center;
                color: #fff;
                font-size: ${size * 0.4}px;
                font-weight: 700;
                font-family: 'DM Mono', monospace;
                letter-spacing: 1px;
                cursor: pointer;
                transition: transform 0.2s;
            ">
                ${initials}
            </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
    })
}

// Thay hàm format thời gian
export const formatMessageTime = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()

    const isToday = date.toDateString() === now.toDateString()

    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    const isYesterday = date.toDateString() === yesterday.toDateString()

    const isThisWeek = (now - date) < 7 * 24 * 60 * 60 * 1000
    const isThisYear = date.getFullYear() === now.getFullYear()

    const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

    if (isToday) return time
    if (isYesterday) return `Hôm qua ${time}`
    if (isThisWeek) return date.toLocaleDateString('vi-VN', { weekday: 'short' }) + `, ${time}`
    if (isThisYear) return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) + `, ${time}`
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) + `, ${time}`
}