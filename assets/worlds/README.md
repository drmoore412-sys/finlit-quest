# FinLit Quest world-background assets

These images are local gameplay assets. The runtime loads only the selected world's image and uses responsive `cover` cropping.

## Installed artwork

| World | File | Final scene prompt |
|---|---|---|
| Money Basics | `money-basics.jpg` | Magical golden financial kingdom at blue hour with a welcoming treasury hall, mountain valley, waterways, warm lanterns, and calm central gameplay space. |
| Credit Foundations | `credit-foundations.jpg` | Majestic sapphire crystal fortress above a secure valley with protective gates, bridges, waterfalls, and calm central gameplay space. |
| Crypto Foundations | `crypto-foundations.jpg` | Futuristic cryptocurrency city with transparent data bridges, geometric network nodes, secure digital vault towers, and teal-violet light paths. |
| Banking Basics | `banking-basics.jpg` | Grand enchanted bank with columns, welcoming illuminated entrance, side vault pavilion, canal reflections, and landscaped grounds. |
| Investing Basics | `investing-basics.jpg` | Magical investment garden with ascending terraces, healthy trees, glowing seedlings, glass greenhouse, and a prosperous distant skyline. |
| AI & Technology | `ai-technology.jpg` | Futuristic AI city with glass research towers, responsible automation, clean transit, neural-network forms, and an observatory. |
| Real Estate | `real-estate.jpg` | Enchanted hillside village with townhomes, cottages, a distant estate, landscaped streets, a community park, and a river. |
| Taxes | `taxes.jpg` | Royal treasury and library with illuminated shelves, orderly document alcoves, archive doors, marble halls, and a reflecting pool. |
| Business & Entrepreneurship | `business-entrepreneurship.jpg` | Magical business marketplace with elegant shops, workshops, delivery carts, an innovation pavilion, and glowing trade routes. |
| Retirement & Wealth Planning | `retirement-wealth-planning.jpg` | Peaceful tropical fantasy paradise with a seaside pavilion, turquoise lagoon, flowering terraces, palms, a sailboat, and a secure path to the horizon. |

All ten were generated with the built-in image-generation tool as original, wide 16:9, premium cinematic stylized-3D mobile-game environments. Shared constraints: environment only; crop-safe for portrait mobile; darker central gameplay space; no people, readable text, logos, UI, currency marks, watermarks, flashing effects, or copied commercial game art. The generated PNG sources remain in the Codex generated-image library; these JPEG derivatives are the optimized runtime assets.

## Owner-approved artwork still required

The owner approved these three images before this milestone, but the exact files were not present in the repository. They have **not** been silently replaced. The runtime uses a clearly temporary thematic gradient until the exact approved file is supplied at the listed path.

| World | Required exact file |
|---|---|
| Coins & Currency | `coins-currency-approved.jpg` |
| Insurance & Protection | `insurance-protection-approved.jpg` |
| Social Media & Digital Income | `social-media-approved.jpg` |

After adding an approved file, update its `imageUrl` and remove its pending status in `content/world-backgrounds.js`, rebuild `www/`, synchronize Capacitor, and rerun the full suite.
