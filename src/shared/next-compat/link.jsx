import React, { forwardRef } from 'react';
import { useRouter } from '@tanstack/react-router';

function toHref(href) {
    if (!href) return '#';
    if (typeof href === 'string') return href;
    const { pathname = '', query, hash } = href;
    const qs = query ? `?${new URLSearchParams(query).toString()}` : '';
    return `${pathname}${qs}${hash ? `#${hash}` : ''}`;
}

/** next/link replacement: a real anchor with client-side navigation for in-app paths. */
const Link = forwardRef(function Link({ href, replace, scroll, prefetch, passHref, legacyBehavior, shallow, locale, onClick, target, children, ...rest }, ref) {
    const router = useRouter();
    const url = toHref(href);
    const isInternal = url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/api/');
    const handleClick = (e) => {
        if (onClick) onClick(e);
        if (e.defaultPrevented || !isInternal || target === '_blank' || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        router.navigate({ href: url, replace: Boolean(replace), resetScroll: scroll !== false });
    };
    if (legacyBehavior && React.isValidElement(children)) {
        return React.cloneElement(children, { href: url, onClick: handleClick, ref });
    }
    return <a ref={ref} href={url} target={target} onClick={handleClick} {...rest}>{children}</a>;
});

export default Link;
