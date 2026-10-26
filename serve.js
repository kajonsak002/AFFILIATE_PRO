import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const port = 45678;

const mockStorageData = {
  settings: {
    apiKey: 'sk-09f438f25bc24a05a38a37203c904662',
    engine: 'flow',
    videoDuration: '8 วินาที',
    lockProductReference: true,
    autoPost: true,
    pinProduct: true,
    enableAiDisclosure: true,
    intervalHours: 2
  },
  queueItems: [
    {
      id: 'q_1',
      product: {
        id: '1734082754881488214',
        title: 'LUPEFOTO ลิปทินท์ เนื้อแมตต์นุ่ม ไม่ทำให้ปากแห้ง',
        price: '฿159.00',
        cover: 'https://p16-oec-va.ibyteimg.com/tos-maliva-i-o3syd03w52-us/5e173262f03f4aaeb7d391f6bb611bc5~tplv-o3syd03w52-resize-jpeg:800:800.jpeg',
        shop: 'LUPEFOTO Official Shop'
      },
      mode: { id: 'warehouse_clearance', title: 'โกดัง ลดล้างสต๊อก', badge: 'ขายดีสุด', color: '#f59e0b' },
      clipsCount: 2,
      completedClips: 1,
      engine: 'flow',
      videoDuration: '8 วินาที',
      lockProductReference: true,
      autoPost: true,
      pinProduct: true,
      enableAiDisclosure: true,
      isScheduled: true,
      status: 'running'
    },
    {
      id: 'q_2',
      product: {
        id: '1734082754881488215',
        title: 'เซรั่มบำรุงผิวหน้าไฮยา ชุ่มชื้นยาวนาน สูตรอ่อนโยน',
        price: '฿290.00',
        cover: 'https://p16-oec-va.ibyteimg.com/tos-maliva-i-o3syd03w52-us/5e173262f03f4aaeb7d391f6bb611bc5~tplv-o3syd03w52-resize-jpeg:800:800.jpeg',
        shop: 'Skincare Beauty Thailand'
      },
      mode: { id: 'ugc_real_review', title: 'UGC สมจริง รีวิวผู้ใช้จริง', badge: 'สร้างความเชื่อใจ', color: '#10b981' },
      clipsCount: 1,
      completedClips: 0,
      engine: 'flow',
      videoDuration: '10 วินาที',
      lockProductReference: true,
      autoPost: true,
      pinProduct: true,
      enableAiDisclosure: true,
      isScheduled: true,
      status: 'pending'
    }
  ],
  queueState: {
    running: true,
    currentItemId: 'q_1',
    currentClip: 1,
    totalClips: 2,
    status: 'running_flow',
    message: '[คิว 1/2] LUPEFOTO ลิปทินท์... (คลิปที่ 1/2) — กำลังสร้างภาพและวิดีโอใน Google Flow (8 วินาที, ล็อกภาพ 100%)...'
  }
};

const mockScript = `
<script>
window.chrome = window.chrome || {};
window.chrome.storage = {
  local: {
    get: function(keys, cb) {
      const data = ${JSON.stringify(mockStorageData)};
      if (typeof keys === 'string') {
        const res = {}; res[keys] = data[keys]; if (cb) cb(res); return Promise.resolve(res);
      }
      if (Array.isArray(keys)) {
        const res = {}; keys.forEach(k => { res[k] = data[k]; }); if (cb) cb(res); return Promise.resolve(res);
      }
      if (cb) cb(data); return Promise.resolve(data);
    },
    set: function(obj, cb) { if (cb) cb(); return Promise.resolve(); }
  },
  onChanged: { addListener: function(){}, removeListener: function(){} }
};
</script>
`;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/sidepanel.html';
  const filePath = path.join(distDir, reqPath);

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*'
  });

  if (ext === '.html') {
    let html = fs.readFileSync(filePath, 'utf8');
    html = html.replace('<head>', '<head>' + mockScript);
    res.end(html);
  } else {
    fs.createReadStream(filePath).pipe(res);
  }
});

server.listen(port, () => {
  console.log(`Server running with mock data at http://localhost:${port}/sidepanel.html`);
});
