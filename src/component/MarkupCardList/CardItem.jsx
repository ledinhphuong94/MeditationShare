import './MarkupCardList.css'
import React from "react";
import { BiMessageSquareEdit } from "react-icons/bi";
import { MdDeleteForever } from "react-icons/md";
import { Card, Button, Tooltip, Popconfirm, Tag } from 'antd'; // Ant Design
import { useAuth } from '../../context/AuthContext.js';
import { t } from 'i18next';

const CardItem = React.memo(({ 
    item,
    isOwner,
    isAdmin,
    itemRefs,
    isActive,
    handleCardClick,
    handleUpdateMess,
    handleDeleteMess
    }) => {
    return (
        <Card
            key={item.id}
            data-id={item.id}
            ref={(el) => itemRefs.current[item.id] = el}
            size="small"
            className={`markup-card ${isActive ? 'active' : ''}`}
            onClick={() => handleCardClick(item)}
            title={
                <div className="card-header">
                    <span style={{ fontWeight: 700 }}>{item.name}</span>
                    {isOwner && <Tag color="blue" style={{ marginLeft: 8 }}>Bạn</Tag>}
                </div>
            }
            extra={
                <div className="card-actions" onClick={e => e.stopPropagation()}>
                    {isOwner && (
                        <Tooltip title={t('markupCardList.edit')}>
                            <Button 
                                type="text" 
                                icon={<BiMessageSquareEdit size={18} />} 
                                onClick={() => handleUpdateMess(item)}
                            />
                        </Tooltip>
                    )}
                    {isAdmin && (
                        <Popconfirm
                            title={t('markupCardList.confirm_delete')}
                            description={t('markupCardList.confirm_delete')}
                            onConfirm={() => handleDeleteMess(item)}
                            okText={t('markupCardList.delete')}
                            cancelText={t('markupCardList.cancel')}
                            okButtonProps={{ danger: true }}
                        >
                            <Button 
                                type="text" 
                                danger 
                                icon={<MdDeleteForever size={20} />} 
                            />
                        </Popconfirm>
                    )}
                </div>
            }
        >
            <p className="message-text">{item.message}</p>
            <div className="card-footer">
                <small>{new Date(item.created_at).toLocaleString("vi-VN")}</small>
            </div>
        </Card>
    );
});

export default CardItem