document.addEventListener('DOMContentLoaded', function () {
  var ipEl = document.getElementById('serverIp');
  var fbIpEl = document.getElementById('fallbackIp');
  var fbIp2El = document.getElementById('fallbackIp2');
  var ipBadge = document.getElementById('ipBadge');
  var activeIp = ipEl.textContent;

  function getIp() { return activeIp; }

  function copyIp(e) {
    doCopy(getIp(), function () {
      showFloatingToast(e.currentTarget, '✓ 已复制服务器地址');
    });
  }

  function doCopy(text, cb) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(cb).catch(function () { fallbackCopy(text, cb); });
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
    requestAnimationFrame(function () { toast.classList.add('show'); });
    setTimeout(function () {
      toast.classList.remove('show');
      setTimeout(function () { toast.remove(); }, 300);
    }, 1600);
  }

  document.getElementById('copyBtn').addEventListener('click', copyIp);
  document.getElementById('copyIpBtn').addEventListener('click', copyIp);

  var statusDot = document.querySelector('.status-dot');
  var statusValue = document.querySelector('.status-item:first-child .status-value');
  var pingEl = document.getElementById('pingDisplay');
  var playerEl = document.getElementById('playerCount');
  var peakEl = document.getElementById('peakPlayers');
  var uptimeDaysEl = document.getElementById('uptimeDays');
  var uptimeRateEl = document.getElementById('uptimeRate');
  var avgLatencyEl = document.getElementById('avgLatency');

  var startDate = new Date(2026, 1, 27);
  if (uptimeDaysEl) uptimeDaysEl.textContent = Math.floor((Date.now() - startDate.getTime()) / 86400000) + ' 天';

  function switchIp(newIp, showBadge) {
    activeIp = newIp;
    if (ipEl) { ipEl.textContent = newIp; ipEl.style.display = ''; }
    if (fbIpEl) fbIpEl.style.display = 'none';
    if (fbIp2El) fbIp2El.style.display = 'none';
    if (ipBadge) ipBadge.style.display = showBadge ? '' : 'none';
  }

  function fetchStatus() {
    fetch('/api/status')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.online) {
          if (statusDot) {
            statusDot.style.background = '#4caf50';
            statusDot.style.boxShadow = '0 0 8px rgba(76, 175, 80, 0.5)';
          }
          if (statusValue) statusValue.textContent = '在线';
          if (pingEl) pingEl.textContent = (data.latency || '--') + ' ms';
          if (data.players) {
            if (playerEl) playerEl.textContent = data.players.online + ' / ' + data.players.max + ' 人';
          }
          if (peakEl) peakEl.textContent = data.peakPlayers || '--';
          if (uptimeRateEl) uptimeRateEl.textContent = data.uptimeRate ? data.uptimeRate + '%' : '--';
          if (avgLatencyEl) avgLatencyEl.textContent = data.avgLatency ? data.avgLatency + ' ms' : '--';
          switchIp(data.ip, data.ip !== 'modernmc.srmz.cn');
        } else {
          if (statusDot) {
            statusDot.style.background = '#e53935';
            statusDot.style.boxShadow = '0 0 8px rgba(229, 57, 53, 0.5)';
          }
          if (statusValue) statusValue.textContent = '离线';
          if (pingEl) pingEl.textContent = '-- ms';
          if (playerEl) playerEl.textContent = '--';
          if (uptimeRateEl) uptimeRateEl.textContent = data.uptimeRate ? data.uptimeRate + '%' : '--';
          if (avgLatencyEl) avgLatencyEl.textContent = data.avgLatency ? data.avgLatency + ' ms' : '--';
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
  setInterval(fetchStatus, 300000);
});
