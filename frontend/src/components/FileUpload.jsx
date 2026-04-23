import React, { useState } from 'react';
import { Upload, CheckCircle, Shield, Zap, Loader2 } from 'lucide-react';

// ─── FILE UPLOAD ────────────────────────────────────────────────────────────────
const FileUpload = ({ onUpload, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else setDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault(); setDragActive(false);
    if (e.dataTransfer.files[0]) onUpload(e.dataTransfer.files[0]);
  };
  return (
    <div
      className={`rai-upload-zone${dragActive ? ' drag-active' : ''}`}
      onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
    >
      <input type="file" style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0, cursor:'pointer' }}
        onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])} accept=".pdf,.doc,.docx" disabled={isLoading} />
      <div className="rai-upload-icon">
        {isLoading ? <Loader2 size={28} style={{ color:'var(--accent)', animation:'spin 1s linear infinite' }} /> : <Upload size={28} />}
      </div>
      <h3>{isLoading ? 'Analyzing resume…' : 'Drop your resume here'}</h3>
      <p>{isLoading ? 'Running ML classification & AI analysis' : 'PDF, DOC, DOCX — PII scrubbed before processing'}</p>
      {!isLoading && (
        <div className="rai-upload-meta">
          <span className="rai-upload-meta-item"><CheckCircle size={13} /> Encrypted transit</span>
          <span className="rai-upload-meta-item"><Shield size={13} /> Zero data retention</span>
          <span className="rai-upload-meta-item"><Zap size={13} /> Instant results</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;