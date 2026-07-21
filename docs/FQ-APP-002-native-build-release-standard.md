# FQ-APP-002 — Native Build & Release Standard

**Purpose:** the repeatable process for building, signing, and submitting a FinLit Quest release (1.0, 1.1, 2.0, ...) to the Apple App Store, so it's a checklist next time, not a rediscovery. Companion to `docs/V1_RELEASE_CHECKLIST.md` (the launch-specific blocker tracker) — this doc is the durable *process*, that one is the *current status*.

Created 2026-07-21, immediately after Capacitor was integrated (see `PROJECT_LOG.md`, "Native iOS app wrapper (Capacitor) scaffolded and branded").

---

## 1. Known hardware/OS constraint — read this first

**The primary dev machine at the time of writing (a 2015/2017 MacBook Air, model `MacBookAir7,2`) cannot build a submittable App Store binary, and never will be able to without a hardware or workflow change.**

- This model's maximum supported macOS is **Monterey (12)** — Apple does not offer Ventura/Sonoma/Sequoia/Tahoe for it. It is currently on 12.7.6, which is already its ceiling.
- macOS 12 can run at most **Xcode 14.2** (Xcode 14.3+ requires macOS 13).
- Apple has required **Xcode 26+ with the iOS 26 SDK for all new App Store submissions since April 28, 2026** ([Apple Developer: SDK minimum requirements](https://developer.apple.com/news/upcoming-requirements/?id=02032026a)).
- Xcode 14.2 is four major versions below that floor. No amount of free disk space or Xcode reinstallation fixes this — it is a hardware ceiling, not a configuration problem.

**Resolution paths** (not yet decided as of this writing — pick one before Step 5 below):

| Option | What changes | What stays the same |
|---|---|---|
| **A. Different/newer Mac** for the build step | Someone needs a Mac on macOS 15+ capable of running current Xcode, at least for archiving/signing/uploading | All code, the Capacitor project, git history — travels via `git clone`/`git pull`, nothing machine-specific |
| **B. Cloud Mac CI** (Codemagic, Bitrise, GitHub Actions macOS runners, Xcode Cloud) | Build/sign/upload happens in a hosted macOS environment, triggered from a `git push` | Same — the repo already has everything a CI runner needs (`package.json`, `capacitor.config.json`, `ios/`) |
| **C. Keep developing here, do nothing about submission** | Not viable long-term — revisit before any App Store submission attempt |

Whichever is chosen, **update this section** with the actual answer and remove the "not yet decided" framing.

---

## 2. Toolchain versions (current, as installed 2026-07-21)

| Tool | Version | Notes |
|---|---|---|
| Node.js | v24.18.0 | **Not installed via Homebrew** — Homebrew has no prebuilt binary for macOS 12 anymore and `brew install node` fails trying to compile from source (confirmed: fails on a broken Python/sphinx-doc sub-dependency, macOS 12 is Homebrew Tier 3). Installed from the [official nodejs.org binary](https://nodejs.org/dist/) directly into `~/.local/nodejs`, added to `~/.zshrc` PATH. If setting up a new machine, prefer the same approach over Homebrew unless that machine is on a current macOS. |
| npm | 11.16.0 | Bundled with the Node install above |
| @capacitor/core | 8.4.2 | Pin via `--save-exact` when upgrading; check the [Capacitor changelog](https://capacitorjs.com/docs/updating) before bumping major versions |
| @capacitor/cli | 8.4.2 | Keep in lockstep with `@capacitor/core` |
| @capacitor/ios | 8.4.2 | Keep in lockstep with `@capacitor/core` |
| Xcode | **Not installed** | Blocked — see §1. Whatever machine ends up building needs Xcode 26+ once installed |
| CocoaPods | **Not needed** | This Capacitor project uses Swift Package Manager (`ios/App/CapApp-SPM/`), confirmed during `cap add ios` ("Writing Package.swift") — no CocoaPods install required unless a future plugin specifically requires it |

## 3. Bundle identity

- **Bundle ID:** `com.finlitquest.app` — set in `capacitor.config.json` and `ios/App/App.xcodeproj/project.pbxproj`. This was a reasonable placeholder at the time it was set and is **only safely changeable before it's first registered in App Store Connect** — once an App ID is registered under this identifier, treat it as permanent.
- **App name:** "FinLit Quest" — set in `capacitor.config.json` (`appName`) and `ios/App/App/Info.plist` (`CFBundleDisplayName`).
- **Marketing version:** `1.0` (Xcode build setting `MARKETING_VERSION`, `ios/App/App.xcodeproj/project.pbxproj`).
- **Build number:** `1` (Xcode build setting `CURRENT_PROJECT_VERSION`, same file).

## 4. The `www/` build script and deployment pipeline

`index.html` is the entry point for two different deployments that must **not** be confused:

- **Web (finlitquest.com, GitHub Pages):** serves the whole repo as-is from `main`. No build step — this is intentional, matches the project's static-site architecture.
- **Native app (iOS, and eventually Android):** must **not** ship the whole repo — that would bundle `.git`, `node_modules`, `tests/`, `docs/`, `scripts/`, the multi-MB raw brand source PNGs, and internal project docs (`PROJECT_LOG.md`, `CLAUDE.md`, etc.) inside the actual App Store binary.

**`scripts/build-www.sh`** bridges this: it copies exactly the ~33 files `index.html`/`manifest.webmanifest` actually reference (traced via their `<script>`/`<link>` tags, plus confirming zero runtime `fetch()` calls exist anywhere in the codebase and zero CSS `url()` references) into `www/` (~908K). Run it whenever any file it copies changes:

```
./scripts/build-www.sh
```

Then sync that into the native project:

```
npx cap sync ios
```

`cap sync` copies `www/` into `ios/App/App/public/` and updates native config. **`ios/App/App/public/` is committed to git** (unlike most Capacitor projects, which gitignore it) — this repo has no CI/build pipeline, so committing the synced output means the Xcode project builds immediately after a fresh `git clone` with no forgotten setup step. `www/` itself is gitignored (regenerate it with the script above; it's derived, not source).

**When `build-www.sh` needs updating:** any time a new file gets added to `index.html`'s `<script>`/`<link>` tags, or a new asset gets referenced by `manifest.webmanifest`, add it to the script's copy list — it will silently *not* be included in the native app otherwise (the web deployment would still work fine, masking the gap until someone tests the native build specifically).

## 5. Signing process

**Not yet established** — blocked on §1 and on Apple Developer Program enrollment status (unconfirmed as of this writing, $99/year, tied to whichever Apple ID owns this app). Fill in once done:

- [ ] Apple Developer Program enrollment confirmed
- [ ] App ID registered for `com.finlitquest.app` in the Apple Developer portal
- [ ] Signing certificate + provisioning profile created (or automatic signing configured in Xcode, the simpler default for a single-developer project)
- [ ] Document here which approach was used and where the certificate/profile live

## 6. TestFlight process

**Not yet established.** Once a build succeeds locally:

1. In Xcode: Product → Archive
2. Window → Organizer → Distribute App → App Store Connect → Upload
3. Wait for App Store Connect processing (build appears under TestFlight tab, usually within ~15–30 min)
4. Add internal testers (no review needed) or external testers (requires a lightweight Apple review, usually faster than the full App Store review)
5. Fill in real timing/gotchas here after the first real attempt — this section is a placeholder based on Apple's general process, not yet verified against this specific project.

## 7. App Store submission process

**Not yet established**, and blocked on §1. Known requirements to fill in as they're confirmed:

- [ ] Built with Xcode 26+ / iOS 26 SDK minimum (mandatory since 2026-04-28, see §1)
- [ ] App icon: already prepared, see `docs/V1_RELEASE_CHECKLIST.md` Blocker 9/9b
- [ ] Screenshots, feature graphic, description, keywords, categories, age rating — tracked as V1.0 Blocker 10 in `docs/V1_RELEASE_CHECKLIST.md`, not started as of this writing
- [ ] Privacy Policy URL, Terms of Service, support URL — tracked as part of Phase 6 in `docs/V1_RELEASE_CHECKLIST.md`, not started
- [ ] App Privacy "nutrition label" declaration in App Store Connect — should be simple given this app has no backend/accounts (everything is local `localStorage`), but still needs to be filled out
- [ ] If any real-money purchase is ever added (e.g. buying coins), it must go through Apple's In-App Purchase system exclusively — see the concerns raised before this doc was created

## 8. Version numbering

Recommended scheme (not yet formally adopted — propose adopting it explicitly when 1.1 planning starts):

- **Marketing version** (`MARKETING_VERSION`, user-visible, e.g. "1.0", "1.1", "2.0"): semantic-ish — bump the first number for a major relaunch or breaking save-format change, the second for a normal feature/content release (e.g. a new world), leave a patch tier out unless it's actually needed (`1.0.1` etc. for hotfixes only).
- **Build number** (`CURRENT_PROJECT_VERSION`, not user-visible, must strictly increase for every single upload to App Store Connect even within the same marketing version): simplest reliable approach is to just increment by 1 for every archive uploaded, regardless of marketing version. Do not reuse or reset it.
- Keep `package.json`'s `"version"` field in sync with the marketing version for consistency, even though npm doesn't functionally require it for this project (no publish-to-registry step exists).

## 9. Release checklist (for 1.1, 2.0, and beyond)

1. Confirm all applicable items in `docs/V1_RELEASE_CHECKLIST.md` (or its successor for that release) are Verified.
2. Run the full automated suite (`./scripts/test.sh`) — must be 100% passing.
3. Run `./scripts/build-www.sh` and review the file count/size printed — investigate if it changes unexpectedly (usually means a new asset needs adding to the script, per §4).
4. `npx cap sync ios`.
5. Bump `MARKETING_VERSION` and/or `CURRENT_PROJECT_VERSION` per §8.
6. Build and run on the iOS Simulator — smoke-test both Crypto and Credit end to end.
7. Build and run on a real iPhone — confirm no simulator-only assumptions broke anything (network behavior, storage, performance).
8. Archive, distribute to TestFlight (§6), test the actual TestFlight build (not just a debug build) — this is where App Store rejection reasons most often surface.
9. Submit for App Store review (§7).
10. On approval: tag the released commit in git (e.g. `git tag v1.0` at the exact commit that was submitted), update `PROJECT_LOG.md` with the release date and App Store Connect build number.
11. Update this document with anything discovered during the release that would help the *next* one — this doc is only useful if it stays current.
