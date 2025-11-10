// 全局变量
let currentUser = null;
let markers = [];
let map = null;
let budgetItems = [];
let budgetChart = null;

// Supabase 配置 - 这里使用模拟的配置，实际项目中需要替换为真实的
const SUPABASE_URL = 'https://your-supabase-url.supabase.co';
const SUPABASE_ANON_KEY = 'your-supabase-anon-key';

// 初始化 Supabase 客户端
const supabase = typeof window !== 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

// 初始化应用
function initApp() {
  // 绑定事件监听器
  bindEventListeners();
  
  // 检查用户登录状态
  checkAuthStatus();
  
  // 初始化地图
  initMap();
  
  // 初始化预算图表
  initBudgetChart();
  
  // 模拟数据加载
  loadMockData();
}

// 绑定所有事件监听器
function bindEventListeners() {
  // 导航栏相关
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('py-2');
      navbar.classList.remove('py-3');
    } else {
      navbar.classList.add('py-3');
      navbar.classList.remove('py-2');
    }
  });
  
  // 移动端菜单
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  menuToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
  });
  
  // 平滑滚动
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: 'smooth'
        });
        // 关闭移动端菜单
        mobileMenu.classList.add('hidden');
      }
    });
  });
  
  // 语音输入功能
  const voiceInputBtn = document.getElementById('voice-input-btn');
  const voiceStatus = document.getElementById('voice-status');
  const travelRequest = document.getElementById('travel-request');
  
  voiceInputBtn.addEventListener('click', () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'zh-CN';
      recognition.interimResults = false;
      
      voiceStatus.classList.remove('hidden');
      voiceInputBtn.innerHTML = '<i class="fa fa-stop text-red-500 text-xl"></i>';
      
      recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript;
        travelRequest.value = speechResult;
        voiceStatus.classList.add('hidden');
        voiceInputBtn.innerHTML = '<i class="fa fa-microphone text-xl"></i>';
        showToast('语音识别成功', 'success');
      };
      
      recognition.onerror = (error) => {
        console.error('语音识别错误:', error);
        voiceStatus.classList.add('hidden');
        voiceInputBtn.innerHTML = '<i class="fa fa-microphone text-xl"></i>';
        showToast('语音识别失败，请重试', 'error');
      };
      
      recognition.onend = () => {
        voiceStatus.classList.add('hidden');
        voiceInputBtn.innerHTML = '<i class="fa fa-microphone text-xl"></i>';
      };
      
      recognition.start();
    } else {
      showToast('您的浏览器不支持语音识别功能', 'error');
    }
  });
  
  // 生成行程计划
  const generatePlanBtn = document.getElementById('generate-plan-btn');
  generatePlanBtn.addEventListener('click', generateTravelPlan);
  
  // 保存行程计划
  const savePlanBtn = document.getElementById('save-plan-btn');
  savePlanBtn.addEventListener('click', saveTravelPlan);
  
  // 打印行程计划
  const printPlanBtn = document.getElementById('print-plan-btn');
  printPlanBtn.addEventListener('click', () => {
    window.print();
  });
  
  // 预算管理
  const addBudgetItemBtn = document.getElementById('add-budget-item-btn');
  addBudgetItemBtn.addEventListener('click', addBudgetItem);
  
  // 地图相关
  const mapSearchBtn = document.getElementById('map-search-btn');
  mapSearchBtn.addEventListener('click', searchLocation);
  
  const addMarkerBtn = document.getElementById('add-marker-btn');
  addMarkerBtn.addEventListener('click', enableAddMarkerMode);
  
  const clearMarkersBtn = document.getElementById('clear-markers-btn');
  clearMarkersBtn.addEventListener('click', clearMapMarkers);
  
  const calculateRouteBtn = document.getElementById('calculate-route-btn');
  calculateRouteBtn.addEventListener('click', calculateRoute);
  
  // 认证相关
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const authModal = document.getElementById('auth-modal');
  const closeAuthModal = document.getElementById('close-auth-modal');
  const switchToRegister = document.getElementById('switch-to-register');
  const switchToLogin = document.getElementById('switch-to-login');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const authModalTitle = document.getElementById('auth-modal-title');
  const loginSubmitBtn = document.getElementById('login-submit-btn');
  const registerSubmitBtn = document.getElementById('register-submit-btn');
  
  loginBtn.addEventListener('click', () => {
    authModal.classList.remove('hidden');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    authModalTitle.textContent = '登录';
  });
  
  logoutBtn.addEventListener('click', logout);
  
  closeAuthModal.addEventListener('click', () => {
    authModal.classList.add('hidden');
  });
  
  switchToRegister.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    authModalTitle.textContent = '注册';
  });
  
  switchToLogin.addEventListener('click', () => {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    authModalTitle.textContent = '登录';
  });
  
  loginSubmitBtn.addEventListener('click', handleLogin);
  registerSubmitBtn.addEventListener('click', handleRegister);
  
  // 点击模态框外部关闭
  authModal.addEventListener('click', (e) => {
    if (e.target === authModal) {
      authModal.classList.add('hidden');
    }
  });
}

