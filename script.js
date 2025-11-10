/* ======================================================
   AI旅行规划师 - 核心功能实现
   ====================================================== */

// 全局变量和配置
const APP_CONFIG = {
    // 这里需要填入真实的Supabase配置
    SUPABASE_URL: 'https://your-project.supabase.co',
    SUPABASE_KEY: 'your-supabase-anon-key',
    
    // 这里需要填入真实的地图API密钥
    MAPBOX_ACCESS_TOKEN: 'your-mapbox-access-token',
    
    // 这里需要填入真实的大语言模型API密钥
    LLM_API_KEY: 'your-llm-api-key',
    LLM_API_URL: 'https://api.example.com/chat/completions',
    
    // 默认设置
    DEFAULT_LOCATION: [116.404, 39.915], // 北京坐标
    DEFAULT_ZOOM: 12
};

// 全局状态
let appState = {
    supabase: null,
    map: null,
    markers: [],
    currentUser: null,
    recognition: null,
    isListening: false,
    budgetChart: null
};

// DOM元素引用
const DOM = {};

/* ======================================================
   初始化函数
   ====================================================== */

/**
 * 初始化应用
 */
async function initApp() {
    console.log('AI旅行规划师初始化...');
    
    // 初始化DOM引用
    initDOMReferences();
    
    // 初始化Supabase连接
    await initSupabase();
    
    // 初始化语音识别
    initSpeechRecognition();
    
    // 初始化地图
    initMap();
    
    // 初始化预算图表
    initBudgetChart();
    
    // 绑定事件监听器
    bindEventListeners();
    
    // 检查用户登录状态
    checkAuthStatus();
    
    console.log('应用初始化完成');
}

/**
 * 初始化DOM元素引用
 */
function initDOMReferences() {
    // 行程规划相关
    DOM.travelRequest = document.getElementById('travel-request');
    DOM.voiceInputBtn = document.getElementById('voice-input-btn');
    DOM.voiceStatus = document.getElementById('voice-status');
    DOM.destination = document.getElementById('destination');
    DOM.days = document.getElementById('days');
    DOM.startDate = document.getElementById('start-date');
    DOM.budget = document.getElementById('budget');
    DOM.generatePlanBtn = document.getElementById('generate-plan-btn');
    DOM.planResult = document.getElementById('plan-result');
    DOM.itineraryContent = document.getElementById('itinerary-content');
    DOM.savePlanBtn = document.getElementById('save-plan-btn');
    DOM.printPlanBtn = document.getElementById('print-plan-btn');
    
    // 地图相关
    DOM.map = document.getElementById('map');
    DOM.mapPlaceholder = document.getElementById('map-placeholder');
    DOM.mapSearch = document.getElementById('map-search');
    DOM.mapSearchBtn = document.getElementById('map-search-btn');
    DOM.addMarkerBtn = document.getElementById('add-marker-btn');
    DOM.clearMarkersBtn = document.getElementById('clear-markers-btn');
    
    // 预算相关
    DOM.totalBudget = document.getElementById('total-budget');
    DOM.allocatedAmount = document.getElementById('allocated-amount');
    DOM.remainingBudget = document.getElementById('remaining-budget');
    DOM.budgetProgress = document.getElementById('budget-progress');
    DOM.budgetChart = document.getElementById('budget-chart');
    
    // 用户认证相关
    DOM.loginBtn = document.getElementById('login-btn');
    DOM.registerBtn = document.getElementById('register-btn');
    DOM.authModal = document.getElementById('auth-modal');
    DOM.authModalTitle = document.getElementById('auth-modal-title');
    DOM.closeAuthModal = document.getElementById('close-auth-modal');
    DOM.loginForm = document.getElementById('login-form');
    DOM.registerForm = document.getElementById('register-form');
    DOM.switchToRegister = document.getElementById('switch-to-register');
    DOM.switchToLogin = document.getElementById('switch-to-login');
    DOM.loginEmail = document.getElementById('login-email');
    DOM.loginPassword = document.getElementById('login-password');
    DOM.loginSubmitBtn = document.getElementById('login-submit-btn');
    DOM.registerUsername = document.getElementById('register-username');
    DOM.registerEmail = document.getElementById('register-email');
    DOM.registerPassword = document.getElementById('register-password');
    DOM.registerSubmitBtn = document.getElementById('register-submit-btn');
    
    // 通知提示框
    DOM.toast = document.getElementById('toast');
    DOM.toastIcon = document.getElementById('toast-icon');
    DOM.toastMessage = document.getElementById('toast-message');
}

/* ======================================================
   语音识别功能
   ====================================================== */

/**
 * 初始化语音识别
 */
