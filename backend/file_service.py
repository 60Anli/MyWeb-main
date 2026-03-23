from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import shutil
from pathlib import Path

app = Flask(__name__)
CORS(app)  # 允许前端跨域请求

# 文件管理配置
DOCS_ROOT = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'docs')
BLOG_ROOT = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'blog')

def is_safe_path(root_path, user_path):
    """检查路径是否安全，防止目录遍历攻击"""
    try:
        # 规范化路径
        safe_root = os.path.realpath(root_path)
        safe_path = os.path.realpath(os.path.join(root_path, user_path))
        
        # 检查是否在允许的根目录下
        return safe_path.startswith(safe_root)
    except:
        return False

def build_file_tree(root_path, current_path=""):
    """构建文件树结构"""
    tree = []
    try:
        full_path = os.path.join(root_path, current_path) if current_path else root_path
        
        if not os.path.exists(full_path):
            return tree
        
        for item in sorted(os.listdir(full_path)):
            if item.startswith('.'):  # 跳过隐藏文件
                continue
                
            item_path = os.path.join(current_path, item) if current_path else item
            full_item_path = os.path.join(full_path, item)
            
            if os.path.isdir(full_item_path):
                tree.append({
                    'name': item,
                    'path': item_path,
                    'type': 'folder',
                    'children': build_file_tree(root_path, item_path)
                })
            else:
                tree.append({
                    'name': item,
                    'path': item_path,
                    'type': 'file'
                })
    except Exception as e:
        print(f"Error building tree for {full_path}: {e}")
    
    return tree

@app.route('/api/files/tree', methods=['GET'])
def get_file_tree():
    """获取文件树"""
    try:
        workspace = request.args.get('workspace', 'docs')
        root_path = DOCS_ROOT if workspace == 'docs' else BLOG_ROOT
        
        # 确保目录存在
        os.makedirs(root_path, exist_ok=True)
        
        tree = build_file_tree(root_path)
        
        return jsonify({
            'success': True,
            'tree': tree,
            'workspace': workspace
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/files/read', methods=['POST'])
def read_file():
    """读取文件内容"""
    try:
        data = request.json
        workspace = data.get('workspace', 'docs')
        file_path = data.get('path', '')
        
        root_path = DOCS_ROOT if workspace == 'docs' else BLOG_ROOT
        
        if not is_safe_path(root_path, file_path):
            return jsonify({
                'success': False,
                'error': '非法的文件路径'
            }), 400
        
        full_path = os.path.join(root_path, file_path)
        
        if not os.path.exists(full_path) or not os.path.isfile(full_path):
            return jsonify({
                'success': False,
                'error': '文件不存在'
            }), 404
        
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return jsonify({
            'success': True,
            'content': content,
            'path': file_path
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/files/write', methods=['POST'])
def write_file():
    """写入文件内容"""
    try:
        data = request.json
        workspace = data.get('workspace', 'docs')
        file_path = data.get('path', '')
        content = data.get('content', '')
        
        root_path = DOCS_ROOT if workspace == 'docs' else BLOG_ROOT
        
        if not is_safe_path(root_path, file_path):
            return jsonify({
                'success': False,
                'error': '非法的文件路径'
            }), 400
        
        full_path = os.path.join(root_path, file_path)
        
        # 确保目录存在
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return jsonify({
            'success': True,
            'message': '文件保存成功',
            'path': file_path
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/files/create', methods=['POST'])
def create_file_or_folder():
    """创建文件或文件夹"""
    try:
        data = request.json
        workspace = data.get('workspace', 'docs')
        file_path = data.get('path', '')
        file_type = data.get('type', 'file')  # 'file' or 'folder'
        content = data.get('content', '')
        
        root_path = DOCS_ROOT if workspace == 'docs' else BLOG_ROOT
        
        if not is_safe_path(root_path, file_path):
            return jsonify({
                'success': False,
                'error': '非法的文件路径'
            }), 400
        
        full_path = os.path.join(root_path, file_path)
        
        if os.path.exists(full_path):
            return jsonify({
                'success': False,
                'error': '文件或文件夹已存在'
            }), 400
        
        if file_type == 'folder':
            os.makedirs(full_path, exist_ok=True)
            message = '文件夹创建成功'
        else:
            # 确保目录存在
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            message = '文件创建成功'
        
        return jsonify({
            'success': True,
            'message': message,
            'path': file_path
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/files/delete', methods=['POST'])
def delete_file_or_folder():
    """删除文件或文件夹"""
    try:
        data = request.json
        workspace = data.get('workspace', 'docs')
        file_path = data.get('path', '')
        
        root_path = DOCS_ROOT if workspace == 'docs' else BLOG_ROOT
        
        if not is_safe_path(root_path, file_path):
            return jsonify({
                'success': False,
                'error': '非法的文件路径'
            }), 400
        
        full_path = os.path.join(root_path, file_path)
        
        if not os.path.exists(full_path):
            return jsonify({
                'success': False,
                'error': '文件或文件夹不存在'
            }), 404
        
        if os.path.isdir(full_path):
            shutil.rmtree(full_path)
            message = '文件夹删除成功'
        else:
            os.remove(full_path)
            message = '文件删除成功'
        
        return jsonify({
            'success': True,
            'message': message,
            'path': file_path
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/files/rename', methods=['POST'])
def rename_file_or_folder():
    """重命名文件或文件夹"""
    try:
        data = request.json
        workspace = data.get('workspace', 'docs')
        old_path = data.get('oldPath', '')
        new_path = data.get('newPath', '')
        
        root_path = DOCS_ROOT if workspace == 'docs' else BLOG_ROOT
        
        if not is_safe_path(root_path, old_path) or not is_safe_path(root_path, new_path):
            return jsonify({
                'success': False,
                'error': '非法的文件路径'
            }), 400
        
        old_full_path = os.path.join(root_path, old_path)
        new_full_path = os.path.join(root_path, new_path)
        
        if not os.path.exists(old_full_path):
            return jsonify({
                'success': False,
                'error': '源文件或文件夹不存在'
            }), 404
        
        if os.path.exists(new_full_path):
            return jsonify({
                'success': False,
                'error': '目标文件或文件夹已存在'
            }), 400
        
        # 确保目标目录存在
        os.makedirs(os.path.dirname(new_full_path), exist_ok=True)
        
        os.rename(old_full_path, new_full_path)
        
        return jsonify({
            'success': True,
            'message': '重命名成功',
            'oldPath': old_path,
            'newPath': new_path
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({
        "service": "File Management Service",
        "status": "healthy",
        "port": 5006,
        "workspaces": ["docs", "blog"]
    })

if __name__ == '__main__':
    print("📁 文件管理服务启动中...")
    print("📍 服务地址: http://localhost:5006")
    print("🔧 功能: 文件管理、CRUD 操作")
    app.run(debug=True, host='0.0.0.0', port=5006)