// 检查认证状态
async function checkAuthStatus() {
  try {
    if (!supabase) {
      // 如果没有配置Supabase，使用本地存储模拟登录状态
      const savedUser = localStorage.getItem('mockUser');
      if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUIForAuth();
      }
      return;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      currentUser = user;
      updateUIForAuth();
    }
  } catch (error) {
    console.error('检查认证状态失败:', error);
  }
}

// 处理登录
async function handleLogin() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  if (!email || !password) {
    showToast('请填写完整信息', 'error');
    return;
  }
  
  try {
    if (!supabase) {
      // 模拟登录
      localStorage.setItem('mockUser', JSON.stringify({ email }));
      currentUser = { email };
      showToast('登录成功', 'success');
      document.getElementById('auth-modal').classList.add('hidden');
      updateUIForAuth();
      return;
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      throw error;
    }
    
    currentUser = data.user;
    showToast('登录成功', 'success');
    document.getElementById('auth-modal').classList.add('hidden');
    updateUIForAuth();
  } catch (error) {
    console.error('登录失败:', error);
    showToast('登录失败，请检查邮箱和密码', 'error');
  }
}

// 处理注册
async function handleRegister() {
  const username = document.getElementById('register-username').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  
  if (!username || !email || !password) {
    showToast('请填写完整信息', 'error');
    return;
  }
  
  try {
    if (!supabase) {
      // 模拟注册
      localStorage.setItem('mockUser', JSON.stringify({ email, username }));
      currentUser = { email, username };
      showToast('注册成功', 'success');
      document.getElementById('auth-modal').classList.add('hidden');
      updateUIForAuth();
      return;
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } }
    });
    
    if (error) {
      throw error;
    }
    
    showToast('注册成功，请查收验证邮件', 'success');
    document.getElementById('switch-to-login').click();
  } catch (error) {
    console.error('注册失败:', error);
    showToast('注册失败，请稍后重试', 'error');
  }
}

// 登出
async function logout() {
  try {
    if (!supabase) {
      // 模拟登出
      localStorage.removeItem('mockUser');
      currentUser = null;
      showToast('已退出登录', 'success');
      updateUIForAuth();
      return;
    }
    
    await supabase.auth.signOut();
    currentUser = null;
    showToast('已退出登录', 'success');
    updateUIForAuth();
  } catch (error) {
    console.error('登出失败:', error);
    showToast('登出失败，请稍后重试', 'error');
  }
}

// 更新认证相关UI
function updateUIForAuth() {
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  
  if (currentUser) {
    loginBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
  } else {
    loginBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
  }
}

// 生成旅行计划
function generateTravelPlan() {
  const destination = document.getElementById('destination').value;
  const days = document.getElementById('days').value;
  const travelStyle = document.getElementById('travel-style').value;
  const budget = document.getElementById('budget').value;
  const travelRequest = document.getElementById('travel-request').value;
  
  if (!destination || !days || !travelStyle || !budget) {
    showToast('请填写必要的旅行信息', 'error');
    return;
  }
  
  // 显示加载状态
  const generatePlanBtn = document.getElementById('generate-plan-btn');
  const originalText = generatePlanBtn.innerHTML;
  generatePlanBtn.innerHTML = '<i class="fa fa-spinner fa-spin mr-2"></i>生成中...';
  generatePlanBtn.disabled = true;
  
  // 模拟API调用延迟
  setTimeout(() => {
    const planResult = document.getElementById('plan-result');
    const itineraryContent = document.getElementById('itinerary-content');
    
    // 生成模拟行程数据
    const mockItinerary = generateMockItinerary(destination, parseInt(days), travelStyle, parseInt(budget));
    
    // 渲染行程内容
    itineraryContent.innerHTML = renderItinerary(mockItinerary);
    
    // 显示结果区域
    planResult.classList.remove('hidden');
    
    // 滚动到结果区域
    planResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // 恢复按钮状态
    generatePlanBtn.innerHTML = originalText;
    generatePlanBtn.disabled = false;
    
    showToast('行程计划生成成功', 'success');
  }, 1500);
}

