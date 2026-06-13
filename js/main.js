document.addEventListener('DOMContentLoaded', function () {
  var ipEl = document.getElementById('serverIp');
  var ip = ipEl.textContent;

  function copyIp(e) {
    var btn = e.currentTarget;
    doCopy(ip, function () {
      showFloatingToast(btn, '✓ 已复制服务器地址');
    });
  }

  function doCopy(text, cb) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(cb).catch(function () {
        fallbackCopy(text, cb);
      });
    } else {
      fallbackCopy(text, cb);
    }
  }

  function fallbackCopy(text, cb) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    cb();
  }

  function showFloatingToast(anchor, msg) {
    var existing = document.querySelector('.float-toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'float-toast';
    toast.textContent = msg;

    var rect = anchor.getBoundingClientRect();
    toast.style.left = rect.left + rect.width / 2 + 'px';
    toast.style.top = rect.top - 12 + 'px';

    document.body.appendChild(toast);
    requestAnimationFrame(function () {
      toast.classList.add('show');
    });

    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () { toast.remove(); }, 300);
    }, 1600);
  }

  document.getElementById('copyBtn').addEventListener('click', copyIp);
  document.getElementById('copyIpBtn').addEventListener('click', copyIp);

  document.getElementById('joinBtn').addEventListener('click', function (e) {
    doCopy(ip, function () {
      showFloatingToast(e.currentTarget, '✓ 地址已复制，打开游戏加入吧！');
    });
  });

  // 模拟 ping 和在线人数
  var pingEl = document.getElementById('pingDisplay');
  var playerEl = document.getElementById('playerCount');
  if (pingEl && playerEl) {
    var pings = [12, 18, 24, 15, 21, 30, 16, 19, 22, 14];
    var players = [186, 203, 178, 215, 192, 168, 201, 188];
    pingEl.textContent = pings[Math.floor(Math.random() * pings.length)] + ' ms';
    playerEl.textContent = players[Math.floor(Math.random() * players.length)] + ' 人';
  }
});