function initSpeechRecognition() {
    // 检查浏览器支持
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
        appState.recognition = new SpeechRecognition();
        
        // 配置语音识别
        appState.recognition.continuous = false;
        appState.recognition.interimResults = false;
        appState.recognition.lang = 'zh-CN'; // 设置为中文识别
        
        // 处理识别结果
        appState.recognition.onresult = (event) => {
            const speechResult = event.results[0][0].transcript;
            console.log('语音识别结果:', speechResult);
            
            // 将识别结果填入文本域
            if (DOM.travelRequest) {
                DOM.travelRequest.value = speechResult;
                
                // 尝试从语音识别结果中提取关键信息
                extractTripInfoFromSpeech(speechResult);
            }
        };
        
        // 处理识别错误
        appState.recognition.onerror = (event) => {
            console.error('语音识别错误:', event.error);
            showToast('语音识别失败，请重试', 'error');
            stopListening();
        };
        
        // 处理识别结束
        appState.recognition.onend = () => {
            stopListening();
        };
    } else {
        console.warn('当前浏览器不支持语音识别功能');
        if (DOM.voiceInputBtn) {
            DOM.voiceInputBtn.disabled = true;
            DOM.voiceInputBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }
}

/**
 * 开始语音监听
 */
function startListening() {
    if (!appState.recognition) {
        showToast('语音识别功能不可用', 'error');
        return;
    }
    
    try {
        appState.isListening = true;
        if (DOM.voiceStatus) DOM.voiceStatus.classList.remove('hidden');
        if (DOM.voiceInputBtn) DOM.voiceInputBtn.classList.add('text-red-500');
        
        appState.recognition.start();
        console.log('开始语音监听...');
    } catch (error) {
        console.error('启动语音识别失败:', error);
        showToast('启动语音识别失败', 'error');
        stopListening();
    }
}

/**
 * 停止语音监听
 */
function stopListening() {
    if (!appState.recognition) return;
    
    appState.isListening = false;
    if (DOM.voiceStatus) DOM.voiceStatus.classList.add('hidden');
    if (DOM.voiceInputBtn) DOM.voiceInputBtn.classList.remove('text-red-500');
    
    try {
        appState.recognition.stop();
        console.log('停止语音监听');
    } catch (error) {
        console.error('停止语音识别失败:', error);
    }
}

/**
 * 从语音中提取旅行信息
 */
function extractTripInfoFromSpeech(text) {
    // 简单的关键词匹配提取信息
    // 实际项目中可能需要使用更复杂的NLP技术
    
    // 提取目的地
    const locationMatch = text.match(/去([^旅游玩]+)[旅游玩]/);
    if (locationMatch && locationMatch[1] && DOM.destination) {
        DOM.destination.value = locationMatch[1];
    }
    
    // 提取天数
    const daysMatch = text.match(/(\d+)天/);
    if (daysMatch && daysMatch[1] && DOM.days) {
        DOM.days.value = parseInt(daysMatch[1]);
    }
    
    // 提取预算
    const budgetMatch = text.match(/预算([\d,]+)元/);
    if (budgetData && budgetMatch[1] && DOM.budget) {
        DOM.budget.value = parseInt(budgetMatch[1].replace(/,/g, ''));
    }
}

/* ======================================================
   Supabase连接
   ====================================================== */

/**
 * 初始化Supabase连接
 */
async function initSupabase() {
    try {
        if (!APP_CONFIG.SUPABASE_URL || !APP_CONFIG.SUPABASE_KEY) {
            console.warn('Supabase配置不完整，使用模拟模式');
            return;
        }
        
        // 初始化Supabase客户端
        appState.supabase = supabase.createClient(
            APP_CONFIG.SUPABASE_URL,
            APP_CONFIG.SUPABASE_KEY
        );
        
        console.log('Supabase连接初始化成功');
    } catch (error) {
        console.error('Supabase连接失败:', error);
        showToast('数据库连接失败', 'error');
    }
}

/**
 * 用户登录
 */
async function loginUser(email, password) {
    try {
        if (!appState.supabase) {
            console.warn('Supabase未连接，使用模拟登录');
            simulateLogin(email);
            return;
        }
        
        const { data, error } = await appState.supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            throw error;
        }
        
        appState.currentUser = data.user;
        showToast('登录成功', 'success');
        updateUIForAuth(true);
        closeAuthModal();
        
    } catch (error) {
        console.error('登录失败:', error);
        showToast('登录失败: ' + error.message, 'error');
    }
}

/**
 * 用户注册
 */
async function registerUser(username, email, password) {
    try {
        if (!appState.supabase) {
            console.warn('Supabase未连接，使用模拟注册');
            simulateRegister(username, email);
            return;
        }
        
        const { data, error } = await appState.supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username
                }
            }
        });
        
        if (error) {
            throw error;
        }
        
        showToast('注册成功，请登录', 'success');
        switchToLoginForm();
        
    } catch (error) {
        console.error('注册失败:', error);
        showToast('注册失败: ' + error.message, 'error');
    }
}

/**
 * 检查用户认证状态
 */
async function checkAuthStatus() {
    try {
        if (!appState.supabase) {
            console.warn('Supabase未连接，无法检查认证状态');
            return;
        }
        
        const { data } = await appState.supabase.auth.getSession();
        
        if (data.session) {
            appState.currentUser = data.session.user;
            updateUIForAuth(true);
            showToast('欢迎回来', 'success');
        }
    } catch (error) {
        console.error('检查认证状态失败:', error);
    }
}

/**
 * 用户登出
 */
