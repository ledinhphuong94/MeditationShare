// src/components/TabsSwitcher/TabsSwitcher.jsx
import { Tabs } from 'antd'
import { FireOutlined, TeamOutlined } from '@ant-design/icons'

const TabsSwitcher = ({ activeTab, onChange, myUserRole }) => {
  const items = [
    {
      key: 'candles',
      label: (
        <span>
          <FireOutlined />
          <span>Candles</span>
        </span>
      ),
    },
    {
      key: 'people',
      disabled: myUserRole === 'anon', // Chỉ viewer mới bị disable tab People
      label: (
        <span>
          <TeamOutlined />
          <span>People</span>
        </span>
      ),
    },
  ]

  return (
    <Tabs
      activeKey={activeTab}
      items={items}
      onChange={onChange}
      style={{ padding: '5px' }}
    />
  )
}

export default TabsSwitcher