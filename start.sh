#!/bin/bash

set -e  # 遇到错误立即退出

echo "🚀 启动智能网站服务..."

# 设置环境变量
echo "🔑 设置环境变量..."
# 从 .env 文件加载环境变量
if [ -f .env ]; then
    export $(cat .env | xargs)
    echo "✅ 环境变量从 .env 文件加载完成"
else
    echo "⚠️  未找到 .env 文件，请确保已创建"
fi
export TAVILY_API_KEY="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"
export DASHSCOPE_API_KEY="sk-f434639a7e1345ed99c660461d92389d"
echo "✅ 环境变量设置完成"

# 获取服务器IP地址
get_server_ip() {
    # 尝试获取公网IP
    PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "")
    
    # 获取局域网IP
    LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || ip route get 1 2>/dev/null | awk '{print $7}' || echo "localhost")
    
    echo "🌐 服务器网络信息:"
    echo "   本地IP: $LOCAL_IP"
    if [ -n "$PUBLIC_IP" ]; then
        echo "   公网IP: $PUBLIC_IP"
    fi
}

# 检测 Python 命令
PYTHON_CMD=""
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ 错误：未找到 Python 命令。请安装 Python 3。"
    exit 1
fi

echo "✅ 使用 Python 命令: $PYTHON_CMD"

# 检查 Node.js 和 npm
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未找到 Node.js。请安装 Node.js。"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ 错误：未找到 npm。请安装 npm。"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo "✅ npm 版本: $(npm --version)"

# 显示网络信息
get_server_ip

# 检查并创建虚拟环境
if [ ! -d "backend/venv" ]; then
    echo "📦 创建 Python 虚拟环境..."
    cd backend
    $PYTHON_CMD -m venv venv
    if [ $? -ne 0 ]; then
        echo "❌ 创建虚拟环境失败。"
        echo "💡 在 Ubuntu/Debian 上，请运行: sudo apt update && sudo apt install python3-venv python3-pip"
        echo "💡 在 CentOS/RHEL 上，请运行: sudo yum install python3-venv python3-pip"
        exit 1
    fi
    cd ..
    echo "✅ 虚拟环境创建成功"
fi

# 启动 Python 后端
echo "🐍 准备 Python 后端环境..."
cd backend

# 激活虚拟环境
source venv/bin/activate

# 确保环境变量在虚拟环境中可用
export TAVILY_API_KEY="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"
export DASHSCOPE_API_KEY="sk-f434639a7e1345ed99c660461d92389d"

# 升级 pip
echo "📦 升级 pip..."
pip install --upgrade pip

# 检查并安装 Python 依赖
echo "📦 检查 Python 依赖..."

# 读取 requirements.txt 中的所有包
missing_packages=()
while IFS= read -r line; do
    # 跳过空行和注释
    if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # 提取包名（去掉版本号）
    package_name=$(echo "$line" | sed 's/[>=<].*//' | sed 's/==.*//')
    
    # 检查包是否已安装
    if ! pip show "$package_name" > /dev/null 2>&1; then
        missing_packages+=("$package_name")
    fi
done < requirements.txt