async function logoutUser() {
    try {
        if (appState.supabase) {
            await appState.supabase.auth.signOut();
        }
        
        appState.currentUser = null;
        updateUIForAuth(false);
        showToast('已登出', 'success');
    } catch (error) {
        console.error('登出失败:', error);
        showToast('登出失败', 'error');
    }
}

/**
 * 保存行程到数据库
 */
async function saveItinerary(itineraryData) {
    try {
        if (!appState.currentUser) {
            showToast('请先登录', 'warning');
            openLoginModal();
            return;
        }
        
        if (!appState.supabase) {
            console.warn('Supabase未连接，无法保存行程');
            showToast('行程保存功能暂不可用', 'warning');
            return;
        }
        
        const { data, error } = await appState.supabase
            .from('itineraries')
            .insert({
                user_id: appState.currentUser.id,
                destination: itineraryData.destination,
                days: itineraryData.days,
                start_date: itineraryData.startDate,
                budget: itineraryData.budget,
                content: itineraryData.content,
                created_at: new Date().toISOString()
            })
            .select();
        
        if (error) {
            throw error;
        }
        
        showToast('行程已保存', 'success');
        return data[0];
    } catch (error) {
        console.error('保存行程失败:', error);
        showToast('保存行程失败', 'error');
    }
}

/**
 * 模拟登录（用于开发和演示）
 */
function simulateLogin(email) {
    appState.currentUser = {
        id: 'user_' + Date.now(),
        email: email,
        user_metadata: {
            username: email.split('@')[0]
        }
    };
    updateUIForAuth(true);
    closeAuthModal();
}

/**
 * 模拟注册（用于开发和演示）
 */
function simulateRegister(username, email) {
    // 仅切换到登录表单
    switchToLoginForm();
    if (DOM.loginEmail) DOM.loginEmail.value = email;
}

/* ======================================================
   大语言模型API调用
   ====================================================== */

/**
 * 调用大语言模型生成行程
 */
