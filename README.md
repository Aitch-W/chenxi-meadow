# AITCH · 飞过旷野

王宸曦（AITCH）的个人网站。原生 HTML / CSS / JavaScript + Three.js，用俯视低多边形场景讲故事。

- 线上：<https://chenxi-meadow.pages.dev>
- 仓库：<https://github.com/Aitch-W/chenxi-meadow>

## 页面

- **首页**：Three.js 俯视风景（草原 / 蓝金田野 / 赤土 / 碧海连续过渡），云、河流、道路、飞机跟随鼠标。
- **作品集**：The Senate（元老院消费决策议会）作品卡 + 预留空位；右侧一颗自转地球（真实贴图 + 风格化上色 + 云 / 树 / 仙人掌 / 环绕小飞机）。
- **实习经历**：可拖拽、点击翻面的 3D 工牌（ReactBits Lanyard 原生改写）；右侧文案 + 联系页脚。

## 技术栈

- 原生 ES Module，无打包依赖
- Three.js 0.170，本地内置在 `dist/vendor/`，不依赖 CDN
- Playfair Display 字体、贴图全部本地化
- Cloudflare Pages 静态托管；Pages Functions / D1 预留给「元老院」用户数据

## 本地运行

```bash
npm run dev              # 本地静态服务器 http://127.0.0.1:4173
node build-preview.mjs   # 生成单文件 preview.html
```

## 部署

```bash
wrangler pages deploy dist --project-name chenxi-meadow --branch main
```

## 目录

- `dist/` 站点文件（index.html / style.css / app.js / scene.js / globe.js / lanyard3d.js / lanyard-setup.js / vendor / assets / fonts）
- `build-preview.mjs` 单文件预览构建
- `server.mjs` 本地静态服务器
- `tests/`、`docs/` 性能与验证记录
- `ITERATIONS.md` 迭代记录

## 说明

- 站点不依赖任何外部 CDN，断网 / 无代理也能本地打开。
- 内容与联系方式为个人配置，转载或复用前请先联系。
