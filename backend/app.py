import os 
import sys
import asyncio
import requests
import time
from bs4 import BeautifulSoup
import json
from typing import List, Dict, Any, Generator
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage
from langchain_tavily import TavilySearch
from tavily import TavilyClient
from langchain.agents import initialize_agent, Tool
from langchain_core.tools import tool
from langchain.schema import HumanMessage
from langgraph.prebuilt import create_react_agent
from langchain_community.chat_models.tongyi import ChatTongyi
from langgraph.checkpoint.memory import MemorySaver
import os
from dotenv import load_dotenv





# 加载环境变量
load_dotenv()

# 初始化模型
llm = ChatTongyi(api_key=os.getenv("DASHSCOPE_API_KEY"), model_name="qwen-max")
tavily_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

@tool
def read_doc_file(file_path: str):
    """读取用户当前观看文档的完整路径。"""
    import os
    import urllib.parse
    
    # URL 解码
    try:
        decoded_path = urllib.parse.unquote(file_path)
    except Exception as e:
        print(f"URL解码失败: {e}")
        decoded_path = file_path
    
    # 去除首尾空格
    decoded_path = decoded_path.strip()
    
    # 处理不同的路径格式，提取实际文档路径
    if decoded_path.startswith('/docs/'):
        doc_path = decoded_path[6:]  # 去掉 '/docs/'
    elif decoded_path.startswith('docs/'):
        doc_path = decoded_path[5:]  # 去掉 'docs/'
    else:
        doc_path = decoded_path  # 直接是文件名
    
    # 去除可能的尾部斜杠
    doc_path = doc_path.rstrip('/')
    
    # 构建完整路径
    full_path = "../docs/" + doc_path
    # 如果没有扩展名，添加 .md
    if not full_path.endswith('.md'):
        full_path += '.md'
    
    print(f"当前用户浏览的文档完整路径：{full_path}")
    
    try:
        with open(full_path, "r") as f:
            content = f.read()
            return f"文件内容：\n\n{content}"
    except FileNotFoundError:
        return f"文件未找到：{full_path}"
    except Exception as e:
        return f"读取文件时出错：{str(e)}"

@tool
def write_file(file_name: str, content: str):
    """创建或修改Markdown文件"""
    import os
    import threading
    import time
    
    try:
        # 确保文件名有.md扩展名
        if not file_name.endswith('.md'):
            file_name += '.md'
        
        # 创建临时目录
        temp_dir = "../temp_docs"
        if not os.path.exists(temp_dir):
            os.makedirs(temp_dir, exist_ok=True)
        
        # 先写入临时目录
        temp_path = os.path.join(temp_dir, file_name)
        
        # 确保临时目录的子目录存在
        temp_dir_path = os.path.dirname(temp_path)
        if temp_dir_path and temp_dir_path != temp_dir and not os.path.exists(temp_dir_path):
            os.makedirs(temp_dir_path, exist_ok=True)
            print(f"📁 创建临时目录: {temp_dir_path}")
        
        # 写入临时文件
        with open(temp_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"📝 文件已写入临时目录: {temp_path}")
        
        # 定义延迟移动函数
        def delayed_move():
            try:
                # 等待8秒，确保AI回复完成
                time.sleep(8)
                
                # 构建最终路径
                final_path = os.path.join("../docs", file_name)
                final_dir_path = os.path.dirname(final_path)
                
                # 确保最终目录存在
                if final_dir_path and not os.path.exists(final_dir_path):
                    os.makedirs(final_dir_path, exist_ok=True)
                    print(f"📁 创建最终目录: {final_dir_path}")
                
                # 移动文件到最终位置
                import shutil
                shutil.move(temp_path, final_path)
                print(f"✅ 文件已移动到最终位置: {final_path}")
                
            except Exception as e:
                print(f"❌ 延迟移动文件时出错: {str(e)}")
        
        # 启动后台线程进行延迟移动
        move_thread = threading.Thread(target=delayed_move, daemon=True)
        move_thread.start()
        
        # 立即返回成功信息（此时文件还在临时目录）
        final_path = os.path.join("../docs", file_name)
        temp_file_size = os.path.getsize(temp_path)
        
        return f"✅ 文件创建成功！\n📄 文件名: {file_name}\n📍 路径: {final_path}\n📊 大小: {temp_file_size} 字节\n💾 编码: UTF-8\n\n💡 提示：文件将在几秒后出现在文档目录中，避免打断当前对话。"
        
    except PermissionError:
        return f"❌ 权限错误：无法写入文件 {file_name}，请检查文件权限"
    except FileNotFoundError:
        return f"❌ 路径错误：目标目录不存在，无法创建文件 {file_name}"
    except UnicodeEncodeError:
        return f"❌ 编码错误：文件内容包含无法编码的字符"
    except Exception as e:
        return f"❌ 写入文件时发生错误：{str(e)}"


