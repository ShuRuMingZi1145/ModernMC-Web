document.addEventListener('DOMContentLoaded', function () {
  // 复制 IP
  var copyBtn = document.getElementById('copyBtn');
  var ipEl = document.getElementById('serverIp');
  var toast = document.getElementById('copyToast');
  var ip = ipEl.textContent;

  function copyIp() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(ip).then(function () {
        showToast();
      }).catch(function () {
        fallbackCopy();
      });
    } else {
      fallbackCopy();
    }
  }

  function fallbackCopy() {
    var ta = document.createElement('textarea');
    ta.value = ip;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast();
  }

  function showToast() {
    toast.classList.add('show');
    setTimeout(function () {
      toast.classList.remove('show');
    }, 1800);
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', copyIp);
  }

  // 加入游戏按钮
  var joinBtn = document.getElementById('joinBtn');
  if (joinBtn) {
    joinBtn.addEventListener('click', function () {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(ip).then(function () {
          alert('服务器地址已复制: ' + ip + '\n\n打开 Minecraft -> 多人游戏 -> 添加服务器，粘贴即可加入！');
        });
      } else {
        alert('服务器地址: ' + ip + '\n\n请手动复制加入游戏。');
      }
    });
  }

  // 复制 IP 按钮（hero 区）
  var copyIpBtn = document.getElementById('copyIpBtn');
  if (copyIpBtn) {
    copyIpBtn.addEventListener('click', copyIp);
  }

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
