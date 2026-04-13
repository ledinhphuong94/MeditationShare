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
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
}

export const createUserIcon = (user) => {
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
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: ${bgColor};
                border: 2.5px solid ${borderColor};
                ${glowStyle}
                display: flex;
                align-items: center;
                justify-content: center;
                color: #fff;
                font-size: 13px;
                font-weight: 700;
                font-family: 'DM Mono', monospace;
                letter-spacing: 1px;
                cursor: pointer;
                transition: transform 0.2s;
            ">
                ${initials}
            </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -24],
    })
}