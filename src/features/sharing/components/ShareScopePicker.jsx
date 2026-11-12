'use client';

import React from 'react';
import { ALLOWED_SCOPES, getScopeLabel } from '../constants/sharing.constants.js';
import { useApp } from '@/shared/context/AppContext.js';

export function ShareScopePicker({ selectedScope, onSelectScope, className = '' }) {
    const { t, lang } = useApp();

    return (
        <div className={`space-y-1.5 ${className}`}>
            <label className="text-[12px] font-semibold text-ink">
                {t('Sharing Scope', 'نطاق المشاركة')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ALLOWED_SCOPES.map(scope => {
                    const isSelected = selectedScope === scope;
                    return (
                        <button
                            key={scope}
                            type="button"
                            onClick={() => onSelectScope(scope)}
                            className={`p-2 rounded-lg text-start text-[11.5px] border font-medium transition-all cursor-pointer ${
                                isSelected
                                    ? 'bg-primary/10 border-primary text-primary font-bold shadow-xs ring-1 ring-primary/30'
                                    : 'bg-surface border-line text-inkSecondary hover:bg-surfaceMuted hover:text-ink'
                            }`}
                        >
                            {getScopeLabel(scope, lang)}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default ShareScopePicker;
