# 常用工作流

## 第一次运行

1. 安装 Node.js 24+、Chrome 或 Edge 及项目依赖。
2. 将 .env.example 复制为 .env，并设置本地 API key。
3. 执行 npm run auth -- login，在项目专用窗口完成登录。
4. 执行 npm run build 和 npm start。
5. 检查 /health 与 /v1/models。

## 恢复会话

1. 执行 npm run auth -- status。
2. 执行 npm run auth -- refresh。
3. 如果 Google 要求交互验证，执行 npm run auth -- login。
4. 执行 npm run doctor 并检查 /health。

## 修改代码

运行 npm run build、npm test 和 npm run docs:build。协议细节应保留在 Provider 层，并同步更新对应文档。