@tool
def extract_webpage_content(url):
    """
    提取网页内容的工具函数
    """
    try:
        # 设置请求头
        headers = {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            'Connection': 'keep-alive'
        }
        
        # 发送请求
        response = requests.get(url, headers=headers, allow_redirects=True, timeout=15)
        response.raise_for_status()
        
        # 解析HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 移除无用标签
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()
        
        # 提取文本内容
        text_content = soup.get_text()
        lines = (line.strip() for line in text_content.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        content = ' '.join(chunk for chunk in chunks if chunk)
        
        return content
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'url': url
        }


search = TavilySearch(max_results=2)

# 初始化内存和工具
memory = MemorySaver()

# 更新提示词，减少对页面上下文的过度关注
prompt = """
你是一个友好、智能的AI助手，可以帮助用户解决各种问题。

你具备以下能力：
1. 📚 读取和分析文档内容（当用户需要时）
2. ✍️ 创建和修改文件（当用户需要时）
3. 🌐 提取和分析网页内容（当用户询问某个网址的内容时）
4. 🔍 搜索互联网信息
5. 💬 进行自然、友好的对话
6. 💡 提供有用的建议和信息

请自然地与用户对话，根据用户的具体需求来决定是否使用工具：
- 只有当用户明确询问文档内容或需要查看特定文件时，才使用 read_doc_file 工具
- 只有当用户明确要求创建或修改文件时，才使用 write_file 工具
- 当用户询问某个具体网址的内容时，使用 extract_webpage_content 工具
- 当用户需要搜索信息时，使用 search 工具
- 对于一般性的问候、闲聊或咨询，请直接友好地回应

保持对话自然流畅，不要主动提及技术细节或页面信息，除非用户特别询问。
"""

tools = [read_doc_file, write_file, search, extract_webpage_content]
agent = create_react_agent(llm, tools, checkpointer=memory, prompt=prompt)

# 全局配置
config = {"configurable": {"thread_id": "unique_thread_id"}}

from typing import List, Dict

