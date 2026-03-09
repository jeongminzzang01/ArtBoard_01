#!/bin/bash
# Read art_schedule, remove import lines, change export default function to function
ART=$(sed '/^import /d; s/^export default function/function/' proj/art_schedule)

# 1) Build temp JSX file
cat > _tmp_jsx.js << 'JSXHEADER'
const { useState, useCallback, useRef, useEffect, useMemo } = React;
JSXHEADER

echo "$ART" >> _tmp_jsx.js
echo "" >> _tmp_jsx.js
echo 'ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App, null));' >> _tmp_jsx.js

# 2) Babel: JSX + preset-env → plain JS
npx babel _tmp_jsx.js --presets=@babel/preset-env --plugins=@babel/plugin-transform-react-jsx --no-babelrc -o _tmp_compiled.js 2>&1
if [ $? -ne 0 ]; then
  echo "Babel compile failed!"
  rm -f _tmp_jsx.js _tmp_compiled.js
  exit 1
fi

# 3) Ensure public dir exists
mkdir -p public

# 4) Assemble public/index.html
cat > public/index.html << 'HEADER'
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>NC 아트실 일정</title>
<script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js"></script>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
html, body, #root { height:100%; overflow:hidden; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
::-webkit-scrollbar { width:8px; height:8px; }
::-webkit-scrollbar-track { background:transparent; }
::-webkit-scrollbar-thumb { background:#555; border-radius:4px; }
input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.7); cursor: pointer; }
</style>
</head>
<body>
<div id="root"></div>
<script>
window.onerror = function(msg, src, line, col, err) {
  document.body.innerHTML = '<pre style="color:red;padding:20px;font-size:14px;">JS Error\n' + msg + '\nLine: ' + line + ', Col: ' + col + '\n' + (err && err.stack ? err.stack : '') + '</pre>';
};
</script>
<script>
HEADER

cat _tmp_compiled.js >> public/index.html

cat >> public/index.html << 'FOOTER'
</script>
</body>
</html>
FOOTER

# 5) Cleanup temp files
rm -f _tmp_jsx.js _tmp_compiled.js

echo "Done. Lines: $(wc -l < public/index.html)"