# 如果有缺失的包，重新安装所有依赖
if [ ${#missing_packages[@]} -gt 0 ]; then
    echo "📦 发现缺失的包: ${missing_packages[*]}"
    echo "📦 安装 Python 依赖..."
    pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "❌ Python 依赖安装失败。请检查网络连接或手动安装。"
        echo "💡 尝试手动运行: cd backend && source venv/bin/activate && pip install -r requirements.txt"
        exit 1
    fi
    echo "✅ Python 依赖安装成功"
else
    echo "✅ Python 依赖已满足"
fi

# 验证关键依赖
echo "🔍 验证关键依赖..."
critical_imports=("flask" "langchain" "dashscope")
for import_name in "${critical_imports[@]}"; do
    if ! python -c "import $import_name" 2>/dev/null; then
        echo "❌ 关键依赖 $import_name 导入失败"
        exit 1
    fi
done
echo "✅ 关键依赖验证通过"

echo "🚀 启动微服务..."

# 启动 AI 聊天服务 (端口 5005)
echo "🤖 启动 AI 聊天服务..."
python ai_service.py &
AI_PID=$!

# 等待服务启动
sleep 2

# 检查 AI 服务健康状态
if curl -s http://localhost:5005/health > /dev/null; then
    echo "✅ AI 聊天服务启动成功"
else
    echo "⚠️  AI 聊天服务可能未完全启动，继续..."
fi

# 启动文件管理服务 (端口 5006)
echo "📁 启动文件管理服务..."
python file_service.py &
FILE_PID=$!

# 等待服务启动
sleep 2

# 检查文件服务健康状态
if curl -s http://localhost:5006/health > /dev/null; then
    echo "✅ 文件管理服务启动成功"
else
    echo "⚠️  文件管理服务可能未完全启动，继续..."
fi

# 准备前端环境
echo "🌐 准备前端环境..."
cd ..

# 检查并安装前端依赖
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    echo "📦 安装前端依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 前端依赖安装失败。请检查网络连接。"
        echo "💡 尝试手动运行: npm install"
        exit 1
    fi
    echo "✅ 前端依赖安装成功"
else
    echo "✅ 前端依赖已满足"
fi

# 检查并安装 react-markdown
echo "📦 检查 react-markdown 依赖..."
if ! npm list react-markdown > /dev/null 2>&1; then
    echo "📦 安装 react-markdown..."
    npm install react-markdown
    if [ $? -ne 0 ]; then
        echo "❌ react-markdown 安装失败。请检查网络连接。"
        echo "💡 尝试手动运行: npm install react-markdown"
        exit 1
    fi
    echo "✅ react-markdown 安装成功"
else
    echo "✅ react-markdown 已安装"
fi

# 启动前端
echo "🌐 启动前端服务..."
npm start -- --host 0.0.0.0 &
FRONTEND_PID=$!

# 等待前端启动
sleep 5

# 获取IP信息用于显示
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "")
LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || ip route get 1 2>/dev/null | awk '{print $7}' || echo "localhost")

echo ""
echo "🎉 所有服务启动完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 前端配置已设置为默认使用公网IP"
echo ""
echo "🤖 AI 聊天服务:"
echo "   └─ 本地访问:     http://localhost:5005"
echo "   └─ 局域网访问:   http://$LOCAL_IP:5005"
if [ -n "$PUBLIC_IP" ]; then
echo "   └─ 公网访问:     http://$PUBLIC_IP:5005"
fi
echo "   └─ 健康检查:     http://localhost:5005/health"
echo ""
echo "📁 文件管理服务:"
echo "   └─ 本地访问:     http://localhost:5006"
echo "   └─ 局域网访问:   http://$LOCAL_IP:5006"
if [ -n "$PUBLIC_IP" ]; then
echo "   └─ 公网访问:     http://$PUBLIC_IP:5006"
fi
echo "   └─ 健康检查:     http://localhost:5006/health"
echo ""
echo "🌐 前端网站:"
echo "   └─ 本地访问:     http://localhost:3000"
echo "   └─ 局域网访问:   http://$LOCAL_IP:3000"
if [ -n "$PUBLIC_IP" ]; then
echo "   └─ 公网访问:     http://$PUBLIC_IP:3000"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  重要提示:"
echo "   1. 前端已配置为默认使用公网IP（当前域名IP）"
echo "   2. 请确保服务器防火墙已开放端口 3000, 5005, 5006"
if [ -n "$PUBLIC_IP" ]; then
echo "   3. 如需手动设置IP，可在浏览器控制台执行: setServerIP('$PUBLIC_IP')"
else
echo "   3. 如需设置公网IP，可在浏览器控制台执行: setServerIP('你的公网IP')"
fi
echo ""
echo "按 Ctrl+C 停止所有服务"

# 设置信号处理
cleanup() {
    echo ""
    echo "🛑 正在停止所有服务..."
    kill $AI_PID $FILE_PID $FRONTEND_PID 2>/dev/null
    echo "✅ 所有服务已停止"
    exit 0
}

trap cleanup INT TERM

# 保持脚本运行
wait