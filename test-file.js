const fs = require('fs');
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
fs.writeFileSync('uploads/test.html', '<html><body><script>alert(1)</script></body></html>');
