import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';

// The PWA share_target action opens the <base>/share-target path, but the
// router runs in hash mode - rewrite to the hash route, moving the query
// params into the hash so the server never has to handle them
const basePath = import.meta.env.BASE_URL;
if (window.location.pathname === `${basePath}share-target`) {
  window.location.replace(`${basePath}#/share-target${window.location.search}`);
}

const app = mount(App, {
  target: document.getElementById('app') as HTMLElement,
});

export default app;