class WebsiteAgent:
    """网站智能助手包装类"""
    
    def __init__(self):
        """
        初始化智能助手
        
        Args:
            agent: 智能助手实例
            config: 配置对象
        """
        self.agent = agent
        self.config = config
    
    async def chat_stream_async(self, messages: List[Dict], page_path: str = None):
        """异步流式聊天接口"""
        try:
            # 检查消息列表是否为空
            if not messages:
                error_msg = "❌ 消息列表为空"
                print(error_msg)
                yield error_msg
                return
            
            # 准备用户输入
            user_input = messages[-1]["content"]
            
            if page_path:
                context_info = f"\n\n当前用户浏览的文档路径：{page_path}"
                user_input_with_context = user_input + context_info
            else:
                user_input_with_context = user_input
            
            # 记录请求信息
            print(f"🤖 Agent 处理请求：{user_input[:50]}...")
            
            if page_path:
                print(f"📍 文档路径：{page_path}")
    
            input_message = {
                "role": "user",
                "content": user_input_with_context,
            }
    
            print("🔄 开始流式处理...")
            has_output = False
            tool_called = set()  # 记录已调用的工具，避免重复提示
            
            async for chunk_data in self.agent.astream(
                {"messages": [input_message]}, 
                self.config,
                stream_mode="messages"
            ):
                try:
                    # chunk_data 是一个元组：(message, metadata)
                    if isinstance(chunk_data, tuple) and len(chunk_data) == 2:
                        message, metadata = chunk_data
                        print(f"📦 收到消息: {type(message).__name__}, 元数据: {metadata.get('langgraph_node', 'unknown')}")
                    else:
                        # 如果不是元组，直接当作消息处理
                        message = chunk_data
                        print(f"📦 收到消息: {type(message).__name__}")
                    
                    message_type = type(message).__name__


                    # 处理AI消息 - 包括AIMessage和AIMessageChunk
                    if message_type in ["AIMessage", "AIMessageChunk"]:
                        if hasattr(message, 'content') and message.content:
                            print(f"📤 AI回复内容: {repr(message.content)}")
                            yield message.content
                            has_output = True
                        else:
                            print(f"📤 AI消息无内容: {message}")
                    
                    # 静默处理工具调用 - 不输出任何信息
                    if hasattr(message, 'tool_calls') and message.tool_calls:
                        for tool_call in message.tool_calls:
                            tool_name = tool_call.get('name', '未知工具')
                            print(f"🔧 工具调用: {tool_name} (静默处理)")
                    
                    # 静默跳过工具调用结果
                    if message_type == "ToolMessage":
                        print(f"🔧 工具调用完成 (静默跳过)")
                        continue
                    
                    # 静默跳过无效的工具调用片段
                    if hasattr(message, 'invalid_tool_calls') and message.invalid_tool_calls:
                        print("⏭️ 跳过无效工具调用片段 (静默)")
                        continue
                    
                except Exception as chunk_error:
                    # 处理单个chunk的错误，但不中断整个流程
                    print(f"⚠️ 处理chunk时出错: {chunk_error}")
                    continue
            
            print("✅ 流式处理完成")
            
            # 如果没有输出，提供默认响应
            if not has_output:
                print("⚠️ 没有收到任何有效输出，提供默认响应")
                default_response = "你好！我收到了你的消息。有什么可以帮助你的吗？"
                yield default_response
                
        except Exception as e:
            error_msg = f"❌ Agent 执行错误：{str(e)}"
            print(error_msg)
            import traceback
            print(f"🔍 详细错误信息：{traceback.format_exc()}")
            yield error_msg

    
    def chat_stream(self, messages: List[Dict], page_path: str = None) -> Generator[str, None, None]:
        """同步包装器"""
        print(f"🔄 chat_stream 接收到参数:")
        print(f"  - messages数量: {len(messages)}")
        print(f"  - page_path: {repr(page_path)}")
        
        import asyncio
        
        async def async_generator():
            async for chunk in self.chat_stream_async(messages, page_path):
                yield chunk
        
        # 运行异步生成器
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            async_gen = async_generator()
            while True:
                try:
                    chunk = loop.run_until_complete(async_gen.__anext__())
                    yield chunk
                except StopAsyncIteration:
                    break
        finally:
            loop.close()
    

# 全局 Agent 实例
_agent_instance = None

def get_agent_instance() -> WebsiteAgent:
    """获取 Agent 单例实例"""
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = WebsiteAgent()
    return _agent_instance

def chat_with_agent(messages: List[Dict], page_path: str = None) -> Generator[str, None, None]:
    """与 Agent 聊天的便捷接口"""
    print(f"🎯 chat_with_agent 接收到参数:")
    print(f"  - messages数量: {len(messages)}")
    print(f"  - page_path: {repr(page_path)}")
    
    agent_instance = get_agent_instance()
    return agent_instance.chat_stream(messages, page_path)

