import Icon from './Icon';

export default function CertificateModal({ certificate, onClose, onDownload }) {
  if (!certificate) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="certificate-modal" onClick={(event) => event.stopPropagation()}>
        <div className="certificate-scroll">
          <div className="certificate-sheet">
            <div className="certificate-header">
              <span className="certificate-brand">Sigverse Academy</span>
              <div className="certificate-emblem">
                <Icon name="certificate" size={28} />
              </div>
            </div>
            <h2 className="certificate-title">Certificate of Completion</h2>
            <p className="certificate-subtitle">This certificate is proudly presented to</p>
            <div className="certificate-name">{certificate.learnerName}</div>
            <p className="certificate-body">for successfully completing the course</p>
            <div className="certificate-course">{certificate.courseTitle}</div>
            <div className="certificate-footer">
              <div className="certificate-date">
                <span>Date</span>
                <strong>{certificate.completedDate}</strong>
              </div>
              <div className="certificate-signature-block">
                <span className="certificate-signature">Sigverse Learning</span>
                <span className="certificate-signature-label">Director of Learning</span>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-primary" onClick={onDownload}>
            Download PDF
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
