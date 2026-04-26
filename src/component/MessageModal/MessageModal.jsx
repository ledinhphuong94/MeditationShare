import { Modal, Form, Input, Button } from "antd";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import * as validator from "../../utils/prohibitMessage.js";
import { useAuth } from '../../context/AuthContext.js';

const { TextArea } = Input;

function MessageModal({ isOpen, formData, onClose, onSubmit }) {
    const [form] = Form.useForm();
    const { t } = useTranslation();
    const { userInfo: {username} } = useAuth();

    useEffect(() => {
        const saved = localStorage.getItem("meditation_user_name");
        if (isOpen) {
            if (formData) {
                form.setFieldsValue({
                    name: formData.name || saved || "",
                    message: formData.message || "",
                });
            } else {
                let name = username === 'Anonymous' ? '' : username;
                form.setFieldsValue({
                    name: name || saved,
                });
            }
        } else {
            form.resetFields();
        }
    }, [isOpen, formData, form]);

    const handleFinish = (values) => {
        onSubmit({
            ...values,
            isEdited: !!formData?.id,
            messId: formData?.id,
        });
    };

    return (
        <Modal
            open={isOpen}
            onCancel={onClose}
            footer={null}
            centered
            destroyOnHidden
            title={formData?.id ? t("messageModal.edit_message") : t("messageModal.message_to_the_world")}
            zIndex={9995}
        >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
            <Form.Item
                label={t("messageModal.label_name")}
                name="name"
                rules={[
                    { required: true, message: t("messageModal.please_fill_both") },
                    {
                    validator: (_, value) => {
                        if (!value) return Promise.resolve();

                        if (validator.containsForbiddenContent(value)) {
                            return Promise.reject(
                                new Error(t("messageModal.not_allow_link_in_name"))
                            );
                        }

                        if (validator.containsProfanity(value)) {
                            return Promise.reject(
                                new Error(t("messageModal.not_valid_name"))
                            );
                        }

                        return Promise.resolve();
                    },
                    },
                ]}
            >
                <Input placeholder={t("messageModal.enter_your_name")} />
            </Form.Item>

            <Form.Item
                label={t("messageModal.label_your_mess")}
                name="message"
                rules={[
                    { required: true, message: t("messageModal.please_fill_both") },
                    {
                    validator: (_, value) => {
                        if (!value) return Promise.resolve();

                        if (validator.containsForbiddenContent(value)) {
                        return Promise.reject(
                            new Error(t("messageModal.not_allow_link_in_message"))
                        );
                        }

                        if (validator.containsProfanity(value)) {
                        return Promise.reject(
                            new Error(t("messageModal.not_valid_message"))
                        );
                        }

                        return Promise.resolve();
                    },
                    },
                ]}
            >
                <TextArea
                    rows={4}
                    placeholder={t("messageModal.place_holder_mess")}
                    maxLength={280}
                    showCount
                />
            </Form.Item>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={onClose}>{t("messageModal.cancel")}</Button>
            <Button type="primary" htmlType="submit">
                {formData?.id ? t("messageModal.update") : t("messageModal.send")}
            </Button>
            </div>
        </Form>
        </Modal>
    );
}

export default MessageModal;