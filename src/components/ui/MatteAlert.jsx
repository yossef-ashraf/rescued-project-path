'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { useApp } from '@/shared/context/AppContext.js';

const EVENT_NAME = 'codex:matte-alert';

const TONES = {
  info: { icon: Info, labelEn: 'Information', labelAr: 'معلومة', alertRole: false },
  success: { icon: CheckCircle2, labelEn: 'Success', labelAr: 'تم بنجاح', alertRole: false },
  neutral: { icon: Info, labelEn: 'Notice', labelAr: 'تنبيه', alertRole: false },
  warning: { icon: TriangleAlert, labelEn: 'Warning', labelAr: 'تحذير', alertRole: true },
  danger: { icon: AlertCircle, labelEn: 'Error', labelAr: 'خطأ', alertRole: true }
};

export function announceMatteAlert(detail = {}) {
  if (typeof window === 'undefined') return;
  const normalized = {
    id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tone: detail.tone || 'info',
    title: detail.title || '',
    message: detail.message || detail.description || '',
    actionLabel: detail.actionLabel || detail.action?.label || null,
    onAction: detail.onAction || detail.action?.onClick || null,
    duration: typeof detail.duration === 'number' ? detail.duration : 4500,
    dismissible: detail.dismissible !== false
  };

  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: normalized }));
}

function SingleAlertItem({ alert, onDismiss, t }) {
  const toneConfig = TONES[alert.tone] || TONES.info;
  const Icon = toneConfig.icon;
  const isAssertive = toneConfig.alertRole;

  return (
    <div
      className={`matte-alert matte-alert-${alert.tone || 'info'}`}
      role={isAssertive ? 'alert' : 'status'}
      aria-live={isAssertive ? 'assertive' : 'polite'}
    >
      <div className="matte-alert-icon shrink-0 mt-0.5" aria-hidden="true">
        <Icon size={18} strokeWidth={2.2} />
      </div>

      <div className="matte-alert-copy flex-1 min-w-0">
        <div className="matte-alert-title">
          {alert.title || t(toneConfig.labelEn, toneConfig.labelAr)}
        </div>
        {alert.message && (
          <div className="matte-alert-description">
            {alert.message}
          </div>
        )}
        {alert.actionLabel && typeof alert.onAction === 'function' && (
          <div className="matte-alert-actions">
            <button
              type="button"
              className="matte-alert-action"
              onClick={() => {
                alert.onAction();
                onDismiss(alert.id);
              }}
            >
              {alert.actionLabel}
            </button>
          </div>
        )}
      </div>

      {alert.dismissible && (
        <button
          type="button"
          className="matte-alert-close shrink-0"
          onClick={() => onDismiss(alert.id)}
          aria-label={t('Dismiss alert', 'إغلاق التنبيه')}
          title={t('Dismiss alert', 'إغلاق التنبيه')}
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}

export default function MatteAlertHost() {
  const { t } = useApp();
  const [alerts, setAlerts] = useState([]);
  const timersRef = useRef(new Map());

  const removeAlert = useCallback((id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    if (timersRef.current.has(id)) {
      clearTimeout(timersRef.current.get(id));
      timersRef.current.delete(id);
    }
  }, []);

  useEffect(() => {
    const handleAlert = (event) => {
      const nextAlert = event.detail;
      if (!nextAlert || !nextAlert.id) return;

      setAlerts((prev) => [...prev, nextAlert]);

      if (nextAlert.duration > 0) {
        const timer = setTimeout(() => {
          removeAlert(nextAlert.id);
        }, nextAlert.duration);
        timersRef.current.set(nextAlert.id, timer);
      }
    };

    window.addEventListener(EVENT_NAME, handleAlert);

    const currentTimers = timersRef.current;
    return () => {
      window.removeEventListener(EVENT_NAME, handleAlert);
      currentTimers.forEach((timer) => clearTimeout(timer));
      currentTimers.clear();
    };
  }, [removeAlert]);

  if (alerts.length === 0) return null;

  return (
    <div
      className="matte-alert-region fixed bottom-20 lg:bottom-5 end-4 z-[180] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-label={t('Application feedback notifications', 'إشعارات النظام')}
    >
      {alerts.map((alert) => (
        <SingleAlertItem
          key={alert.id}
          alert={alert}
          onDismiss={removeAlert}
          t={t}
        />
      ))}
    </div>
  );
}
