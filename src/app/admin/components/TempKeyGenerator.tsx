'use client';

import React, { useState } from 'react';

interface TempKeyGeneratorProps {
  apiKey: string;
  lang: 'zh' | 'en';
  t: any;
}

export default function TempKeyGenerator({
  apiKey,
  lang,
  t,
}: TempKeyGeneratorProps) {
  // Temporary Key Generator States
  const [tempDuration, setTempDuration] = useState<number>(86400); // Default 1 day (86400 seconds)
  const [generatedKey, setGeneratedKey] = useState<string>('');
  const [generatedKeyExpires, setGeneratedKeyExpires] = useState<string>('');
  const [tempKeyLoading, setTempKeyLoading] = useState<boolean>(false);
  const [tempKeyMessage, setTempKeyMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleGenerateTempKey = async () => {
    setTempKeyLoading(true);
    setTempKeyMessage(null);
    setGeneratedKey('');
    setGeneratedKeyExpires('');
    setCopied(false);
    try {
      const res = await fetch('/api/admin/temp-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ durationSeconds: tempDuration }),
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error?.message || 'Failed to generate temporary key');
      }
      setGeneratedKey(resData.key);
      setGeneratedKeyExpires(resData.expiresAt);
      setTempKeyMessage({ text: lang === 'zh' ? '生成成功！' : 'Key generated successfully!', type: 'success' });
    } catch (e) {
      setTempKeyMessage({
        text: e instanceof Error ? e.message : (lang === 'zh' ? '生成失败' : 'Failed to generate temporary key'),
        type: 'error',
      });
    } finally {
      setTempKeyLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="glass-panel">
      <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '0.5rem', color: '#fff', fontWeight: 600 }}>
        {t.tempKeyTitle}
      </h2>
      <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: 0, marginBottom: '1.5rem', lineHeight: '1.5' }}>
        {t.tempKeyDesc}
      </p>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: '#d1d5db', fontSize: '0.9rem' }}>{t.tempDurationLabel}</span>
          <select
            value={tempDuration}
            onChange={(e) => setTempDuration(Number(e.target.value))}
            disabled={tempKeyLoading}
            className="custom-select"
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value={3600}>{t.duration1h}</option>
            <option value={86400}>{t.duration1d}</option>
            <option value={604800}>{t.duration7d}</option>
            <option value={2592000}>{t.duration30d}</option>
            <option value={315360000}>{t.durationPermanent}</option>
          </select>
        </div>

        <button
          onClick={handleGenerateTempKey}
          disabled={tempKeyLoading}
          style={{
            padding: '0.5rem 1.5rem',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#10b981',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            cursor: tempKeyLoading ? 'wait' : 'pointer',
            opacity: tempKeyLoading ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#059669'; }}
          onMouseLeave={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#10b981'; }}
        >
          {tempKeyLoading ? '...' : t.generateBtn}
        </button>
      </div>

      {tempKeyMessage && (
        <p style={{
          color: tempKeyMessage.type === 'error' ? '#ef4444' : '#10b981',
          fontSize: '0.9rem',
          margin: '0.5rem 0',
          fontWeight: 500
        }}>
          {tempKeyMessage.text}
        </p>
      )}

      {generatedKey && (
        <div style={{
          marginTop: '1.25rem',
          padding: '1.25rem',
          borderRadius: '8px',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
        }} className="config-card">
          <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.5rem', fontWeight: 500 }}>
            {t.generatedKeyLabel}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              readOnly
              value={generatedKey}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              style={{
                flex: 1,
                padding: '0.6rem',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                color: '#10b981',
                outline: 'none',
              }}
            />
            <button
              onClick={handleCopy}
              style={{
                padding: '0.6rem 1rem',
                borderRadius: '6px',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#34d399',
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)'; }}
            >
              {copied ? t.copied : t.copy}
            </button>
          </div>
          {generatedKeyExpires && (
            <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.75rem' }}>
              {t.expiresAtLabel} <code style={{ fontFamily: 'monospace', color: '#f3f4f6' }}>{new Date(generatedKeyExpires).toLocaleString()}</code>
            </div>
          )}
        </div>
      )}

      <div style={{
        marginTop: '1.25rem',
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        backgroundColor: 'rgba(239, 68, 68, 0.06)',
        border: '1px solid rgba(239, 68, 68, 0.15)',
        color: '#fca5a5',
        fontSize: '0.85rem',
        lineHeight: '1.4'
      }}>
        {t.tempKeyNotice}
      </div>
    </section>
  );
}
