import '../css/app.css';
import faviconUrl from '../images/favicon.ico';

import { createInertiaApp } from '@inertiajs/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const pages = import.meta.glob('./Pages/**/*.jsx');

document.querySelector('link[rel="icon"]')?.setAttribute('href', faviconUrl);

createInertiaApp({
    resolve: (name) => pages[`./Pages/${name}.jsx`](),
    setup({ el, App, props }) {
        createRoot(el).render(
            <StrictMode>
                <App {...props} />
            </StrictMode>,
        );
    },
});
