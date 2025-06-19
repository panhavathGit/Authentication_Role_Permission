import React from "react";
import Modal from "./Modal";

export default function DialogModal({
    show = false,
    maxWidth = "2xl",
    closeable = true,
    onClose,
    title,
    content,
    footer,
    children,
}) {
    return (
        <Modal
            show={show}
            maxWidth={maxWidth}
            closeable={closeable}
            onClose={onClose}
        >
            {title || content || footer ? (
                <>
                    {title && (
                        <div className="modal-header">
                            <h4 className="modal-title">{title}</h4>
                            {closeable && (
                                <button
                                    type="button"
                                    className="close"
                                    onClick={onClose}
                                >
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            )}
                        </div>
                    )}
                    {content && <div className="modal-body">{content}</div>}
                    {footer && <div className="modal-footer">{footer}</div>}
                </>
            ) : (
                children
            )}
        </Modal>
    );
}
