import React, { forwardRef } from 'react';

/** next/image replacement: a plain responsive img. */
const Image = forwardRef(function Image({ src, alt = '', width, height, fill, priority, quality, placeholder, blurDataURL, unoptimized, loader, sizes, style, className, ...rest }, ref) {
    const resolved = typeof src === 'object' && src !== null ? src.src : src;
    const fillStyle = fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...style } : style;
    return (
        <img
            ref={ref}
            src={resolved}
            alt={alt}
            width={fill ? undefined : width}
            height={fill ? undefined : height}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            sizes={sizes}
            style={fillStyle}
            className={className}
            {...rest}
        />
    );
});

export default Image;
