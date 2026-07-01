import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';

// The PWA share_target action opens the /share-target path, but the router
// runs in hash mode - rewrite to the hash route, moving the query params
// into the hash so the server never has to handle them
if (window.location.pathname === '/share-target') {
  window.location.replace(`/#/share-target${window.location.search}`);
}

const app = mount(App, {
  target: document.getElementById('app') as HTMLElement,
});

export default app;
