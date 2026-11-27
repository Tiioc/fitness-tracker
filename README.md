# Fitness Tracker

A phone-first workout and nutrition tracker I built for my own training, with an AI coach on top.

Built with Next.js 14, TypeScript and Tailwind CSS. It installs on a phone like an app (PWA) and keeps your data on the device.

## What it does
- **Workouts:** exercise library, sets / reps / RPE logging, one-rep-max and plate math, rest timer, last-session numbers shown as you lift.
- **Muscle map:** a body diagram that shades each muscle by weekly training volume.
- **Food:** built-in food database with serving sizes, barcode scanner, and photo scan (snap a meal, the AI estimates and logs it).
- **Targets:** calorie and protein goals worked out from your profile (TDEE), split per meal.
- **Progress:** bodyweight trend, body measurements and progress photos.
- **AI coach:** chat that answers training questions using your logged data (Claude API).
- **Oura ring:** optional sleep and activity sync.

## Run it
```bash
npm install
cp .env.local.example .env.local   # add your own Anthropic API key
npm run dev                        # http://localhost:3000
```

## Layout
| Folder | What's in it |
|---|---|
| `app/` | Pages (workout, food, progress, coach, profile) and API routes (barcode, food search, photo scan, coach, Oura) |
| `components/` | Barcode scanner, muscle map, navigation |
| `lib/` | Exercise library, food data, nutrition math, training program, local storage |

## Status
Personal project, built June 2026. Not a medical or nutrition product.
