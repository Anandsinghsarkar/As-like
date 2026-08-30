# As Like

As Like ek mobile-first realtime private chat app hai. Project React, Vite, Tailwind CSS aur Firebase Authentication/Firestore par bana hai.

## Features

- Email, username ya user ID se login
- Realtime private messages aur image sharing
- Online/offline, last seen, typing aur message ticks
- Edit, unsend, delete-for-me aur clear-chat
- User profiles aur friend requests
- Android WebView/HopWeb-friendly responsive layout

## Local development

```bash
npm ci
npm run dev
```

Production check:

```bash
npm run lint
npm run build
```

## HopWeb se Android app

Repo me `As-Like-HopWeb.zip` ready package diya gaya hai.

**Direct download:** [As-Like-HopWeb.zip](https://github.com/Anandsinghsarkar/As-like/raw/refs/heads/main/As-Like-HopWeb.zip)

1. GitHub repo se `As-Like-HopWeb.zip` download karein.
2. HopWeb me **Import Project** kholen aur ZIP select karein. Agar HopWeb ZIP ko direct import na kare, pehle ZIP extract karke `index.html` wali folder import karein.
3. Project ko preview karke internet access allow rakhein—chat Firebase par chalti hai.
4. **Publish/Build Android App** me app name `As Like` aur package name, jaise `com.anandsingh.aslike`, set karein.
5. `app-icon.svg` ko icon ke roop me select karein (zarurat ho to phone par PNG me convert karein), version set karein aur APK build karein.

Package dubara generate karne ke liye:

```bash
npm run build:hopweb
```

Isse `hopweb-app/` refresh hoga. Us folder ke contents ko ZIP karke HopWeb me import kiya ja sakta hai.

## GitHub Pages

`.github/workflows/deploy-pages.yml` main branch ke har push par production build banata hai. Repo Settings → Pages → Source me **GitHub Actions** select karne ke baad site is URL par milni chahiye:

`https://anandsinghsarkar.github.io/As-like/`

HopWeb me local package ke badle is hosted URL ka WebView app bhi banaya ja sakta hai.

## Firebase note

Firebase web API key client-side rehna normal hai, lekin Firestore security rules ko production se pehle zaroor lock karein. GitHub Pages/hosted login use karte samay Firebase Console → Authentication → Settings → Authorized domains me hosting domain add karein.
