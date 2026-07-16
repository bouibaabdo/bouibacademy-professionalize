
# خطة تحسينات الأداء الإضافية

هدف: نقص LCP، JS payload، و CLS الباقي من AdSense، بدون ما نمسو الوظائف الحالية.

## 1. تأجيل AdSense حتى بعد التفاعل (يقلل JS blocking و CLS)
- فـ `src/routes/__root.tsx`: نحيدو AdSense من `scripts` (async مباشرة).
- نديرو inline script صغير كيحمّل `adsbygoogle.js` بعد أول `scroll` / `click` / `touchstart` أو بعد 3s (idle) — أيها يجي أولاً.
- الفائدة: 166 KiB ديال JS ما كيتحمّلوش فـ initial render → LCP/TBT ينخفضو، و layout shifts ديال Auto Ads كتأخّر بلاش ما تأثر على أول رسم.

## 2. Preload ديال LCP image فـ الصفحة الرئيسية
- فـ `src/routes/index.tsx` (أو مكوّن hero): نزيدو `head().links` بـ `rel="preload" as="image" fetchPriority="high"` لأول thumbnail (featured post) عبر `optimizeBloggerImage`.
- نتأكدو `<img>` ديالها كتستعمل `fetchPriority="high"` و `loading="eager"` (موجود partially فـ `PostCard` عبر `priority`).

## 3. Self-host Google Fonts (Cairo/Tajawal) عبر `@fontsource`
- نبدلو `<link>` لـ Google Fonts بـ `@fontsource/tajawal` + `@fontsource/cairo` (weights: Tajawal 400/500، Cairo 700 فقط).
- كنربحو: preconnect خارجي + round-trip لـ fonts.googleapis.com، والخطوط كتجي من نفس الـ CDN ديال Lovable مع cache headers أفضل.
- نديرو `font-display: optional` فـ CSS ديالهم (نفس السلوك الحالي، بلا CLS).

## 4. تقليل CSS payload
- مراجعة `src/styles.css` و مسح utilities غير مستعملة (tw-animate-css إلا مكاينش استعمال فعلي).
- نتحققو من `@import "tw-animate-css"` واش كيتخدم؛ إلا لا، نحيدوه.

## 5. تحسين `today-matches-rail` — تأجيل fetch
- المكوّن كيدير fetch فوراً على الرئيسية. نأجّلوه بـ `enabled` بعد `requestIdleCallback` أو بعد `IntersectionObserver` (يفعّل الـ query كي يقرب المستخدم من الـ section).
- كيخفف من عدد الطلبات فأول رسم و كيحسن TTI.

## التفاصيل التقنية (ملفات مُعدَّلة)
- `src/routes/__root.tsx`: تأجيل AdSense + إزالة روابط Google Fonts.
- `src/critical.css` + `src/styles.css`: `@import` لـ fontsource + تنظيف.
- `src/routes/index.tsx`: preload LCP thumbnail من loader data.
- `src/components/today-matches-rail.tsx`: `enabled` gate بـ `useHydrated` + `IntersectionObserver`.
- `package.json`: `bun add @fontsource/tajawal @fontsource/cairo` و مراجعة `tw-animate-css`.

## خارج النطاق (ماشي هاد الجلسة)
- نقل صور Blogger لـ Supabase Storage.
- إزالة AdSense كلياً.
- Server-side rendering ديال images.
