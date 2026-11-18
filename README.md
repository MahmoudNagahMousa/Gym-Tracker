# 🏋️ متابع الجيم — Gym Tracker

تطبيق ويب (PWA) لمتابعة خطة التمرين والاشتراك والوزن — **بدون سيرفر**، كل بياناتك محفوظة على جهازك في
`localStorage`. مصمّم للموبايل أولاً، بالعربي وبتخطيط RTL، وثيم داكن.

**Live demo:** https://mahmoudnagahmousa.github.io/Gym-Tracker/

---

## ✨ المزايا

| الصفحة | اللي بتعمله |
| --- | --- |
| **بياناتي** | الاسم/العمر/الوزن/الطول، بداية الاشتراك ومدته، حساب تلقائي لتاريخ الانتهاء والأيام المتبقية و **BMI** مع التصنيف، هيستوري الوزن مع رسم خطي، تفعيل تنبيهات التجديد |
| **تمرين النهارده** | خطة أسبوعية (السبت → الجمعة) بتحمّل من ملف JSON (Push A / Pull A / راحة / Push B / Pull B / Leg + بطن وكور / راحة)، بيفتح على يوم النهارده تلقائياً، تبديل بين الأيام، عناوين مجموعات (رجل / بطن وكور)، مدى تكرارات `4 × 8–10` وتمارين بالوقت `3 × 45 ث` وشارة «لكل جنب»، تسجيل وزن/عدّ لكل مجموعة + علامة «تم»، تلميح **آخر وزن من الجلسة السابقة (بالـ id)**، إنهاء التمرين وحفظه في السجل |
| **المؤقت** | مؤقت تمرين ومؤقت راحة، أوقات سريعة (30/45/60/90/120 ث) + مدة مخصصة `mm:ss`، عدّاد دائري كبير، اهتزاز + صفارة + فلاش عند النهاية، **Screen Wake Lock** |
| **محرر الخطة** | إضافة/تعديل/حذف/ترتيب التمارين لكل يوم، تحديد نوع التمرين (تكرارات أو بالوقت) وعدد المجموعات والراحة |

- 🔔 **بانر تجديد** في كل الصفحات: أصفر لو باقي 5 أيام أو أقل، أحمر لو الاشتراك انتهى، مع زر **«تم التجديد»**.
- 📱 **موبايل أولاً**: أصغر عرض 360px، أهداف لمس ≥ 44px، شريط تنقل سفلي، بدون سكرول أفقي.
- 🧮 **المؤقت محسوب من `Date.now()`** مش من عدّاد `setInterval` — عشان المتصفحات على الموبايل بتبطّئ الـ timers في الخلفية.
- 📴 **يعمل أوفلاين** (Service Worker عن طريق `vite-plugin-pwa`) وقابل للتثبيت على شاشة الهوم سكرين.
- ♿ **إتاحة**: `label` لكل حقل، `aria-*`، حالات focus واضحة، `role="alert"` للأخطاء.

## 🧱 التقنيات

- **React 18** + **Vite 5** (JavaScript، بدون TypeScript)
- **خطة التمرين في JSON** (`src/data/defaultPlan.json`) بتتـimport وتتحقق بـ `validatePlan` — مفيش `fetch` خالص، فبتشتغل أوفلاين
- **react-router-dom** مع **HashRouter** (عشان الـ refresh على GitHub Pages مايرجعش 404)
- **CSS Modules** + ملف Global للثيم والمتغيرات
- **Vitest** + **React Testing Library** + **jsdom**
- **vite-plugin-pwa** (Workbox) — تثبيت + أوفلاين
- **GitHub Actions** — اختبارات ثم Build ثم نشر على GitHub Pages

> ملاحظة: الرسم البياني للوزن معمول بـ **SVG خفيف** بنفسنا بدل مكتبة charts (أسرع، وأسهل في الاختبار، وبدون تبعيات زيادة).

## 📁 هيكل المشروع