// 生成模拟行程数据
function generateMockItinerary(destination, days, travelStyle, budget) {
  // 基础活动库
  const activitiesByType = {
    '美食': ['当地特色餐厅', '美食街探索', '海鲜市场', '小吃街', '特色咖啡馆'],
    '文化': ['博物馆', '历史古迹', '传统村落', '寺庙', '艺术展览'],
    '自然': ['国家公园', '海滩', '徒步路线', '湖泊', '瀑布'],
    '购物': ['购物中心', '当地市场', '特色商店', '免税店', '夜市'],
    '休闲': ['SPA', '温泉', '主题公园', '游船', '高尔夫']
  };
  
  const itinerary = {
    destination,
    days,
    travelStyle,
    budget,
    dailyPlans: []
  };
  
  // 生成每日计划
  for (let day = 1; day <= days; day++) {
    const dailyPlan = {
      day,
      title: `${destination}第${day}天行程`,
      activities: []
    };
    
    // 每天安排4-6个活动
    const activityCount = Math.floor(Math.random() * 3) + 4;
    const chosenActivities = [];
    
    // 优先选择与旅行风格相关的活动
    const styleActivities = activitiesByType[travelStyle] || [];
    const otherActivities = Object.values(activitiesByType).flat().filter(a => !styleActivities.includes(a));
    
    // 选择活动
    const styleActivityCount = Math.min(2, activityCount, styleActivities.length);
    for (let i = 0; i < styleActivityCount; i++) {
      const randomIndex = Math.floor(Math.random() * styleActivities.length);
      chosenActivities.push(styleActivities[randomIndex]);
    }
    
    // 选择其他活动补充
    while (chosenActivities.length < activityCount && otherActivities.length > 0) {
      const randomIndex = Math.floor(Math.random() * otherActivities.length);
      const activity = otherActivities[randomIndex];
      if (!chosenActivities.includes(activity)) {
        chosenActivities.push(activity);
      }
    }
    
    // 为每个活动分配时间和描述
    const timeSlots = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00'];
    chosenActivities.forEach((activity, index) => {
      dailyPlan.activities.push({
        time: timeSlots[index % timeSlots.length],
        name: activity,
        description: `${destination}著名的${activity}，不容错过的体验。`,
        estimatedCost: Math.floor(Math.random() * 200) + 50
      });
    });
    
    itinerary.dailyPlans.push(dailyPlan);
  }
  
  // 计算总预算
  itinerary.totalEstimatedCost = itinerary.dailyPlans.reduce((total, day) => {
    return total + day.activities.reduce((dayTotal, activity) => dayTotal + activity.estimatedCost, 0);
  }, 0);
  
  return itinerary;
}

