import React, { useMemo } from 'react';
import { useParams, useLocation } from '@tanstack/react-router';

// Next.js passes `params` and `searchParams` to pages as promises read with React.use().
// A pre-resolved thenable lets use() return synchronously without suspending.
function resolved(value) {
    const p = Promise.resolve(value);
    p.status = 'fulfilled';
    p.value = value;
    return p;
}

/** Renders an original Next.js page component inside a TanStack route. */
export function NextPage({ component: Component, ...props }) {
    const params = useParams({ strict: false }) || {};
    const searchStr = useLocation({ select: (l) => l.searchStr || '' });
    const paramsKey = JSON.stringify(params);
    const paramsPromise = useMemo(() => {
        const out = { ...params };
        if (out._splat !== undefined) {
            out.slug = String(out._splat).split('/').filter(Boolean);
            delete out._splat;
        }
        return resolved(out);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paramsKey]);
    const searchPromise = useMemo(() => resolved(Object.fromEntries(new URLSearchParams(searchStr))), [searchStr]);
    return <Component params={paramsPromise} searchParams={searchPromise} {...props} />;
}

export default NextPage;