```
Gym-Tracker/
├─ .github/workflows/deploy.yml    # CI/CD: test → build → deploy
├─ public/
│  ├─ favicon.svg
│  └─ icons/                       # أيقونات PWA (192 / 512 / maskable / apple-touch)
├─ scripts/generate-icons.mjs      # مولد أيقونات PNG (بدون مكتبات)
├─ src/
│  ├─ components/                  # Layout, BottomNav, RenewalBanner, ExerciseCard, WeightChart...
│  ├─ context/AppContext.jsx       # الحالة العامة + الحفظ في localStorage
│  ├─ data/defaultPlan.json        # الخطة الافتراضية (JSON) — المصدر الوحيد للديفولت
│  ├─ data/defaultPlan.js          # loader: import للـ JSON + تحقق + createDefaultPlan/createExercise
│  ├─ hooks/                       # useCountdown, useWakeLock, useRenewalReminder
│  ├─ pages/                       # Profile, Workout, Timer, PlanEditor
│  ├─ storage/                     # wrapper آمن + planStorage (load/migrate/save/restore) + مفاتيح متversionة
│  ├─ styles/                      # global.css + ui.module.css
│  ├─ test/                        # setup.js + utils.jsx
│  └─ utils/                       # date, bmi, time, subscription, workout, validation, planSchema, feedback
├─ index.html
├─ vite.config.js                  # base + PWA + vitest
└─ package.json
```

## 🚀 التشغيل محلياً (Windows / PowerShell)

```powershell
git clone https://github.com/MahmoudNagahMousa/Gym-Tracker.git
cd Gym-Tracker
npm install
npm run dev
```

ثم افتح الرابط اللي بيطبعه Vite (عادة `http://localhost:5173/Gym-Tracker/`).

أوامر تانية:

```powershell
npm run build          # نسخة الإنتاج في dist/
npm run preview        # تجربة نسخة الإنتاج محلياً
npm test               # تشغيل الاختبارات مرة واحدة
npm run test:watch     # وضع المراقبة
npm run test:coverage  # تغطية الاختبارات (HTML في coverage/)
npm run icons          # إعادة توليد أيقونات PWA
```

## ✅ الاختبارات

| الملف | بيغطي |
| --- | --- |
| `src/utils/date.test.js` | تاريخ الانتهاء + الأيام المتبقية، **overflow الشهور** (31 يناير + شهر = 28/29 فبراير)، تحويل أيام الأسبوع للخطة |
| `src/utils/bmi.test.js` | حساب BMI والتصنيف + القيم غير الصالحة |
| `src/utils/planSchema.test.js` | `validatePlan` (نسخة، 7 أيام، repsMin > repsMax، timed بدون durationSec، ids مكررة/غير slug) + `migrateLegacyPlan` |
| `src/data/defaultPlan.test.js` | الـ JSON المضمّن سليم + ترتيب الأيام الحقيقي + مجموعات الخميس + البلانك/Pallof Press + صياغة المدى |
| `src/storage/storage.test.js` | **JSON تالف**، fallback، مفاتيح متversionة، `clearAppStorage` |
| `src/storage/planStorage.test.js` | migration من الشكل القديم بدون لمس البروفايل/الجلسات/الوزن + استبدال الخطة التالفة + `restoreDefaultPlan` |
| `src/hooks/useCountdown.test.jsx` | start / pause / resume / finish / reset بـ fake timers |
| `src/components/RenewalBanner.test.jsx` | أصفر عند ≤ 5 أيام، أحمر عند الانتهاء، زر «تم التجديد» |
| `src/pages/ProfilePage.test.jsx` | رسائل التحقق العربية + الحفظ + BMI + الهيستوري |
| `src/pages/WorkoutPage.test.jsx` | تمارين كل يوم، صياغة المدى `4 × 8–10`، البلانك `3 × 45 ث` + زرار المؤقت، شارة «لكل جنب»، عناوين مجموعات الخميس، يوم الراحة، تسجيل/إنهاء مجموعة، تلميح آخر وزن بالـ id، جلسة قديمة بتمرين محذوف |
| `src/pages/TimerPage.test.jsx` | الأوقات السريعة، المدة من الـ URL، العد/الإيقاف/الاستكمال/النهاية + اهتزاز، تحقق mm:ss |
| `src/pages/PlanEditorPage.test.jsx` | إضافة (مدى + مجموعة + ملاحظة + لكل جنب)، التحقق من min <= max، تعديل/ترتيب/حذف + استعادة الافتراضي من JSON |
| `src/App.test.jsx` | التنقل بين الصفحات الثلاث + البانر في كل الصفحات |

