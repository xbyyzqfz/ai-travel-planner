// API配置文件 - 请根据实际情况填写您的API密钥
// 注意：请不要将包含真实密钥的文件提交到版本控制系统

const CONFIG = {
    // Supabase配置
    SUPABASE_URL: 'your-supabase-url',  // 替换为您的Supabase项目URL
    SUPABASE_KEY: 'your-supabase-key',  // 替换为您的Supabase匿名密钥
    
    // 地图API配置
    MAP_API_KEY: 'your-map-api-key',     // 替换为您的地图API密钥（如Mapbox）
    
    // 大语言模型API配置
    LLM_API_KEY: 'your-llm-api-key'      // 替换为您的大语言模型API密钥
};

// 导出配置（适用于ES模块）
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = CONFIG;
}