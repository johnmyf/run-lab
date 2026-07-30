# Cloudflare Pages SPA 回退规则：所有路径请求都返回 index.html
# 解决刷新子页面时 404 的问题
echo '/* /index.html 200' > dist/build/h5/_redirects

npx wrangler pages deploy dist/build/h5 #--project-name run-lab
