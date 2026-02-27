#!/bin/bash
# Read init_data.js, remove export line
INIT=$(sed '/^export /d' init_data.js)
# Read update_data.js
UPDATE=$(cat update_data.js 2>/dev/null || echo "")
# Read art_schedule, remove import lines, change export default function to function
ART=$(sed '/^import /d; s/^export default function/function/' proj/art_schedule)

cat > index.html << 'HEADER'
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>NC 아트실 일정</title>
<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
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
<script type="text/babel">
const { useState, useCallback, useRef, useEffect, useMemo } = React;
HEADER

echo "$INIT" >> index.html
echo "" >> index.html
echo "$UPDATE" >> index.html
echo "" >> index.html
echo "$ART" >> index.html
echo "" >> index.html

cat >> index.html << 'FOOTER'
ReactDOM.createRoot(document.getElementById("root")).render(<ArtSchedule />);
</script>
</body>
</html>
FOOTER

echo "Done. Lines: $(wc -l < index.html)"
