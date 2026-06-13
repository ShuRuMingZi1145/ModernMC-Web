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

  // 实时服务器状态
  var statusDot = document.querySelector('.status-dot');
  var statusValue = document.querySelector('.status-item:first-child .status-value');
  var pingEl = document.getElementById('pingDisplay');
  var playerEl = document.getElementById('playerCount');

  function fetchStatus() {
    fetch('https://api.mcsrvstat.us/3/modernmc.srmz.cn')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.online) {
          if (statusDot) {
            statusDot.style.background = '#4caf50';
            statusDot.style.boxShadow = '0 0 8px rgba(76, 175, 80, 0.5)';
          }
          if (statusValue) statusValue.textContent = '在线';

          if (data.players && playerEl) {
            playerEl.textContent = data.players.online + ' / ' + data.players.max + ' 人';
          }

          if (data.debug && data.debug.ping && pingEl) {
            pingEl.textContent = data.debug.ping + ' ms';
          } else if (pingEl) {
            pingEl.textContent = '-- ms';
          }
        } else {
          if (statusDot) {
            statusDot.style.background = '#e53935';
            statusDot.style.boxShadow = '0 0 8px rgba(229, 57, 53, 0.5)';
          }
          if (statusValue) statusValue.textContent = '离线';
          if (pingEl) pingEl.textContent = '-- ms';
          if (playerEl) playerEl.textContent = '--';
        }
      })
      .catch(function () {
        if (statusDot) {
          statusDot.style.background = '#ff9800';
          statusDot.style.boxShadow = '0 0 8px rgba(255, 152, 0, 0.5)';
        }
        if (statusValue) statusValue.textContent = '查询超时';
      });
  }

  fetchStatus();
  setInterval(fetchStatus, 60000);
});
