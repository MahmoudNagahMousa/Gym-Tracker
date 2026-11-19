# 🏋️ متابع الجيم — Gym Tracker

تطبيق ويب (PWA) لمتابعة خطة التمرين والاشتراك والوزن — **بدون سيرفر**، كل بياناتك محفوظة على جهازك في
`localStorage`. مصمّم للموبايل أولاً، بالعربي وبتخطيط RTL، وثيم داكن.

**Live demo:** https://mahmoudnagahmousa.github.io/Gym-Tracker/

---

## ✨ المزايا

| الصفحة | اللي بتعمله |
| --- | --- |
| **الرئيسية** | أول صفحة بتفتح: **بانر التجديد**، تحية بالاسم، كارت «تمرين النهارده» (يوم التمرين/الراحة/خلصت تمرين النهارده ✅ + زر «ابدأ»)، كارت **الاشتراك** (البداية/الانتهاء/الأيام المتبقية + زر «تم التجديد»)، كارت **BMI** (من الوزن والطول المحفوظين)، كارت **آخر وزن** (الوزن + التاريخ + الفرق عن التسجيل السابق)، إحصائيات سريعة (السلسلة الحالية / آخر 30 يوم / جلسات الشهر)، **سجل الالتزام (heatmap)** و**رسم تطور الوزن** |
| **بياناتي** | المدخلات والتحقق منها بس: الاسم/العمر/الوزن/الطول، بداية الاشتراك ومدته، حفظ الوزن في الهيستوري، تفعيل تنبيهات التجديد، ولينك «شوف الاشتراك والتقدم في الرئيسية» |
| **تمرين النهارده** | خطة أسبوعية (السبت → الجمعة) بتحمّل من ملف JSON (Push A / Pull A / راحة / Push B / Pull B / Leg + بطن وكور / راحة)، بيفتح على يوم النهارده تلقائياً، تبديل بين الأيام، عناوين مجموعات (رجل / بطن وكور)، مدى تكرارات `4 × 8–10` وتمارين بالوقت `3 × 45 ث` وشارة «لكل جنب»، تسجيل وزن/عدّ لكل مجموعة + علامة «تم»، تلميح **آخر وزن من الجلسة السابقة (بالـ id)**، إنهاء التمرين وحفظه في السجل |
| **المؤقت** | مؤقت تمرين ومؤقت راحة، أوقات سريعة (30/45/60/90/120 ث) + مدة مخصصة `mm:ss`، عدّاد دائري كبير، اهتزاز + صفارة + فلاش عند النهاية، **Screen Wake Lock** |
| **محرر الخطة** | إضافة/تعديل/حذف/ترتيب التمارين لكل يوم، تحديد نوع التمرين (تكرارات أو بالوقت) وعدد المجموعات والراحة |

