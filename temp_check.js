import fs from 'fs';
fetch('https://cu-harvest.vercel.app/assets/index-BmqxVM-u.js')
  .then(r => r.text())
  .then(t => {
    const urls = t.match(/https?:\/\/[^\s"']+/g) || [];
    const relevant = urls.filter(u => u.includes('api') || u.includes('5001') || u.includes('onrender') || u.includes('backend'));
    fs.writeFileSync('c:\\Users\\molli\\Downloads\\cu-harvest (1)\\urls.txt', [...new Set(relevant)].join('\n'));
  });
