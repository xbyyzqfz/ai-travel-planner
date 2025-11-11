# 使用Node.js作为基础镜像
FROM node:16-alpine

# 维护者信息
LABEL maintainer="AI Travel Planner Team <contact@aitravel.com>"

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json（如果存在）
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制所有应用文件
COPY . .

# 创建配置文件（默认配置）
RUN echo 'const CONFIG = {\n  SUPABASE_URL: "your-supabase-url",\n  SUPABASE_KEY: "your-supabase-key",\n  MAP_API_KEY: "your-map-api-key",\n  LLM_API_KEY: "your-llm-api-key"\n};' > config.js

# 暴露应用端口
EXPOSE 3000

# 启动命令 - 假设使用静态文件服务器或自定义服务器
CMD ["npx", "http-server", ".", "-p", "3000", "-c-1"]