العدد الحالي: **13 ملف اختبار / 112 اختبار — كلهم ناجحين** ✅

## 🗂️ شكل الخطة (Plan model)

```jsonc
{ "version": 1,
  "days": [
    { "weekday": "saturday", "index": 0, "name": "Push A", "focus": "صدر علوي + كتف", "isRest": false,
      "exercises": [
        { "id": "incline-dumbbell-press", "name": "Incline Dumbbell Press", "type": "reps",
          "sets": 4, "repsMin": 8, "repsMax": 10, "restSec": 120, "perSide": false,
          "group": "اختياري", "note": "اختياري" }
      ] } ] }
```

- `type: "timed"` بيستخدم `durationSec` بدل `repsMin/repsMax`.
- الـ `id` لازم يكون **slug** وفريد على مستوى الخطة — الهينت («آخر مرة») بيتطابق بالـ `id` الأول ثم بالاسم.
- الخطة بتتحقق بـ `validatePlan` قبل أي حفظ؛ خطة غير صالحة **مش بتتحفظ** وبتظهر رسالة عربية في محرر الخطة.
- **Migration**: مفتاح الخطة اتغيّر لـ `gym-tracker:v1:plan:v2`. لو فيه خطة بالشكل القديم في `gym-tracker:v1:plan` بتتحول تلقائياً (reps → min=max) وبتتشال؛ ولو التحويل فشل بترجع الخطة الافتراضية. البروفايل والجلسات وسجل الوزن **عمرهم ما بيتلمسوا**.

## 🌐 النشر على GitHub Pages

1. Repository → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. أي push على `main` هيشغّل `.github/workflows/deploy.yml` (اختبارات → build → نشر).
3. الرابط: https://mahmoudnagahmousa.github.io/Gym-Tracker/

> مهم: `base` في `vite.config.js` لازم يكون `/Gym-Tracker/`، و`start_url` و`scope` في الـ manifest
> لازم يطابقوا نفس المسار.

## 🔒 الخصوصية

مفيش backend ومفيش تحليلات ومفيش أي طلب شبكة لبياناتك. كل حاجة (البروفايل، الخطة، الجلسات، الوزن)
بتتحفظ محلياً على جهازك بس — ومسح بيانات المتصفح بيمسحها.

---

## English summary

**Gym Tracker** is a mobile-first, offline-capable **PWA** (React 18 + Vite) for tracking gym workouts,
membership renewals and body weight. It is Arabic-first (RTL, Cairo font, dark theme) and has **no backend** —
everything lives in `localStorage` behind a safe, versioned storage wrapper.

Features: profile with subscription end date / days remaining / BMI, weight history chart (custom SVG),
renewal banner on every page (yellow ≤ 5 days, red when expired) with one-tap renewal, a Saturday→Friday
weekly plan with a default Push/Pull/Legs split, per-set logging with last-session weight hints, workout
history, a plan editor, and a timestamp-based countdown timer (exercise + rest) with vibration, Web Audio
beep, visual flash and Screen Wake Lock.

Stack: React 18, Vite 5, react-router-dom (HashRouter), CSS Modules, Vitest + React Testing Library + jsdom,
vite-plugin-pwa. Deployed to GitHub Pages via GitHub Actions (tests run before the build).

```powershell
npm install
npm run dev      # local dev
npm test         # run the test suite
npm run build    # production build in dist/
```

Live demo: https://mahmoudnagahmousa.github.io/Gym-Tracker/
