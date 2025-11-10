# 使用Nginx作为基础镜像
FROM nginx:alpine

# 维护者信息
LABEL maintainer="AI Travel Planner Team <contact@aitravel.com>"

# 复制自定义Nginx配置文件（如果需要）
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# 创建应用目录
WORKDIR /usr/share/nginx/html

# 复制所有应用文件到Nginx目录
COPY . .

# 暴露80端口
EXPOSE 80

# 启动Nginx服务
CMD ["nginx", "-g", "daemon off;"]