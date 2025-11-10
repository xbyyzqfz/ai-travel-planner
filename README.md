# AI旅行规划师 - 智能旅行助手

一个基于Web的智能旅行规划系统，集成了语音输入、AI行程规划、费用预算管理、用户认证和地图可视化功能。

## 功能特点

### 1. 语音和文字输入旅行需求
- 支持语音识别输入旅行计划
- 提供表单填写关键旅行信息：目的地、天数、旅行风格、预算等

### 2. 智能行程规划
- 根据用户输入自动生成每日行程安排
- 包含详细的时间安排、景点介绍和费用估算
- 支持保存和打印行程计划

### 3. 费用预算管理
- 可视化预算分布图表
- 详细的预算明细管理
- 实时计算剩余预算和预算使用进度

### 4. 用户注册登录
- 支持用户注册和登录功能
- 保存个人行程计划和偏好设置
- 使用Supabase进行身份认证和数据存储

### 5. 地图集成
- 集成Mapbox地图API，支持地点搜索
- 可在地图上添加标记和规划路线
- 直观展示行程地点分布

## 技术栈

### 前端技术
- **HTML5**：页面结构和语义化标签
- **CSS3/Tailwind CSS**：响应式设计和UI样式
- **JavaScript (ES6+)**：交互逻辑和功能实现
- **Font Awesome**：图标库
- **Chart.js**：数据可视化图表
- **Mapbox GL JS**：地图服务集成

### 后端服务
- **Supabase**：用户认证、数据存储和API服务

### 部署方案
- **Docker**：容器化部署
- **Nginx**：静态资源服务

## 项目结构

```
ai-travel-planner/
├── index.html     # 主页面HTML
├── app.js         # 主JavaScript文件
├── Dockerfile     # Docker构建文件
├── .gitignore     # Git忽略文件配置
└── README.md      # 项目说明文档
```

## 快速开始

### 方法一：直接运行

1. 克隆或下载项目到本地
2. 直接在浏览器中打开 `index.html` 文件
3. 开始使用AI旅行规划功能

### 方法二：使用Docker运行

1. 确保已安装Docker环境
2. 在项目根目录执行以下命令构建Docker镜像：
   ```bash
   docker build -t ai-travel-planner .
   ```
3. 运行Docker容器：
   ```bash
   docker run -d -p 8080:80 --name ai-travel-planner ai-travel-planner
   ```
4. 在浏览器中访问 `http://localhost:8080`

## 配置说明

### Supabase配置

在 `app.js` 文件中，需要配置您的Supabase项目信息：

```javascript
const SUPABASE_URL = 'https://your-supabase-url.supabase.co';
const SUPABASE_ANON_KEY = 'your-supabase-anon-key';
```

### Mapbox配置

在 `app.js` 文件中，需要配置您的Mapbox访问令牌：

```javascript
mapboxgl.accessToken = 'your-mapbox-access-token';
```

## 使用说明

### 1. 行程规划

1. 在首页或行程规划页面，输入您的旅行需求
2. 可以选择语音输入或手动填写表单
3. 点击「生成行程计划」按钮
4. 系统将为您生成详细的行程安排
5. 可以保存或打印生成的行程

### 2. 预算管理

1. 在预算管理页面，设置总预算金额
2. 添加各项预算支出，如住宿、餐饮、交通等
3. 系统会自动计算预算使用情况和生成饼图
4. 可以删除不需要的预算项

### 3. 地图功能

1. 在地图页面，可以搜索特定地点
2. 点击「添加标记」按钮，在地图上点击添加地点标记
3. 输入起点和终点，规划旅行路线
4. 可以清除所有添加的标记

### 4. 用户管理

1. 点击右上角的「登录」按钮
2. 可以使用已有账号登录，或点击「立即注册」创建新账号
3. 登录后可以保存您的行程计划和预算

## 注意事项

1. 语音识别功能需要浏览器支持Web Speech API
2. 地图功能需要有效的Mapbox访问令牌
3. 用户数据存储需要配置Supabase服务
4. 在离线环境下，部分功能可能受限

## 开发说明

### 本地开发

1. 克隆项目到本地
2. 使用任何现代浏览器打开 `index.html`
3. 修改代码后刷新浏览器查看效果

### 构建和部署

1. 使用Docker构建镜像：
   ```bash
   docker build -t ai-travel-planner .
   ```

2. 运行容器：
   ```bash
   docker run -d -p 8080:80 ai-travel-planner
   ```

3. 访问 `http://localhost:8080`

## License

MIT License

## 联系方式

如有问题或建议，请联系：
- 邮箱：contact@aitravel.com
- 网站：https://aitravel.com
