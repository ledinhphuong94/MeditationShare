import { Tabs, Badge } from 'antd'
import { FireOutlined, TeamOutlined } from '@ant-design/icons'
import { useTranslation } from "react-i18next";

const TabsSwitcher = ({ activeTab, onChange, myUserRole, unreadCount = 0 }) => {
  const { t } = useTranslation();
  const isLoggedIn = myUserRole && myUserRole !== 'anon'

  const items = [
    {
      key: 'candles',
      label: (
        <span>
          <FireOutlined />
          <span>{t('userCardList.Candle')}</span>
        </span>
      ),
    },
    {
      key: 'people',
      disabled: !isLoggedIn, // Chỉ viewer mới bị disable tab People
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <TeamOutlined />
            People
            {/* 👇 Chấm đỏ chớp khi có tin mới */}
            {isLoggedIn && unreadCount > 0 && (
                <Badge
                    count={unreadCount}
                    size="small"
                    style={{
                        backgroundColor: '#ef4444',
                        boxShadow: '0 0 6px rgba(239,68,68,0.8)',
                        animation: 'tabPulse 1.2s ease infinite',
                        fontSize: 10,
                        minWidth: 16,
                        height: 16,
                        lineHeight: '16px',
                        padding: '0 4px',
                    }}
                />
            )}
        </span>
      ),
    },
  ]

  return (
    <>
      <Tabs
        activeKey={activeTab}
        items={items}
        onChange={onChange}
        style={{ padding: '5px' }}
      />
      <style>{`
          @keyframes tabPulse {
              0%, 100% { 
                  opacity: 1;
                  box-shadow: 0 0 6px rgba(239,68,68,0.8);
              }
              50% { 
                  opacity: 0.5;
                  box-shadow: 0 0 12px rgba(239,68,68,0.4);
              }
          }
      `}</style>
    </>
  )
}

export default TabsSwitcher