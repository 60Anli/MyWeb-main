from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import json
import datetime
import os
from typing import List, Dict, Any, Generator

# 🎯 导入我们的 Agent
from app import chat_with_agent, get_agent_instance

app = Flask(__name__)
CORS(app)  # 允许前端跨域请求



def build_system_prompt(pagePath):
    """根据页面路径构建系统提示（保留用于兼容性）"""
    prompt = "你是一个专业的前端开发助手，你的任务是根据用户的问题和页面路径，提供专业的前端开发建议。\n\n"
    prompt += "当前页面路径：\n"
    prompt += pagePath if pagePath else "未知页面"
    prompt += "\n\n用户问题：\n"
    return prompt

@app.route('/api/chat', methods=['POST'])
def chat():
    """流式聊天接口"""
    try:
        data = request.json
        messages = data.get('messages', [])
        pagePath = data.get('pagePath')  # 🔑 统一字段名为pagePath
        
        print(f"🔍 接收到的请求数据:")
        print(f"  - messages数量: {len(messages)}")
        print(f"  - pagePath: {repr(pagePath)}")  # 使用repr显示更详细信息
        print(f"  - pagePath类型: {type(pagePath)}")
        print(f"  - pagePath是否为None: {pagePath is None}")
        print(f"  - pagePath是否为空字符串: {pagePath == ''}")
        
        def generate():
            try:
                print(f"🚀 调用call_ai_stream，传递pagePath: {repr(pagePath)}")
                for chunk in call_ai_stream(messages, pagePath):  # 传递pagePath
                    # 确保每个chunk都是字符串格式
                    if chunk:
                        yield f"data: {json.dumps({'content': chunk})}\n\n"
                yield "data: [DONE]\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        return Response(
            generate(),
            mimetype='text/event-stream',  # ✅ 修复：使用正确的MIME类型
            headers={
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'X-Accel-Buffering': 'no',  # ✅ 禁用nginx缓冲
            }
        )
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

def call_ai_stream(messages, pagePath):
    """调用 Agent - 流式版本"""
    try:
        # 🎯 使用我们构建的 Agent 替代原生 API 调用
        print(f"🔄 call_ai_stream 接收到参数:")
        print(f"  - messages数量: {len(messages)}")
        print(f"  - pagePath: {repr(pagePath)}")
        
        # 记录页面路径信息（用于调试）
        if pagePath:
            print(f"📄 用户页面路径：{pagePath}")
        else:
            print(f"⚠️ 没有接收到页面路径信息")
        
        # 调用 app.py 中的 Agent
        print(f"🎯 调用chat_with_agent，传递pagePath: {repr(pagePath)}")
        for chunk in chat_with_agent(messages, pagePath):
            yield chunk
            
    except Exception as e:
        error_msg = f"❌ Agent 调用失败：{str(e)}"
        print(error_msg)
        yield error_msg


@app.route('/api/status', methods=['GET'])
def status():
    """获取 Agent 状态"""
    try:
        agent_instance = get_agent_instance()
        response_data = {
            "provider": "LangGraph Agent + 通义千问",
            "configured": True,
            "agent_type": "LangGraph ReAct Agent",
            "tools_count": len(agent_instance.agent.tools) if hasattr(agent_instance.agent, 'tools') else 3,
            "features": [
                "🤖 LangGraph Agent 智能对话",
                "📚 文档读取和分析",
                "✍️ 文件创建和修改", 
                "🔍 页面路径分析",
                "🌊 流式输出体验",
                "💾 对话记忆功能"
            ]
        }
        
        response = jsonify(response_data)
        # 添加防缓存头
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response
        
    except Exception as e:
        response_data = {
            "provider": "Agent 初始化失败",
            "configured": False,
            "error": str(e)
        }
        response = jsonify(response_data)
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response, 500

@app.route('/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({
        "service": "LangGraph AI Agent Service",
        "status": "healthy",
        "port": 5005,
        "architecture": "app.py (LangGraph Agent) + ai_service.py (Flask API)",
        "agent_status": "active"
    })

if __name__ == '__main__':
    print("🤖 LangGraph AI Agent 服务启动中...")
    print("📍 服务地址: http://localhost:5005")
    print("🏗️ 架构: app.py (LangGraph Agent) + ai_service.py (Flask API)")
    print("🔧 功能: 智能 Agent 对话 (流式) + 工具调用")
    print("🛠️ 工具: 文档读取、文件写入、页面分析")
    app.run(debug=True, host='0.0.0.0', port=5005)