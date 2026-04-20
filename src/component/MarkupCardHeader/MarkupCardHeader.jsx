import React from 'react';
import { Typography, Space, Badge, Divider } from 'antd';
import { useTranslation } from "react-i18next";
import { FireFilled } from '@ant-design/icons';
import './MarkupCardHeader.css';

const { Title, Text, Paragraph } = Typography;

export default function MarkupCardHeader({ totalUsers }) {
    const { t } = useTranslation();

    return (
        <div className='markup-header-container'>
            <Typography className='markup-header-content'>
                {/* Tiêu đề chính */}
                <Title level={2} className='markup-title'>
                    {t("dashboard.light_map")}
                </Title>

                {/* Mô tả - Giảm kích thước chữ trên mobile tự động qua CSS */}
                <Paragraph className="markup-description">
                    {t("dashboard.tap_map_light_candle")}
                </Paragraph>

                {/* Thống kê số người tham gia */}
                <div className='total-users-wrapper'>
                    <Space size="small">
                        <FireFilled style={{ color: '#faad14' }} />
                        <Text className='total-users-count'>
                            {totalUsers.toLocaleString()} 
                        </Text>
                        <Text type="secondary" className='total-users-label'>
                            {t("dashboard.people_lit_candles")}
                        </Text>
                    </Space>
                </div>
            </Typography>
            <Divider style={{ margin: '12px 0' }} />
        </div>
    );
}