- 🔔 **بانر تجديد في الرئيسية**: أصفر لو باقي 5 أيام أو أقل، أحمر لو الاشتراك انتهى، مع زر **«تم التجديد»** — والتنبيه المحلي (best-effort) لسه بيظهر مرة عند فتح التطبيق.
- 🧭 **4 تابات** في الشريط السفلي: الرئيسية / تمرين النهارده / المؤقت / بياناتي (محرر الخطة بيفضل مضوّي على «تمرين النهارده»).
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
│  ├─ pages/                       # Home, Profile, Workout, Timer, PlanEditor
│  ├─ storage/                     # wrapper آمن + planStorage (load/migrate/save/restore) + مفاتيح متversionة
│  ├─ styles/                      # global.css + ui.module.css
│  ├─ test/                        # setup.js + utils.jsx
│  └─ utils/                       # date, bmi, time, subscription, workout, consistency, validation, planSchema, feedback
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
| `src/utils/consistency.test.js` | حالات اليوم (تمرنت/راحة/غير ملتزم/النهارده/مستقبل)، ترتيب الأسبوع من السبت، جلسة 23:30 بالتوقيت المحلي، جلسات متعددة في نفس اليوم، بيانات تالفة، السلسلة الحالية وأطول سلسلة، عدد أيام آخر 30 يوم وجلسات الشهر |
| `src/components/ConsistencyTracker.test.jsx` | 7 صفوف × 12 أسبوع، aria-label عربي للمربع المتمرّن، كابشن عند الضغط، الوسيلة الإيضاحية، الحالة الفاضية، التنقل بالكيبورد |
| `src/components/BottomNav.test.jsx` | 4 تابات بالترتيب + التاب النشط لكل مسار + محرر الخطة مضوّي على «تمرين النهارده» + الرئيسية مش نشطة برّا "/" |
| `src/pages/HomePage.test.jsx` | التحية بالاسم/بدونه، كارت التمرين في 3 حالات + زر «ابدأ» بينقل لـ /workout، كارت الاشتراك في 4 حالات (سليم/≤ 5 أيام/منتهي/بدون تاريخ) + «تم التجديد» بيبدأ من النهارده، بانر التجديد بيظهر على الرئيسية بس، كارت BMI بالقيمة والتصنيف والحالة الفاضية، كارت آخر وزن (0/1/2+ مع إشارة الفرق)، الإحصائيات، الـ heatmap، رسم الوزن |
| `src/pages/ProfilePage.test.jsx` | رسائل التحقق العربية + الحفظ في الهيستوري، مفيش اشتراك/BMI/آخر وزن/heatmap/رسم في الصفحة، لينك «شوف الاشتراك والتقدم في الرئيسية» |
| `src/pages/WorkoutPage.test.jsx` | تمارين كل يوم، صياغة المدى `4 × 8–10`، البلانك `3 × 45 ث` + زرار المؤقت، شارة «لكل جنب»، عناوين مجموعات الخميس، يوم الراحة، تسجيل/إنهاء مجموعة، تلميح آخر وزن بالـ id، جلسة قديمة بتمرين محذوف |
| `src/pages/TimerPage.test.jsx` | الأوقات السريعة، المدة من الـ URL، العد/الإيقاف/الاستكمال/النهاية + اهتزاز، تحقق mm:ss |
| `src/pages/PlanEditorPage.test.jsx` | إضافة (مدى + مجموعة + ملاحظة + لكل جنب)، التحقق من min <= max، تعديل/ترتيب/حذف + استعادة الافتراضي من JSON |
| `src/App.test.jsx` | البداية على الرئيسية، التنقل بين الـ 4 تابات، مسار غير معروف بيرجع للرئيسية، التاب النشط، بانر التجديد على الرئيسية بس (مش على /profile و /workout و /timer و /plan) |

العدد الحالي: **17 ملف اختبار / 189 اختبار — كلهم ناجحين** ✅

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

Pages (`/` Home → `/workout` → `/timer` → `/profile`, plus `/plan`): a **Home dashboard** that opens first
with the renewal banner, a greeting, today's workout card (train / rest / already-done states + start
button), a **subscription card** (start / end / days remaining with green-yellow-red states and one-tap
renewal), **BMI** and **latest weight** cards side by side (value, date and the difference from the previous
entry), quick stats (current streak, trained days in the last 30 days, sessions this month), a GitHub-style
**consistency heatmap**, and the weight chart (custom SVG). **Profile** keeps the input forms only (name,
age, weight, height, subscription start + duration), the notification permission section and a link back to
Home. Shared: the weekly Saturday→Friday plan with a default Push/Pull/Legs split, per-set logging with
last-session weight hints, workout history, a plan editor, and a timestamp-based countdown timer (exercise +
rest) with vibration, Web Audio beep, visual flash and Screen Wake Lock. The renewal banner lives on Home
only (yellow ≤ 5 days, red when expired) while the best-effort local notification still fires once on app
open. Unknown hash routes redirect to Home.

Stack: React 18, Vite 5, react-router-dom (HashRouter), CSS Modules, Vitest + React Testing Library + jsdom,
vite-plugin-pwa. Deployed to GitHub Pages via GitHub Actions (tests run before the build).

```powershell
npm install
npm run dev      # local dev
npm test         # run the test suite
npm run build    # production build in dist/
```

Live demo: https://mahmoudnagahmousa.github.io/Gym-Tracker/
