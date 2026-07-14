## المشكلة

مصادر البث الحالية (يلا سلّيت + SportSRC + `topx.poiy.online`) إمّا محجوبة بـ CSP `frame-ancestors` أو تُعيد شاشة سوداء / إعلانات، فلا يعمل أي رابط داخل نافذة المشغّل.

## الخطة

### 1. جلب مصادر بث حيّة وقابلة للتضمين

إضافة موصلين جديدين server-side (عبر `createServerFn` + Firecrawl عند الحاجة لتجاوز anti-bot) لمواقع معروفة بروابط `iframe` مفتوحة:

- `koracast.com` / `koooora.live` — بث كأس العالم بقنوات beIN مضمّنة مباشرة.
- `elahmad.com/tv` — مشغّل HLS مباشر لقنوات beIN Sports MAX 1..10 و beIN Xtra، يسمح بالتضمين.
- `livehdtv.net` — بديل HLS.
- `shoot-yalla-tv.net` — مطابقة بالمباراة.

كل موصل يُرجع `{ label, embedUrl, priority }` ويُختبر إمكانية التضمين (رأس `X-Frame-Options` / `content-security-policy`) قبل الإدراج.

### 2. طبقة تحقّق من صلاحية الرابط

`src/lib/streamProbe.functions.ts`: `HEAD`/`GET` للرابط من السيرفر، ورفض أي مصدر يعيد:

- `X-Frame-Options: DENY|SAMEORIGIN`
- `content-security-policy` يمنع `frame-ancestors *`
- `4xx/5xx`

هذا يمنع ظهور شاشة سوداء ويترك فقط الروابط القابلة للتشغيل.

### 3. تجميع المصادر وترتيبها

تحديث `src/routes/worldcup.tsx` و`src/components/stream-modal.tsx`:

- دمج مصادر: قنوات مباشرة (elahmad HLS) → koracast → yallasellit → SportSRC.
- تشغيل التحقّق (الخطوة 2) بالتوازي عبر `Promise.allSettled`، وإسقاط المصادر الفاشلة قبل عرض الأزرار.
- تقليص مهلة الفشل التلقائي من 9 ثوانٍ إلى 5، مع مؤشّر "جارٍ التحقّق من المصادر…".

### 4. مشغّل HLS داخلي (للمصادر المباشرة m3u8)

إضافة `<video>` + `hls.js` (`bun add hls.js`) في `stream-modal.tsx` لتشغيل روابط `.m3u8` مباشرة من elahmad دون iframe — يتخطّى قيود CSP كليًا لهذه المصادر.

### 5. تجاوز الإدارة

في `/admin`: تبويب "روابط البث" الحالي يبقى — عند فشل كل المصادر التلقائية، الإدمن يلصق رابط `.m3u8` أو iframe يدويًا وله الأولوية القصوى.

## الملفات المتأثرة

- جديد: `src/lib/koracast.functions.ts`, `src/lib/elahmad.functions.ts`, `src/lib/streamProbe.functions.ts`
- تعديل: `src/routes/worldcup.tsx`, `src/components/stream-modal.tsx`, `src/lib/yallasellit.functions.ts`
- تبعية: `hls.js`, (اختياري) موصل Firecrawl إذا لم يكن مربوطًا

## معايير النجاح

- الضغط على "شاهد البث" يفتح فيديو يعمل خلال ≤5 ثوانٍ لأي مباراة مباشرة.
- في حال فشل مصدر، التبديل تلقائي بلا تدخّل.
- لا شاشة سوداء دائمة: إن فشل الجميع، رسالة واضحة + زر "افتح في نافذة خارجية".