async function generateItinerary(tripData) {
    try {
        showLoadingState(true);
        
        // 构建提示信息
        const prompt = buildItineraryPrompt(tripData);
        
        // 如果没有配置API密钥，使用模拟数据
        if (!APP_CONFIG.LLM_API_KEY) {
            console.warn('未配置LLM API密钥，使用模拟行程数据');
            
            // 模拟API延迟
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // 使用模拟数据
            const mockItinerary = generateMockItinerary(tripData);
            renderItinerary(mockItinerary);
            updateBudgetInfo(mockItinerary);
            updateMapWithItinerary(mockItinerary);
            return;
        }
        
        // 调用大语言模型API
        const response = await fetch(APP_CONFIG.LLM_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${APP_CONFIG.LLM_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4', // 或其他可用模型
                messages: [
                    {
                        role: 'system',
                        content: '你是一位专业的旅行规划师，请根据用户提供的信息生成详细的旅行行程安排。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                response_format: {
                    type: 'json_object'
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 解析生成的行程数据
        let itineraryData;
        try {
            // 假设API返回的是JSON格式的行程
            itineraryData = JSON.parse(data.choices[0].message.content);
        } catch (parseError) {
            // 如果不是JSON，尝试解析文本内容
            console.warn('无法解析JSON响应，尝试解析文本', parseError);
            itineraryData = parseTextItinerary(data.choices[0].message.content);
        }
        
        // 渲染行程
        renderItinerary(itineraryData);
        updateBudgetInfo(itineraryData);
        updateMapWithItinerary(itineraryData);
        
    } catch (error) {
        console.error('生成行程失败:', error);
        showToast('生成行程失败，请重试', 'error');
        showErrorState();
    } finally {
        showLoadingState(false);
    }
}

/**
 * 构建行程提示信息
 */
function buildItineraryPrompt(tripData) {
    let prompt = `请为我规划一次旅行行程，以下是我的需求：\n`;
    
    if (tripData.destination) {
        prompt += `- 目的地: ${tripData.destination}\n`;
    }
    
    if (tripData.days) {
        prompt += `- 旅行天数: ${tripData.days}天\n`;
    }
    
    if (tripData.startDate) {
        prompt += `- 出发日期: ${tripData.startDate}\n`;
    }
    
    if (tripData.budget) {
        prompt += `- 预算: ${tripData.budget}元\n`;
    }
    
    if (tripData.request) {
        prompt += `- 其他需求: ${tripData.request}\n`;
    }
    
    prompt += `\n请提供以下格式的JSON响应：\n{
  "destination": "目的地",
  "days": 天数,
  "budget": 预算,
  "total_estimated_cost": 总估算费用,
  "daily_itineraries": [
    {
      "day": 第几天,
      "activities": [
        {
          "time": "时间段",
          "title": "活动名称",
          "description": "活动描述",
          "location": "地点名称",
          "coordinates": [经度, 纬度], // 如果有
          "cost": 费用
        }
      ]
    }
  ],
  "budget_breakdown": {
    "accommodation": 住宿费用,
    "transportation": 交通费用,
    "food": 餐饮费用,
    "attractions": 景点门票,
    "shopping": 购物费用,
    "other": 其他费用
  }
}`;
    
    return prompt;
}

/**
 * 解析文本格式的行程为结构化数据
 */
function parseTextItinerary(text) {
    // 这里实现从文本到结构化数据的解析
    // 简化版本，实际项目中需要更复杂的解析逻辑
    return generateMockItinerary();
}

/**
 * 生成模拟行程数据（用于演示）
 */
function generateMockItinerary(tripData = {}) {
    const destination = tripData.destination || '上海';
    const days = parseInt(tripData.days) || 3;
    const budget = parseInt(tripData.budget) || 3000;
    
    const dailyItineraries = [];
    
    // 生成每日行程
    for (let i = 1; i <= days; i++) {
        const activities = generateDayActivities(destination, i, days);
        dailyItineraries.push({
            day: i,
            activities: activities
        });
    }
    
    // 生成预算明细
    const budgetBreakdown = {
        accommodation: Math.floor(budget * 0.35),
        transportation: Math.floor(budget * 0.25),
        food: Math.floor(budget * 0.2),
        attractions: Math.floor(budget * 0.1),
        shopping: Math.floor(budget * 0.05),
        other: Math.floor(budget * 0.05)
    };
    
    const totalCost = Object.values(budgetBreakdown).reduce((sum, cost) => sum + cost, 0);
    
    return {
        destination,
        days,
        budget,
        total_estimated_cost: totalCost,
        daily_itineraries: dailyItineraries,
        budget_breakdown: budgetBreakdown
    };
}

/**
 * 生成单日活动
 */
function generateDayActivities(destination, day, totalDays) {
    // 根据不同城市和天数生成不同的活动
    const shanghaiActivities = {
        1: [
            { time: '09:00', title: '上海博物馆', description: '参观中国四大博物馆之一', location: '上海市黄浦区人民大道201号', coordinates: [121.472644, 31.231706], cost: 0 },
            { time: '12:00', title: '南京路午餐', description: '品尝上海特色美食', location: '南京东路步行街', coordinates: [121.472898, 31.234111], cost: 80 },
            { time: '14:00', title: '外滩观光', description: '欣赏黄浦江两岸风光', location: '外滩风景区', coordinates: [121.490023, 31.240054], cost: 0 },
            { time: '17:00', title: '豫园游览', description: '体验江南古典园林', location: '豫园商城', coordinates: [121.492057, 31.227239], cost: 40 },
            { time: '19:00', title: '陆家嘴夜景', description: '观赏上海摩天大楼夜景', location: '陆家嘴金融区', coordinates: [121.507681, 31.239787], cost: 0 }
        ],
        2: [
            { time: '10:00', title: '迪士尼乐园', description: '全天畅游迪士尼', location: '上海迪士尼度假区', coordinates: [121.667201, 31.143385], cost: 475 },
            { time: '20:00', title: '迪士尼烟花表演', description: '观看梦幻烟花秀', location: '上海迪士尼度假区', coordinates: [121.667201, 31.143385], cost: 0 }
        ],
        3: [
            { time: '09:30', title: '田子坊', description: '探索文艺小资街区', location: '田子坊', coordinates: [121.471977, 31.222626], cost: 0 },
            { time: '12:30', title: '新天地午餐', description: '在石库门建筑群中用餐', location: '新天地', coordinates: [121.475145, 31.223667], cost: 120 },
            { time: '14:30', title: '上海当代艺术博物馆', description: '参观现代艺术展览', location: '上海当代艺术博物馆', coordinates: [121.492986, 31.224869], cost: 50 },
            { time: '16:30', title: '徐家汇商圈', description: '购物休闲', location: '徐家汇', coordinates: [121.433957, 31.192911], cost: 0 }
        ]
    };
    
    const beijingActivities = {
        1: [
            { time: '08:30', title: '天安门广场', description: '参观世界最大的城市广场', location: '天安门广场', coordinates: [116.397128, 39.908722], cost: 0 },
            { time: '09:30', title: '故宫博物院', description: '游览明清皇宫', location: '故宫博物院', coordinates: [116.397128, 39.916345], cost: 60 },
            { time: '12:30', title: '景山公园', description: '俯瞰故宫全景', location: '景山公园', coordinates: [116.397285, 39.923629], cost: 2 }
        ]
    };
    
    // 根据目的地选择活动
    let activities;
    if (destination.includes('上海')) {
        activities = shanghaiActivities[day] || shanghaiActivities[1];
    } else if (destination.includes('北京')) {
        activities = beijingActivities[day] || beijingActivities[1];
    } else {
        // 默认活动
        activities = shanghaiActivities[1];
    }
    
    return activities;
}

/* ======================================================
   地图集成
   ====================================================== */

/**
 * 初始化地图
 */
function initMap() {
    try {
        if (!mapboxgl || !APP_CONFIG.MAPBOX_ACCESS_TOKEN) {
            console.warn('Mapbox未加载或无访问令牌，无法初始化地图');
            return;
        }
        
        // 设置Mapbox访问令牌
        mapboxgl.accessToken = APP_CONFIG.MAPBOX_ACCESS_TOKEN;
        
        // 创建地图实例
        appState.map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/light-v10',
            center: APP_CONFIG.DEFAULT_LOCATION,
            zoom: APP_CONFIG.DEFAULT_ZOOM
        });
        
        // 添加地图控件
        appState.map.addControl(new mapboxgl.NavigationControl());
        appState.map.addControl(new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true
        }));
        
        // 地图加载完成事件
        appState.map.on('load', () => {
            console.log('地图加载完成');
            if (DOM.mapPlaceholder) DOM.mapPlaceholder.style.display = 'none';
            if (DOM.map) DOM.map.style.display = 'block';
        });
        
    } catch (error) {
        console.error('初始化地图失败:', error);
        showToast('地图加载失败', 'error');
    }
}

