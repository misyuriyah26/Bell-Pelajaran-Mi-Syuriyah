import { SchoolProfile } from '../types';

export interface GeneratedPwaIcons {
  icon192: string;
  icon512: string;
  iconMaskable: string;
  appleTouchIcon: string;
}

let activeManifestObjectUrl: string | null = null;

/**
 * Loads an image URL safely with CORS / fallback support.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // If CORS or error fails, try without crossOrigin
      const fallbackImg = new Image();
      fallbackImg.onload = () => resolve(fallbackImg);
      fallbackImg.onerror = (e) => reject(e);
      fallbackImg.src = src;
    };
    img.src = src;
  });
}

/**
 * Generates multi-resolution PNG data URLs from any source image (base64 data URL, PNG, JPG, WebP)
 * for standard PWA icons (192x192, 512x512, 512x512 maskable with safe margin, and 180x180 apple-touch-icon).
 */
export async function generatePwaIcons(sourceImageUrl: string): Promise<GeneratedPwaIcons> {
  try {
    const img = await loadImage(sourceImageUrl);

    // 1. Generate 192x192 PNG
    const canvas192 = document.createElement('canvas');
    canvas192.width = 192;
    canvas192.height = 192;
    const ctx192 = canvas192.getContext('2d');
    if (ctx192) {
      ctx192.imageSmoothingEnabled = true;
      ctx192.imageSmoothingQuality = 'high';
      ctx192.drawImage(img, 0, 0, 192, 192);
    }
    const icon192 = canvas192.toDataURL('image/png');

    // 2. Generate 512x512 PNG
    const canvas512 = document.createElement('canvas');
    canvas512.width = 512;
    canvas512.height = 512;
    const ctx512 = canvas512.getContext('2d');
    if (ctx512) {
      ctx512.imageSmoothingEnabled = true;
      ctx512.imageSmoothingQuality = 'high';
      ctx512.drawImage(img, 0, 0, 512, 512);
    }
    const icon512 = canvas512.toDataURL('image/png');

    // 3. Generate 512x512 Maskable Icon (with 15% safe-zone padding and brand backdrop)
    const canvasMaskable = document.createElement('canvas');
    canvasMaskable.width = 512;
    canvasMaskable.height = 512;
    const ctxMaskable = canvasMaskable.getContext('2d');
    if (ctxMaskable) {
      ctxMaskable.imageSmoothingEnabled = true;
      ctxMaskable.imageSmoothingQuality = 'high';
      
      // Draw brand background to prevent transparent border issues on Android adaptive icons
      ctxMaskable.fillStyle = '#020617'; // slate-950
      ctxMaskable.fillRect(0, 0, 512, 512);

      // Safe zone is central 70-80% area
      const safePadding = 512 * 0.12; // 61.4px
      const safeSize = 512 - (safePadding * 2); // 389.2px
      ctxMaskable.drawImage(img, safePadding, safePadding, safeSize, safeSize);
    }
    const iconMaskable = canvasMaskable.toDataURL('image/png');

    // 4. Generate 180x180 Apple Touch Icon
    const canvasApple = document.createElement('canvas');
    canvasApple.width = 180;
    canvasApple.height = 180;
    const ctxApple = canvasApple.getContext('2d');
    if (ctxApple) {
      ctxApple.imageSmoothingEnabled = true;
      ctxApple.imageSmoothingQuality = 'high';
      ctxApple.drawImage(img, 0, 0, 180, 180);
    }
    const appleTouchIcon = canvasApple.toDataURL('image/png');

    return {
      icon192,
      icon512,
      iconMaskable,
      appleTouchIcon
    };
  } catch (err) {
    console.warn('generatePwaIcons fallback to original source:', err);
    return {
      icon192: sourceImageUrl,
      icon512: sourceImageUrl,
      iconMaskable: sourceImageUrl,
      appleTouchIcon: sourceImageUrl
    };
  }
}

/**
 * Updates browser link tags (icon, apple-touch-icon, and manifest.json) dynamically
 * so that installed PWAs, desktop shortcuts, and browser tabs immediately reflect
 * the custom logo or favicon configured in the admin panel.
 */
export async function updateAppIconsAndManifest(profile: SchoolProfile): Promise<void> {
  if (typeof document === 'undefined') return;

  const targetIconSrc = profile.faviconUrl || profile.logoUrl || '/app-icon.jpg';

  try {
    const icons = await generatePwaIcons(targetIconSrc);

    // 1. Update <link rel="icon">
    let linkIcon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!linkIcon) {
      linkIcon = document.createElement('link');
      linkIcon.rel = 'icon';
      document.head.appendChild(linkIcon);
    }
    linkIcon.type = 'image/png';
    linkIcon.href = icons.icon192;

    // 2. Update <link rel="shortcut icon">
    let linkShortcut = document.querySelector('link[rel="shortcut icon"]') as HTMLLinkElement;
    if (!linkShortcut) {
      linkShortcut = document.createElement('link');
      linkShortcut.rel = 'shortcut icon';
      document.head.appendChild(linkShortcut);
    }
    linkShortcut.type = 'image/png';
    linkShortcut.href = icons.icon192;

    // 3. Update <link rel="apple-touch-icon">
    let linkApple = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
    if (!linkApple) {
      linkApple = document.createElement('link');
      linkApple.rel = 'apple-touch-icon';
      document.head.appendChild(linkApple);
    }
    linkApple.href = icons.appleTouchIcon;

    // 4. Update Document Title and Mobile Web App Meta
    const appTitle = profile.shortName || 'Bel Syuriyah';
    const fullTitle = `Bel Otomatis - ${profile.name || 'MI Syuriyah Pebatan'}`;
    document.title = fullTitle;

    const metaAppleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (metaAppleTitle) {
      metaAppleTitle.setAttribute('content', appTitle);
    }

    const metaAppName = document.querySelector('meta[name="application-name"]');
    if (metaAppName) {
      metaAppName.setAttribute('content', profile.name || 'Bel Pelajaran MI Syuriyah Pebatan');
    }

    // 5. Construct Dynamic W3C Web App Manifest
    const dynamicManifest = {
      name: profile.name || 'Bel Pelajaran MI Syuriyah Pebatan',
      short_name: appTitle,
      description: profile.tagline || 'Sistem Bel Otomatis 3 Bahasa dan Jadwal Pelajaran MI Syuriyah Pebatan',
      start_url: '/',
      id: '/',
      scope: '/',
      display: 'standalone',
      orientation: 'any',
      background_color: '#020617',
      theme_color: '#059669',
      categories: ['education', 'productivity', 'utilities'],
      icons: [
        {
          src: icons.icon192,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: icons.icon512,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: icons.iconMaskable,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ]
    };

    // 6. Update or Create <link rel="manifest">
    const manifestBlob = new Blob([JSON.stringify(dynamicManifest, null, 2)], { 
      type: 'application/manifest+json' 
    });

    if (activeManifestObjectUrl) {
      URL.revokeObjectURL(activeManifestObjectUrl);
    }
    activeManifestObjectUrl = URL.createObjectURL(manifestBlob);

    let linkManifest = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (!linkManifest) {
      linkManifest = document.createElement('link');
      linkManifest.rel = 'manifest';
      document.head.appendChild(linkManifest);
    }
    linkManifest.href = activeManifestObjectUrl;

    // Save cached version to localStorage for instant hydration on subsequent reloads
    try {
      localStorage.setItem('pwa_custom_manifest_ready', 'true');
    } catch {
      // ignore
    }
  } catch (error) {
    console.error('Failed to update dynamic PWA manifest and icons:', error);
  }
}
