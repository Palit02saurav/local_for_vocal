"use client";

import { useState } from "react";
import api from "@/lib/api";
import "./mailModal.css";

export default function MailModal({ isSuperAdmin, mails, loading, onSent, onClose }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expandedIds, setExpandedIds] = useState(new Set());

  const toggleExpanded = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const CLAMP_THRESHOLD = 140;

  const handleSend = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!subject.trim() || !body.trim()) {
      setError("Subject and message are both required.");
      return;
    }

    setSending(true);
    try {
      await api.post("/mails", { subject, body });
      setSuccess("Mail sent to all sellers.");
      setSubject("");
      setBody("");
      onSent?.();
    } catch (err) {
      setError(err.message || "Failed to send mail.");
    }
    setSending(false);
  };

  return (
    <div className="mail-modal-overlay" onClick={onClose}>
      <div className="mail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mail-modal-header">
          <h2>{isSuperAdmin ? "Mail Sellers" : "Mailbox"}</h2>
          <button className="mail-modal-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="mail-modal-body">
          {isSuperAdmin && (
            <form className="mail-modal-compose" onSubmit={handleSend}>
              <label>
                Subject
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Platform maintenance on Sunday"
                />
              </label>
              <label>
                Message
                <textarea
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write the announcement all sellers will see..."
                />
              </label>

              {error && <div className="mail-modal-error">{error}</div>}
              {success && <div className="mail-modal-success">{success}</div>}

              <button type="submit" className="mail-modal-send" disabled={sending}>
                {sending ? "Sending..." : "Send to all sellers"}
              </button>
            </form>
          )}

          <div className="mail-modal-section">
            <h3>{isSuperAdmin ? "Sent" : "Inbox"}</h3>
            {loading ? (
              <div className="mail-modal-empty">Loading...</div>
            ) : mails.length === 0 ? (
              <div className="mail-modal-empty">No mails yet.</div>
            ) : (
              <div className="mail-modal-list">
                {mails.map((m) => {
                  const isLong = m.body.length > CLAMP_THRESHOLD;
                  const isExpanded = expandedIds.has(m.id);
                  return (
                    <div key={m.id} className="mail-modal-item">
                      <div className="mail-modal-item-subject">{m.subject}</div>
                      <div
                        className={`mail-modal-item-body ${
                          isLong && !isExpanded ? "mail-modal-item-body-clamped" : ""
                        }`}
                      >
                        {m.body}
                      </div>
                      {isLong && (
                        <button
                          type="button"
                          className="mail-modal-toggle"
                          onClick={() => toggleExpanded(m.id)}
                        >
                          {isExpanded ? "Show less" : "Show more"}
                        </button>
                      )}
                      <div className="mail-modal-item-date">
                        {new Date(m.created_at).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}