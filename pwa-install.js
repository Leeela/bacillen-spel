(function () {
  // Registrera service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {});
    });
  }

  // Plattformsdetektering
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isAndroid = /Android/.test(ua);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
  const isFirefox = ua.toLowerCase().includes('firefox');
  const isSafariMac =
    /^((?!chrome|android).)*safari/i.test(ua) && !isIOS;

  // Visa inte bannern om appen är installerad, om Firefox/Safari Mac, eller om användaren stängt den
  if (
    isStandalone ||
    isFirefox ||
    isSafariMac ||
    localStorage.getItem('pwa-banner-dismissed') === 'true'
  ) {
    return;
  }

  // Välj instruktionstext baserat på plattform
  let bannerText = '';
  let showInstallButton = false;

  if (isIOS) {
    bannerText =
      'Spara Bacillerna som app! Tryck på dela ikonen och välj "Lägg till på hemskärmen" 🍬';
  } else if (isAndroid) {
    bannerText = 'Installera Bacillerna som app — tryck här 🍬';
    showInstallButton = true;
  } else {
    // Desktop Chromium
    bannerText =
      'Installera Bacillerna som app! Klicka på install ikonen i adressfältet eller välj "Installera Bacillerna" i webbläsarens meny 🍬';
  }

  // Bygg bannern
  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.setAttribute('role', 'banner');
  banner.innerHTML =
    '<span class="pwa-banner-text">' +
    bannerText +
    '</span>' +
    (showInstallButton
      ? '<button class="pwa-install-btn" aria-label="Installera Bacillerna som app">Installera</button>'
      : '') +
    '<button class="pwa-close-btn" aria-label="Stäng installationsbanner">✕</button>';

  const style = document.createElement('style');
  style.textContent =
    '#pwa-install-banner{' +
    'position:fixed;top:0;left:0;right:0;z-index:9999;' +
    'background:#7BC142;color:#fff;' +
    'display:flex;align-items:center;gap:12px;' +
    'padding:12px 16px;font-family:inherit;font-size:14px;line-height:1.4;' +
    'box-shadow:0 2px 8px rgba(0,0,0,0.15);' +
    'transform:translateY(-100%);transition:transform 0.35s ease;' +
    '}' +
    '#pwa-install-banner.pwa-visible{transform:translateY(0);}' +
    '#pwa-install-banner.pwa-hiding{transform:translateY(-100%);opacity:0;transition:transform 0.3s ease,opacity 0.3s ease;}' +
    '.pwa-banner-text{flex:1;}' +
    '.pwa-install-btn{' +
    'background:#fff;color:#5C9B22;border:none;border-radius:20px;' +
    'padding:6px 14px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;' +
    '}' +
    '.pwa-close-btn{' +
    'background:none;border:none;color:#fff;font-size:18px;cursor:pointer;' +
    'padding:0 4px;line-height:1;flex-shrink:0;' +
    '}';

  function dismiss() {
    banner.classList.remove('pwa-visible');
    banner.classList.add('pwa-hiding');
    localStorage.setItem('pwa-banner-dismissed', 'true');
    setTimeout(() => banner.remove(), 350);
  }

  banner.querySelector('.pwa-close-btn').addEventListener('click', dismiss);

  // Android: lyssna på beforeinstallprompt
  let deferredPrompt = null;

  if (showInstallButton) {
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferredPrompt = e;
    });

    banner.querySelector('.pwa-install-btn').addEventListener('click', () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => {
          deferredPrompt = null;
          dismiss();
        });
      } else {
        dismiss();
      }
    });
  }

  document.head.appendChild(style);

  // Lägg till bannern när DOM är redo
  function addBanner() {
    document.body.insertAdjacentElement('afterbegin', banner);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        banner.classList.add('pwa-visible');
      });
    });
  }

  if (document.body) {
    addBanner();
  } else {
    document.addEventListener('DOMContentLoaded', addBanner);
  }
})();