// 渲染行程内容
function renderItinerary(itinerary) {
  let html = `
    <div class="bg-gray-50 p-4 rounded-lg mb-6">
      <div class="flex flex-wrap justify-between items-center gap-4">
        <h4 class="text-lg font-bold">${itinerary.destination} ${itinerary.days}天${itinerary.travelStyle}之旅</h4>
        <div class="text-sm">
          <span class="bg-primary/10 text-primary px-3 py-1 rounded-full">总预算: ¥${itinerary.budget}</span>
          <span class="bg-secondary/10 text-secondary px-3 py-1 rounded-full ml-2">预计花费: ¥${itinerary.totalEstimatedCost}</span>
        </div>
      </div>
    </div>
  `;
  
  itinerary.dailyPlans.forEach(day => {
    html += `
      <div class="border border-gray-200 rounded-lg overflow-hidden mb-6">
        <div class="bg-primary/5 px-6 py-4 border-b border-gray-200">
          <h4 class="text-lg font-bold">第${day.day}天 - ${day.title}</h4>
        </div>
        <div class="divide-y divide-gray-200">
    `;
    
    day.activities.forEach(activity => {
      html += `
        <div class="p-4 hover:bg-gray-50 transition-colors">
          <div class="flex flex-wrap md:flex-nowrap justify-between gap-4 items-start">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">${activity.time}</span>
                <h5 class="font-medium">${activity.name}</h5>
              </div>
              <p class="text-gray-600 mt-2 text-sm">${activity.description}</p>
            </div>
            <div class="text-right">
              <span class="font-bold text-accent">¥${activity.estimatedCost}</span>
            </div>
          </div>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
  });
  
  return html;
}

// 保存旅行计划
async function saveTravelPlan() {
  if (!currentUser) {
    showToast('请先登录后保存行程', 'error');
    document.getElementById('login-btn').click();
    return;
  }
  
  // 这里可以实现保存到Supabase的逻辑
  try {
    showToast('行程已保存', 'success');
  } catch (error) {
    console.error('保存行程失败:', error);
    showToast('保存失败，请稍后重试', 'error');
  }
}

// 初始化地图
function initMap() {
  // 检查Mapbox是否可用
  if (typeof mapboxgl === 'undefined') {
    const mapElement = document.getElementById('map');
    mapElement.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500">地图加载失败，请检查API密钥</div>';
    return;
  }
  
  try {
    // 设置Mapbox访问令牌（这里使用示例令牌，实际项目中需要替换）
    mapboxgl.accessToken = 'pk.eyJ1IjoiZXhhbXBsZXVzZXIiLCJhIjoiY2x1ZnduM3BjMGd6azJqcW95dzY1cm51biJ9.S7KXyUv0k1rP4QmN2e5yUw';
    
    // 创建地图实例
    map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [116.3974, 39.9093], // 北京坐标
      zoom: 10
    });
    
    // 添加导航控制
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // 添加全屏控制
    map.addControl(new mapboxgl.FullscreenControl());
    
    // 地图加载完成后的处理
    map.on('load', () => {
      console.log('地图加载完成');
    });
  } catch (error) {
    console.error('地图初始化失败:', error);
    const mapElement = document.getElementById('map');
    mapElement.innerHTML = '<div class="flex items-center justify-center h-full text-gray-500">地图初始化失败</div>';
  }
}

// 搜索地点
function searchLocation() {
  const searchQuery = document.getElementById('map-search').value;
  if (!searchQuery || !map) return;
  
  // 模拟搜索功能
  showToast(`搜索: ${searchQuery}`, 'info');
  
  // 这里可以集成真实的地理编码API
}

// 启用添加标记模式
function enableAddMarkerMode() {
  if (!map) return;
  
  showToast('点击地图添加标记', 'info');
  
  map.once('click', (e) => {
    const coordinates = e.lngLat;
    
    // 创建标记
    const marker = new mapboxgl.Marker()
      .setLngLat(coordinates)
      .addTo(map);
    
    markers.push(marker);
    
    showToast('标记已添加', 'success');
  });
}

// 清除所有标记
function clearMapMarkers() {
  if (!map) return;
  
  markers.forEach(marker => marker.remove());
  markers = [];
  
  showToast('所有标记已清除', 'success');
}

// 计算路线
function calculateRoute() {
  const start = document.getElementById('route-start').value;
  const end = document.getElementById('route-end').value;
  
  if (!start || !end || !map) {
    showToast('请输入起点和终点', 'error');
    return;
  }
  
  showToast(`规划从 ${start} 到 ${end} 的路线`, 'info');
  
  // 这里可以集成真实的路线规划API
}

// 初始化预算图表
function initBudgetChart() {
  const ctx = document.getElementById('budget-chart');
  if (!ctx) return;
  
  budgetChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [
          '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
          '#ec4899', '#14b8a6', '#f97316', '#64748b', '#06b6d4'
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

// 添加预算项
function addBudgetItem() {
  const name = document.getElementById('budget-item-name').value;
  const amount = parseFloat(document.getElementById('budget-item-amount').value);
  
  if (!name || isNaN(amount) || amount <= 0) {
    showToast('请输入有效的预算项和金额', 'error');
    return;
  }
  
  // 添加到预算项列表
  budgetItems.push({ name, amount });
  
  // 更新UI
  updateBudgetUI();
  
  // 清空输入框
  document.getElementById('budget-item-name').value = '';
  document.getElementById('budget-item-amount').value = '';
  
  showToast('预算项已添加', 'success');
}

// 更新预算UI
function updateBudgetUI() {
  const budgetItemsList = document.getElementById('budget-items-list');
  const noBudgetItems = document.getElementById('no-budget-items');
  const totalBudgetEl = document.getElementById('total-budget');
  const allocatedAmountEl = document.getElementById('allocated-amount');
  const remainingBudgetEl = document.getElementById('remaining-budget');
  const budgetProgressEl = document.getElementById('budget-progress');
  
  // 计算总额
  const allocatedAmount = budgetItems.reduce((total, item) => total + item.amount, 0);
  const totalBudget = parseInt(document.getElementById('budget').value) || allocatedAmount;
  const remainingBudget = totalBudget - allocatedAmount;
  
  // 更新预算概览
  totalBudgetEl.textContent = `¥${totalBudget}`;
  allocatedAmountEl.textContent = `¥${allocatedAmount}`;
  remainingBudgetEl.textContent = `¥${remainingBudget}`;
  
  // 更新进度条
  const progressPercentage = totalBudget > 0 ? (allocatedAmount / totalBudget) * 100 : 0;
  budgetProgressEl.style.width = `${Math.min(progressPercentage, 100)}%`;
  
  // 更新预算明细
  if (budgetItems.length === 0) {
    budgetItemsList.innerHTML = '';
    noBudgetItems.classList.remove('hidden');
  } else {
    noBudgetItems.classList.add('hidden');
    budgetItemsList.innerHTML = '';
    
    budgetItems.forEach((item, index) => {
      const row = document.createElement('tr');
      row.className = 'hover:bg-gray-50 transition-colors';
      row.innerHTML = `
        <td class="py-3 px-4 text-sm">${item.name}</td>
        <td class="py-3 px-4 text-sm text-right font-medium">¥${item.amount}</td>
        <td class="py-3 px-4 text-center">
          <button class="text-red-500 hover:text-red-700 transition-colors" onclick="deleteBudgetItem(${index})">
            <i class="fa fa-trash"></i>
          </button>
        </td>
      `;
      budgetItemsList.appendChild(row);
    });
  }
  
  // 更新图表
  if (budgetChart) {
    budgetChart.data.labels = budgetItems.map(item => item.name);
    budgetChart.data.datasets[0].data = budgetItems.map(item => item.amount);
    budgetChart.update();
  }
}

// 删除预算项
function deleteBudgetItem(index) {
  budgetItems.splice(index, 1);
  updateBudgetUI();
  showToast('预算项已删除', 'success');
}

// 显示提示框
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  const toastIcon = document.getElementById('toast-icon');
  
  toastMessage.textContent = message;
  
  // 设置图标和颜色
  if (type === 'success') {
    toastIcon.className = 'fa fa-check-circle text-secondary';
  } else if (type === 'error') {
    toastIcon.className = 'fa fa-times-circle text-red-500';
  } else if (type === 'info') {
    toastIcon.className = 'fa fa-info-circle text-primary';
  }
  
  // 显示提示框
  toast.classList.remove('translate-y-20', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');
  
  // 3秒后自动隐藏
  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 3000);
}

// 加载模拟数据
function loadMockData() {
  // 设置一些示例数据
  document.getElementById('destination').value = '上海';
  document.getElementById('days').value = '3';
  document.getElementById('travel-style').value = '美食';
  document.getElementById('budget').value = '3000';
  
  // 添加一些示例预算项
  const mockBudgetItems = [
    { name: '住宿', amount: 1200 },
    { name: '餐饮', amount: 800 },
    { name: '交通', amount: 500 },
    { name: '门票', amount: 300 },
    { name: '购物', amount: 200 }
  ];
  
  budgetItems = mockBudgetItems;
  updateBudgetUI();
}

// 确保DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);

// 导出一些公共函数供外部使用
window.deleteBudgetItem = deleteBudgetItem;