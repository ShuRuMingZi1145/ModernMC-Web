document.addEventListener('DOMContentLoaded', function () {
  var ipEl = document.getElementById('serverIp');
  var fbIpEl = document.getElementById('fallbackIp');
  var ipBadge = document.getElementById('ipBadge');
  var activeIp = ipEl.textContent;

  function getIp() { return activeIp; }

  function copyIp(e) {
    var btn = e.currentTarget;
    doCopy(getIp(), function () {
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

  // 状态 & 峰值 & 在线率
  var statusDot = document.querySelector('.status-dot');
  var statusValue = document.querySelector('.status-item:first-child .status-value');
  var pingEl = document.getElementById('pingDisplay');
  var playerEl = document.getElementById('playerCount');
  var peakEl = document.getElementById('peakPlayers');
  var uptimeDaysEl = document.getElementById('uptimeDays');
  var uptimeRateEl = document.getElementById('uptimeRate');
  var lastGood = null;

  var peakKey = 'modernmc_peak_players';
  var uptimeKey = 'modernmc_uptime';
  var latencyKey = 'modernmc_latency';
  var avgLatencyEl = document.getElementById('avgLatency');

  // 运营历史：从 2026-07-01 算起
  var startDate = new Date(2026, 6, 1);

  function calcDays() {
    var diff = Date.now() - startDate.getTime();
    return Math.floor(diff / 86400000);
  }

  if (uptimeDaysEl) uptimeDaysEl.textContent = calcDays() + ' 天';

  function loadPeak() {
    try { return parseInt(localStorage.getItem(peakKey), 10) || 0; } catch (e) { return 0; }
  }

  function savePeak(val) {
    try { localStorage.setItem(peakKey, val); } catch (e) {}
  }

  function updatePeakDisplay(val) {
    if (peakEl) peakEl.textContent = val > 0 ? val : '--';
  }

  updatePeakDisplay(loadPeak());

  // 在线率追踪
  function loadUptime() {
    try { return JSON.parse(localStorage.getItem(uptimeKey)) || { total: 0, online: 0 }; } catch (e) { return { total: 0, online: 0 }; }
  }

  function saveUptime(u) {
    try { localStorage.setItem(uptimeKey, JSON.stringify(u)); } catch (e) {}
  }

  function updateUptimeDisplay(u) {
    if (uptimeRateEl) {
      if (u.total > 0) {
        var pct = (u.online / u.total * 100).toFixed(2);
        uptimeRateEl.textContent = pct + '%';
      } else {
        uptimeRateEl.textContent = '--';
      }
    }
  }

  var uptime = loadUptime();
  updateUptimeDisplay(uptime);

  // 平均延迟追踪
  function loadLatency() {
    try { return JSON.parse(localStorage.getItem(latencyKey)) || { sum: 0, count: 0 }; } catch (e) { return { sum: 0, count: 0 }; }
  }

  function saveLatency(l) {
    try { localStorage.setItem(latencyKey, JSON.stringify(l)); } catch (e) {}
  }

  function updateLatencyDisplay(l) {
    if (avgLatencyEl) {
      if (l.count > 0) {
        avgLatencyEl.textContent = Math.round(l.sum / l.count) + ' ms';
      } else {
        avgLatencyEl.textContent = '--';
      }
    }
  }

  var latencyData = loadLatency();
  updateLatencyDisplay(latencyData);

  function switchIp(newIp, showBadge) {
    activeIp = newIp;
    if (ipEl) {
      ipEl.textContent = newIp;
      ipEl.style.display = '';
    }
    if (fbIpEl) fbIpEl.style.display = 'none';
    if (ipBadge) ipBadge.style.display = showBadge ? '' : 'none';
  }

  function queryServer(addr) {
    var start = performance.now();
    return fetch('https://api.mcsrvstat.us/2/' + encodeURIComponent(addr) + '?_=' + Date.now(), {
      headers: { 'User-Agent': 'ModernMC-Website/1.0' }
    }).then(function (r) {
      return r.json().then(function (data) {
        data._latency = Math.round(performance.now() - start);
        return data;
      });
    });
  }

  function handleOnline(data) {
    lastGood = data;
    if (statusDot) {
      statusDot.style.background = '#4caf50';
      statusDot.style.boxShadow = '0 0 8px rgba(76, 175, 80, 0.5)';
    }
    if (statusValue) statusValue.textContent = '在线';
    if (pingEl) pingEl.textContent = (data._latency || '--') + ' ms';

    if (data._latency) {
      latencyData.sum += data._latency;
      latencyData.count++;
      saveLatency(latencyData);
      updateLatencyDisplay(latencyData);
    }

    uptime.total++;
    uptime.online++;
    saveUptime(uptime);
    updateUptimeDisplay(uptime);

    if (data.players) {
      if (playerEl) playerEl.textContent = data.players.online + ' / ' + data.players.max + ' 人';
      var current = loadPeak();
      if (data.players.online > current) {
        savePeak(data.players.online);
        updatePeakDisplay(data.players.online);
      }
    }
  }

  function handleOffline() {
    if (statusDot) {
      statusDot.style.background = '#e53935';
      statusDot.style.boxShadow = '0 0 8px rgba(229, 57, 53, 0.5)';
    }
    if (statusValue) statusValue.textContent = '离线';
    if (pingEl) pingEl.textContent = '-- ms';
    if (playerEl) playerEl.textContent = '--';

    uptime.total++;
    saveUptime(uptime);
    updateUptimeDisplay(uptime);
  }

  function fetchStatus() {
    queryServer('modernmc.srmz.cn')
      .then(function (data) {
        if (data.online) {
          handleOnline(data);
          switchIp('modernmc.srmz.cn', false);
        } else {
          return queryServer('47.92.28.8:56665')
            .then(function (fb) {
              if (fb.online) {
                handleOnline(fb);
                switchIp('47.92.28.8:56665', true);
              } else {
                handleOffline();
              }
            });
        }
      })
      .catch(function () {
        queryServer('47.92.28.8:56665')
          .then(function (fb) {
            if (fb.online) {
              handleOnline(fb);
              switchIp('47.92.28.8:56665', true);
            } else {
              handleOffline();
            }
          })
          .catch(function () {
            if (lastGood) return;
            if (statusDot) {
              statusDot.style.background = '#ff9800';
              statusDot.style.boxShadow = '0 0 8px rgba(255, 152, 0, 0.5)';
            }
            if (statusValue) statusValue.textContent = '查询超时';
          });
      });
  }

  fetchStatus();
  setInterval(fetchStatus, 300000);
});
