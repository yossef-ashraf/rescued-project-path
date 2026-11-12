'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Command, Search, ArrowUpRight, X, WalletCards, CheckSquare2, GraduationCap, UserRound, Settings2 } from 'lucide-react';
import { useRouter } from '@/shared/next-compat/navigation';
import { useApp } from '@/shared/context/AppContext.js';

const COMMANDS = [
  { id: 'overview', group: 'Navigate', label: 'Financial overview', arabic: 'نظرة عامة مالية', href: '/', icon: WalletCards },
  { id: 'tasks', group: 'Navigate', label: 'Tasks workspace', arabic: 'مساحة المهام', href: '/tasks/overview', icon: CheckSquare2 },
  { id: 'courses', group: 'Navigate', label: 'Learning hub', arabic: 'مركز التعلم والكورسات', href: '/courses/overview', icon: GraduationCap },
  { id: 'profile', group: 'Navigate', label: 'Profile dashboard', arabic: 'لوحة البروفايل', href: '/profile/basic', icon: UserRound },
  { id: 'settings', group: 'Navigate', label: 'System settings', arabic: 'إعدادات النظام', href: '/settings/drive-config', icon: Settings2 },
];

export default function CommandPalette() {
  const { t, lang } = useApp();
  const router = useRouter();
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return COMMANDS;
    return COMMANDS.filter(command => `${command.label} ${command.arabic} ${command.group}`.toLowerCase().includes(value));
  }, [query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActiveIndex(0);
  }, []);

  const go = useCallback((command) => {
    if (!command) return;
    close();
    router.push(command.href);
  }, [close, router]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(value => !value);
      }
      if (!open) return;
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex(index => Math.min(index + 1, Math.max(filtered.length - 1, 0)));
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex(index => Math.max(index - 1, 0));
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        go(filtered[activeIndex]);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, filtered, activeIndex, close, go]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    const handleToggle = () => setOpen(v => !v);
    window.addEventListener('open-command-palette', handleOpen);
    window.addEventListener('toggle-command-palette', handleToggle);
    return () => {
      window.removeEventListener('open-command-palette', handleOpen);
      window.removeEventListener('toggle-command-palette', handleToggle);
    };
  }, []);

  return (
    <>
      {open && (
        <div className="command-palette-layer" role="presentation" onMouseDown={close}>
          <div className="command-palette" role="dialog" aria-modal="true" aria-label={t('Command center', 'مركز الأوامر')} onMouseDown={event => event.stopPropagation()}>
            <div className="command-palette-search">
              <Search size={18} />
              <input
                ref={inputRef}
                value={query}
                onChange={event => { setQuery(event.target.value); setActiveIndex(0); }}
                placeholder={t('Search workspace, pages, actions…', 'ابحث في الصفحات والإجراءات…')}
                aria-label={t('Search commands', 'البحث في الأوامر')}
              />
              <button type="button" onClick={close} aria-label={t('Close', 'إغلاق')}><X size={17} /></button>
            </div>
            <div className="command-palette-hint">
              <span>{t('Navigate with arrows', 'تحرك بالأسهم')}</span>
              <span><kbd>ESC</kbd> {t('to close', 'للإغلاق')}</span>
            </div>
            <div className="command-palette-list">
              {filtered.length === 0 ? (
                <div className="command-empty">{t('Nothing found. Try another search.', 'لم يتم العثور على نتائج. جرّب بحثًا آخر.')}</div>
              ) : filtered.map((command, index) => {
                const Icon = command.icon;
                return (
                  <button key={command.id} type="button" className={`command-item ${index === activeIndex ? 'is-active' : ''}`} onMouseEnter={() => setActiveIndex(index)} onClick={() => go(command)}>
                    <span className="command-item-icon"><Icon size={16} /></span>
                    <span className="command-item-copy"><strong>{lang === 'ar' ? command.arabic : command.label}</strong><small>{command.group}</small></span>
                    <ArrowUpRight size={15} className="command-item-arrow" />
                  </button>
                );
              })}
            </div>
            <div className="command-palette-footer"><span><Command size={12} /> K</span><span>{t('Global command center', 'مركز أوامر شامل')}</span></div>
          </div>
        </div>
      )}
    </>
  );
}
