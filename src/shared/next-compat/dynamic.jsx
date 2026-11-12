import React, { Suspense, lazy } from 'react';

/** next/dynamic replacement built on React.lazy. */
export default function dynamic(loader, options = {}) {
    const LazyComponent = lazy(async () => {
        const mod = await loader();
        return { default: mod?.default ?? mod };
    });
    const Loading = options.loading;
    function DynamicComponent(props) {
        return (
            <Suspense fallback={Loading ? <Loading /> : null}>
                <LazyComponent {...props} />
            </Suspense>
        );
    }
    return DynamicComponent;
}
