#!/bin/bash
# Cloudflare Pages 部署前准备：修复 SPA 路由问题
# 在 npm run build:h5 之后自动执行（通过 postbuild:h5 hook）

BUILD_DIR=dist/build/h5

if [ ! -d "$BUILD_DIR" ]; then
  echo "错误：构建目录 $BUILD_DIR 不存在，请先运行 npm run build:h5"
  exit 1
fi

# === fix1: SPA 回退规则 ===
# 所有路径请求返回 index.html，解决刷新子页面 404
echo '/* /index.html 200' > "$BUILD_DIR/_redirects"
echo "✓ 已创建 _redirects（SPA 回退规则）"

# === fix2: uni-app 路由路径修复 ===
# Cloudflare Pages 内置 308 重定向 /pages/xxx/index → /pages/xxx/
# 注入脚本在 uni-app 初始化前将路径恢复为路由所需格式
python3 -c "
with open('$BUILD_DIR/index.html', 'r') as f:
    content = f.read()

script = '''<script>
(function(){
  var path = window.location.pathname.replace(/\\/$/, '');
  var parts = path.split('/').filter(Boolean);
  if (parts.length === 2 && parts[0] === 'pages') {
    window.history.replaceState(null, '', '/' + parts.join('/') + '/index');
  }
})();
</script>
'''
content = content.replace('<!--preload-links-->', script + '<!--preload-links-->')
with open('$BUILD_DIR/index.html', 'w') as f:
    f.write(content)
"
echo "✓ 已注入路由路径修复脚本"
echo "✓ 部署准备完成"
