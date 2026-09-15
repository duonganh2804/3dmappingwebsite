import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);

// Execute the actual store and header without a browser/backend. Only Vite's
// environment/asset imports and browser navigation hooks are substituted.
function load(relativePath: string, globals: object, dependencies: Record<string, unknown> = {}) {
  const filename = new URL(relativePath, import.meta.url);
  const source = readFileSync(filename, 'utf8').replace('import.meta.env.VITE_API_URL', 'undefined');
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true
  }, fileName: filename.pathname });
  const module = { exports: {} as any };
  runInNewContext(outputText, {
    module, exports: module.exports, console,
    require: (name: string) => Object.hasOwn(dependencies, name) ? dependencies[name] : require(name),
    ...globals
  }, { filename: filename.pathname });
  return module.exports;
}

const user = { id: 'test-user', fullName: 'Test User', email: 'test@example.com', role: 'USER' };
const response = (ok: boolean, data: object) => ({ ok, json: async () => data });

function fixture(initial: Record<string, string> = {}, fetcher: (...args: any[]) => Promise<unknown> = async () => {
  throw new Error('Unexpected auth request');
}) {
  const storage = new Map(Object.entries(initial));
  const requests: string[] = [];
  const localStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key)
  };
  const { useAuthStore } = load('../src/store/useAuthStore.ts', {
    localStorage,
    fetch: async (url: string, options: unknown) => { requests.push(url); return fetcher(url, options); }
  });
  const navigation = load('../src/config/siteNavigation.ts', {});
  const { SiteHeader } = load('../src/components/SiteHeader.tsx', {}, {
    'react-router-dom': { useNavigate: () => () => {}, useLocation: () => ({ pathname: '/' }) },
    '../assets/logo.webp': 'logo.webp',
    '../hooks/useLanguage': { useLanguage: () => ({ currentLang: 'vi', setCurrentLang: () => {} }) },
    '../hooks/useDemoNavigation': { useDemoNavigation: () => ({ openDemo: () => {}, isDemoLoading: false }) },
    '../store/useAuthStore': { useAuthStore: () => useAuthStore.getState() },
    '../config/siteNavigation': navigation
  });
  return { store: useAuthStore, storage, requests, header: () => renderToStaticMarkup(React.createElement(SiteHeader)) };
}

test('A: first anonymous render contains Login/Demo; repeated bootstrap calls make zero auth requests', async () => {
  const { store, requests, header } = fixture();
  assert.equal(store.getState().isLoading, false);
  assert.match(header(), />Đăng nhập</);
  assert.match(header(), /Đăng ký demo/);
  assert.doesNotMatch(header(), /aria-busy="true"/);
  const seen: boolean[] = [];
  store.subscribe((state: any) => seen.push(state.isLoading));
  await Promise.all([store.getState().checkAuth(), store.getState().checkAuth()]);
  assert.equal(requests.length, 0);
  assert.ok(seen.every(loading => !loading));
});

test('B: stored token shows a placeholder while me is pending, then the account without a Login flash', async () => {
  let resolveMe!: (value: unknown) => void;
  const { store, header, requests } = fixture({ accessToken: 'test-token' }, () => new Promise(resolve => { resolveMe = resolve; }));
  assert.equal(store.getState().isLoading, true);
  assert.match(header(), /aria-busy="true"/);
  assert.doesNotMatch(header(), />Đăng nhập</);
  const pending = store.getState().checkAuth();
  assert.match(header(), /aria-busy="true"/);
  resolveMe(response(true, { success: true, user }));
  await pending;
  assert.equal(store.getState().isAuthenticated, true);
  assert.match(header(), /Bảng điều khiển/);
  assert.doesNotMatch(header(), />Đăng nhập</);
  assert.equal(requests.length, 1);
});

test('C: expired token and rejected refresh clear local auth; subsequent bootstrap does not loop', async () => {
  const { store, storage, requests, header } = fixture({ accessToken: 'expired' }, async () => response(false, { success: false }));
  await store.getState().checkAuth();
  assert.equal(requests.length, 2);
  assert.ok(requests[0].endsWith('/auth/me'));
  assert.ok(requests[1].endsWith('/auth/refresh'));
  assert.equal(storage.has('accessToken'), false);
  assert.equal(store.getState().isLoading, false);
  assert.match(header(), />Đăng nhập</);
  await store.getState().checkAuth();
  assert.equal(requests.length, 2);
});

test('refresh recovery still persists the replacement token and authenticated user', async () => {
  const { store, storage, requests } = fixture({ accessToken: 'expired' }, async (url: string) =>
    url.endsWith('/auth/me') ? response(false, { success: false }) : response(true, { success: true, user, accessToken: 'renewed' }));
  await store.getState().checkAuth();
  assert.equal(store.getState().isAuthenticated, true);
  assert.equal(storage.get('accessToken'), 'renewed');
  assert.equal(requests.length, 2);
});

test('D: logout renders Login/Demo synchronously even when the logout API is pending', async () => {
  let resolveLogout!: (value: unknown) => void;
  const { store, storage, header } = fixture({}, () => new Promise(resolve => { resolveLogout = resolve; }));
  store.getState().setAuth(user, 'test-token');
  const pending = store.getState().logout();
  assert.equal(store.getState().isLoading, false);
  assert.equal(storage.has('accessToken'), false);
  assert.equal(storage.get('authLoggedOut'), 'true');
  assert.match(header(), />Đăng nhập</);
  assert.match(header(), /Đăng ký demo/);
  resolveLogout(response(true, { success: true }));
  await pending;
});

test('explicit logout marker takes precedence over a leftover stored token at the first render', async () => {
  const { store, requests, storage, header } = fixture({ accessToken: 'leftover', authLoggedOut: 'true' });
  assert.equal(store.getState().accessToken, null);
  assert.equal(store.getState().isLoading, false);
  assert.match(header(), />Đăng nhập</);
  await store.getState().checkAuth();
  assert.equal(requests.length, 0);
  assert.equal(storage.has('accessToken'), false);
});