/**
 * 在地图上搜索地点
 */
async function searchPlace(query) {
    try {
        if (!appState.map || !APP_CONFIG.MAPBOX_ACCESS_TOKEN) {
            console.warn('地图未初始化或无访问令牌');
            return;
        }
        
        // 使用Mapbox Geocoding API
        const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${APP_CONFIG.MAPBOX_ACCESS_TOKEN}`
        );
        
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
            const place = data.features[0];
            const coordinates = place.geometry.coordinates;
            
            // 移动地图到搜索地点
            appState.map.flyTo({
                center: coordinates,
                zoom: 14
            });
            
            // 添加标记
            addMarker(coordinates, place.place_name);
            
            return place;
        } else {
            showToast('未找到该地点', 'warning');
        }
    } catch (error) {
        console.error('搜索地点失败:', error);
        showToast('搜索地点失败', 'error');
    }
}

/**
 * 添加地图标记
 */
function addMarker(coordinates, title) {
    if (!appState.map) return;
    
    // 创建标记
    const marker = new mapboxgl.Marker()
        .setLngLat(coordinates)
        .setPopup(new mapboxgl.Popup({ offset: 25 })
            .setHTML(`<h3>${title || '景点'}</h3>`))
        .addTo(appState.map);
    
    // 保存标记引用
    appState.markers.push(marker);
    
    return marker;
}

/**
 * 清除所有地图标记
 */
function clearAllMarkers() {
    // 移除所有标记
    appState.markers.forEach(marker => marker.remove());
    appState.markers = [];
}

/**
 * 根据行程更新地图
 */
function updateMapWithItinerary(itinerary) {
    if (!appState.map || !itinerary.daily_itineraries) return;
    
    // 清除现有标记
    clearAllMarkers();
    
    let firstLocation = null;
    
    // 添加行程中的所有地点标记
    itinerary.daily_itineraries.forEach(dayItinerary => {
        dayItinerary.activities.forEach(activity => {
            if (activity.coordinates) {
                // 添加标记
                addMarker(activity.coordinates, `${activity.title} (第${dayItinerary.day}天)`);
                
                // 记录第一个地点作为地图中心
                if (!firstLocation) {
                    firstLocation = activity.coordinates;
                }
            }
        });
    });
    
    // 如果有地点，移动地图到第一个地点
    if (firstLocation) {
        appState.map.flyTo({
            center: firstLocation,
            zoom: 12
        });
    }
}

/* ======================================================
   行程渲染和UI更新
   ====================================================== */

/**
 * 渲染行程内容
 */
function renderItinerary(itinerary) {
    if (!DOM.itineraryContent || !itinerary.daily_itineraries) return;
    
    // 清空现有内容
    DOM.itineraryContent.innerHTML = '';
    
    // 显示行程结果区域
    if (DOM.planResult) DOM.planResult.classList.remove('hidden');
    
    // 创建行程摘要卡片
    const summaryCard = document.createElement('div');
    summaryCard.className = 'bg-blue-50 border-l-4 border-primary p-4 rounded-r-lg mb-6';
    summaryCard.innerHTML = `
        <div class="flex flex-wrap justify-between items-center gap-2 mb-2">
            <h4 class="text-lg font-bold text-gray-900">${itinerary.destination} ${itinerary.days}日游</h4>
            <span class="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">预算: ¥${itinerary.budget}</span>
        </div>
        <p class="text-gray-600 text-sm">总估算费用: <strong>¥${itinerary.total_estimated_cost}</strong></p>
    `;
    DOM.itineraryContent.appendChild(summaryCard);
    
    // 渲染每日行程
    itinerary.daily_itineraries.forEach(dayItinerary => {
        const dayCard = document.createElement('div');
        dayCard.className = 'day-card mb-6 last:mb-0';
        
        // 日期标题
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-title mb-4 pb-2 border-b';
        dayHeader.innerHTML = `
            <span class="day-number">${dayItinerary.day}</span>
            <h4 class="text-lg font-bold">第${dayItinerary.day}天</h4>
        `;
        dayCard.appendChild(dayHeader);
        
        // 活动列表
        const activitiesList = document.createElement('div');
        activitiesList.className = 'space-y-4';
        
        dayItinerary.activities.forEach(activity => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            
            // 活动时间
            const timeElement = document.createElement('div');
            timeElement.className = 'activity-time';
            timeElement.textContent = activity.time;
            
            // 活动详情
            const detailsElement = document.createElement('div');
            detailsElement.className = 'activity-details';
            
            const titleElement = document.createElement('div');
            titleElement.className = 'activity-title';
            titleElement.textContent = activity.title;
            
            const descElement = document.createElement('div');
            descElement.className = 'activity-desc';
            
            // 构建描述内容
            let descriptionHtml = activity.description;
            if (activity.location) {
                descriptionHtml += `<br><i class="fa fa-map-marker text-primary mr-1"></i> ${activity.location}`;
            }
            if (activity.cost !== undefined && activity.cost > 0) {
                descriptionHtml += `<br><i class="fa fa-money text-green-500 mr-1"></i> ¥${activity.cost}`;
            }
            
            descElement.innerHTML = descriptionHtml;
            
            detailsElement.appendChild(titleElement);
            detailsElement.appendChild(descElement);
            
            activityItem.appendChild(timeElement);
            activityItem.appendChild(detailsElement);
            
            activitiesList.appendChild(activityItem);
        });
        
        dayCard.appendChild(activitiesList);
        DOM.itineraryContent.appendChild(dayCard);
    });
}

/**
 * 更新预算信息
 */
function updateBudgetInfo(itinerary) {
    if (!itinerary.budget_breakdown) return;
    
    const { budget_breakdown } = itinerary;
    const totalBudget = itinerary.budget || 0;
    const totalAllocated = Object.values(budget_breakdown).reduce((sum, cost) => sum + cost, 0);
    const remainingBudget = totalBudget - totalAllocated;
    const percentage = totalBudget > 0 ? (totalAllocated / totalBudget) * 100 : 0;
    
    // 更新预算显示
    if (DOM.totalBudget) DOM.totalBudget.textContent = `¥${totalBudget}`;
    if (DOM.allocatedAmount) DOM.allocatedAmount.textContent = `¥${totalAllocated}`;
    if (DOM.remainingBudget) {
        DOM.remainingBudget.textContent = `¥${remainingBudget}`;
        // 根据剩余预算多少设置不同颜色
        if (remainingBudget < 0) {
            DOM.remainingBudget.className = 'font-medium text-red-500';
        } else if (remainingBudget < totalBudget * 0.1) {
            DOM.remainingBudget.className = 'font-medium text-yellow-500';
        } else {
            DOM.remainingBudget.className = 'font-medium';
        }
    }
    
    // 更新进度条
    if (DOM.budgetProgress) {
        DOM.budgetProgress.style.width = `${Math.min(percentage, 100)}%`;
        
        // 根据使用百分比设置不同颜色
        if (percentage > 100) {
            DOM.budgetProgress.className = 'bg-red-500 h-2 rounded-full';
        } else if (percentage > 80) {
            DOM.budgetProgress.className = 'bg-yellow-500 h-2 rounded-full';
        } else {
            DOM.budgetProgress.className = 'bg-primary h-2 rounded-full';
        }
    }
    
    // 更新预算图表
    updateBudgetChart(budget_breakdown);
}

/**
 * 初始化预算图表
 */
function initBudgetChart() {
    if (!DOM.budgetChart || !window.Chart) return;
    
    // 创建默认图表
    const defaultData = {
        accommodation: 0,
        transportation: 0,
        food: 0,
        attractions: 0,
        shopping: 0,
        other: 0
    };
    
    appState.budgetChart = new Chart(DOM.budgetChart, {
        type: 'doughnut',
        data: {
            labels: ['住宿', '交通', '餐饮', '景点', '购物', '其他'],
            datasets: [{
                data: Object.values(defaultData),
                backgroundColor: [
                    '#3B82F6', // 蓝色
                    '#10B981', // 绿色
                    '#F59E0B', // 橙色
                    '#EC4899', // 粉色
                    '#8B5CF6', // 紫色
                    '#6B7280'  // 灰色
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 20,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${label}: ¥${value} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%',
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    });
}

/**
 * 更新预算图表
 */
function updateBudgetChart(budgetBreakdown) {
    if (!appState.budgetChart) return;
    
    // 更新图表数据
    appState.budgetChart.data.datasets[0].data = Object.values(budgetBreakdown);
    appState.budgetChart.update();
}

/**
 * 显示加载状态
 */
function showLoadingState(show = true) {
    if (!DOM.itineraryContent) return;
    
    if (show) {
        DOM.itineraryContent.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <p>行程计划生成中...</p>
                <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mt-4"></div>
            </div>
        `;
    }
}

