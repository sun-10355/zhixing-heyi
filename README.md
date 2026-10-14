# 知行合一（PWA）

把知道变成做到：正常日打卡，喝多日止损。需求文档见 `../plans/止损app-需求说明.md`。

## 运行

```bash
npm install
npm run dev            # 本机 http://localhost:5173
npm run dev -- --host  # 局域网联调：手机同 Wi-Fi 访问 http://<电脑IP>:5173
npm run build          # 产物 dist/，部署到 HTTPS 静态托管后可"添加到主屏幕"
```

## 技术要点

- React 18 + Vite 5 + Tailwind 3 + TypeScript，无后端，数据存 localStorage（key: `zhixing_data_v1`）。
- 武装/风险日逻辑：`src/logic.ts`；数据层：`src/db.ts`。
- 已知边界：浏览器关闭时无法定时弹 8 点通知（无推送后端）；拦截发生在"用户打开 app 时"。