/**
 * 显示错误状态
 */
function showErrorState() {
    if (!DOM.itineraryContent) return;
    
    DOM.itineraryContent.innerHTML = `
        <div class="text-center py-8 text-red-500">
            <i class="fa fa-exclamation-circle text-4xl mb-3"></i>
            <p>生成行程失败，请稍后重试</p>
            <button id="retry-btn" class="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all">
                重试
            </button>
        </div>
    `;
    
    // 绑定重试按钮事件
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
        retryBtn.addEventListener('click', generateTripPlan);
    }
}

/**
 * 更新认证相关UI
 */
function updateUIForAuth(isLoggedIn) {
    const navButtons = document.querySelector('.flex.items-center.space-x-4');
    if (!navButtons) return;
    
    if (isLoggedIn) {
        // 显示用户信息和登出按钮
        navButtons.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="fa fa-user-circle text-primary text-xl"></i>
                <span class="text-sm font-medium">${appState.currentUser.user_metadata?.username || appState.currentUser.email.split('@')[0]}</span>
            </div>
            <button id="logout-btn" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all-300">
                登出
            </button>
        `;
        
        // 绑定登出按钮事件
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logoutUser);
        }
    } else {
        // 显示登录和注册按钮
        navButtons.innerHTML = `
            <button id="login-btn" class="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/5 transition-all-300">
                登录
            </button>
            <button id="register-btn" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all-300">
                注册
            </button>
        `;
        
        // 重新绑定事件
        DOM.loginBtn = document.getElementById('login-btn');
        DOM.registerBtn = document.getElementById('register-btn');
        if (DOM.loginBtn) DOM.loginBtn.addEventListener('click', openLoginModal);
        if (DOM.registerBtn) DOM.registerBtn.addEventListener('click', openRegisterModal);
    }
}

/* ======================================================
   认证模态框管理
   ====================================================== */

/**
 * 打开登录模态框
 */
function openLoginModal() {
    if (!DOM.authModal || !DOM.authModalTitle) return;
    
    DOM.authModalTitle.textContent = '登录';
    if (DOM.loginForm) DOM.loginForm.classList.remove('hidden');
    if (DOM.registerForm) DOM.registerForm.classList.add('hidden');
    DOM.authModal.classList.add('active');
    
    // 禁止背景滚动
    document.body.style.overflow = 'hidden';
}

/**
 * 打开注册模态框
 */
function openRegisterModal() {
    if (!DOM.authModal || !DOM.authModalTitle) return;
    
    DOM.authModalTitle.textContent = '注册';
    if (DOM.loginForm) DOM.loginForm.classList.add('hidden');
    if (DOM.registerForm) DOM.registerForm.classList.remove('hidden');
    DOM.authModal.classList.add('active');
    
    // 禁止背景滚动
    document.body.style.overflow = 'hidden';
}

/**
 * 关闭认证模态框
 */
function closeAuthModal() {
    if (!DOM.authModal) return;
    
    DOM.authModal.classList.remove('active');
    
    // 恢复背景滚动
    document.body.style.overflow = '';
    
    // 清空表单
    if (DOM.loginEmail) DOM.loginEmail.value = '';
    if (DOM.loginPassword) DOM.loginPassword.value = '';
    if (DOM.registerUsername) DOM.registerUsername.value = '';
    if (DOM.registerEmail) DOM.registerEmail.value = '';
    if (DOM.registerPassword) DOM.registerPassword.value = '';
}

/**
 * 切换到登录表单
 */
function switchToLoginForm() {
    if (!DOM.authModalTitle) return;
    
    DOM.authModalTitle.textContent = '登录';
    if (DOM.loginForm) DOM.loginForm.classList.remove('hidden');
    if (DOM.registerForm) DOM.registerForm.classList.add('hidden');
}

/**
 * 切换到注册表单
 */
function switchToRegisterForm() {
    if (!DOM.authModalTitle) return;
    
    DOM.authModalTitle.textContent = '注册';
    if (DOM.loginForm) DOM.loginForm.classList.add('hidden');
    if (DOM.registerForm) DOM.registerForm.classList.remove('hidden');
}

/* ======================================================
   事件监听器
   ====================================================== */

/**
 * 绑定所有事件监听器
 */
function bindEventListeners() {
    // 语音输入按钮
    if (DOM.voiceInputBtn) {
        DOM.voiceInputBtn.addEventListener('click', () => {
            if (appState.isListening) {
                stopListening();
            } else {
                startListening();
            }
        });
    }
    
    // 生成行程按钮
    if (DOM.generatePlanBtn) {
        DOM.generatePlanBtn.addEventListener('click', generateTripPlan);
    }
    
    // 保存行程按钮
    if (DOM.savePlanBtn) {
        DOM.savePlanBtn.addEventListener('click', () => {
            // 这里应该获取当前生成的行程数据
            // 简化版本，实际应该从DOM或状态中获取
            const currentItinerary = {
                destination: DOM.destination?.value || '未知',
                days: DOM.days?.value || 1,
                startDate: DOM.startDate?.value || new Date().toISOString().split('T')[0],
                budget: DOM.budget?.value || 0,
                content: '当前行程内容'
            };
            saveItinerary(currentItinerary);
        });
    }
    
    // 打印行程按钮
    if (DOM.printPlanBtn) {
        DOM.printPlanBtn.addEventListener('click', () => {
            window.print();
        });
    }
    
    // 地图搜索
    if (DOM.mapSearchBtn) {
        DOM.mapSearchBtn.addEventListener('click', () => {
            if (DOM.mapSearch && DOM.mapSearch.value.trim()) {
                searchPlace(DOM.mapSearch.value.trim());
            }
        });
    }
    
    // 地图搜索回车
    if (DOM.mapSearch) {
        DOM.mapSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && DOM.mapSearch.value.trim()) {
                searchPlace(DOM.mapSearch.value.trim());
            }
        });
    }
    
    // 添加标记按钮
    if (DOM.addMarkerBtn) {
        DOM.addMarkerBtn.addEventListener('click', () => {
            if (appState.map) {
                const center = appState.map.getCenter().toArray();
                addMarker(center, '自定义标记');
                showToast('已添加标记', 'success');
            }
        });
    }
    
    // 清除标记按钮
    if (DOM.clearMarkersBtn) {
        DOM.clearMarkersBtn.addEventListener('click', () => {
            clearAllMarkers();
            showToast('已清除所有标记', 'success');
        });
    }
    
    // 登录按钮
    if (DOM.loginBtn) {
        DOM.loginBtn.addEventListener('click', openLoginModal);
    }
    
    // 注册按钮
    if (DOM.registerBtn) {
        DOM.registerBtn.addEventListener('click', openRegisterModal);
    }
    
    // 关闭模态框
    if (DOM.closeAuthModal) {
        DOM.closeAuthModal.addEventListener('click', closeAuthModal);
    }
    
    // 切换表单
    if (DOM.switchToRegister) {
        DOM.switchToRegister.addEventListener('click', switchToRegisterForm);
    }
    
    if (DOM.switchToLogin) {
        DOM.switchToLogin.addEventListener('click', switchToLoginForm);
    }
    
    // 登录提交
    if (DOM.loginSubmitBtn) {
        DOM.loginSubmitBtn.addEventListener('click', () => {
            if (DOM.loginEmail && DOM.loginPassword) {
                loginUser(DOM.loginEmail.value, DOM.loginPassword.value);
            }
        });
    }
    
    // 注册提交
    if (DOM.registerSubmitBtn) {
        DOM.registerSubmitBtn.addEventListener('click', () => {
            if (DOM.registerUsername && DOM.registerEmail && DOM.registerPassword) {
                registerUser(DOM.registerUsername.value, DOM.registerEmail.value, DOM.registerPassword.value);
            }
        });
    }
    
    // 点击模态框外部关闭
    if (DOM.authModal) {
        DOM.authModal.addEventListener('click', (e) => {
            if (e.target === DOM.authModal) {
                closeAuthModal();
            }
        });
    }
    
    // 监听ESC键关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && DOM.authModal && DOM.authModal.classList.contains('active')) {
            closeAuthModal();
        }
    });
    
    // 导航栏滚动效果
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.classList.add('py-2');
                navbar.classList.add('shadow-md');
            } else {
                navbar.classList.remove('py-2');
                navbar.classList.remove('shadow-md');
            }
        }
    });
}

/**
 * 生成行程计划
 */
function generateTripPlan() {
    // 获取用户输入
    const tripData = {
        request: DOM.travelRequest?.value || '',
        destination: DOM.destination?.value || '',
        days: DOM.days?.value || '',
        startDate: DOM.startDate?.value || '',
        budget: DOM.budget?.value || ''
    };
    
    // 简单验证
    if (!tripData.destination && !tripData.request) {
        showToast('请输入目的地或旅行需求', 'warning');
        return;
    }
    
    // 生成行程
    generateItinerary(tripData);
}

/* ======================================================
   辅助函数
   ====================================================== */

/**
 * 显示通知提示框
 */
function showToast(message, type = 'success') {
    if (!DOM.toast || !DOM.toastMessage || !DOM.toastIcon) return;
    
    // 设置消息内容
    DOM.toastMessage.textContent = message;
    
    // 设置图标和样式
    DOM.toast.className = 'fixed bottom-6 right-6 text-white px-6 py-3 rounded-lg shadow-lg transform translate-y-20 opacity-0 transition-all duration-300 flex items-center space-x-3';
    
    switch (type) {
        case 'success':
            DOM.toast.classList.add('bg-green-500');
            DOM.toastIcon.className = 'fa fa-check-circle';
            break;
        case 'error':
            DOM.toast.classList.add('bg-red-500');
            DOM.toastIcon.className = 'fa fa-exclamation-circle';
            break;
        case 'warning':
            DOM.toast.classList.add('bg-yellow-500');
            DOM.toastIcon.className = 'fa fa-exclamation-triangle';
            break;
        default:
            DOM.toast.classList.add('bg-gray-700');
            DOM.toastIcon.className = 'fa fa-info-circle';
    }
    
    // 显示提示框
    setTimeout(() => {
        DOM.toast.classList.remove('translate-y-20', 'opacity-0');
    }, 10);
    
    // 3秒后自动隐藏
    setTimeout(() => {
        DOM.toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

/**
 * 格式化日期
 */
function formatDate(date) {
    if (!date) return '';
    
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

/**
 * 格式化货币
 */
function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '¥0';
    return `¥${Number(amount).toLocaleString('zh-CN')}`;
}

/* ======================================================
   页面加载完成后初始化应用
   ====================================================== */

// 当DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);