var FALLBACK_IPS = ['modernmc.srmz.cn', '60.18.74.126:56665', '47.92.28.8:56665'];
var API_TIMEOUT = 8000;

export async function onRequest(context) {
  var cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }

  var result = { online: false, ip: null, latency: null, players: null };

  try {
    result = await queryChain();
  } catch (_) {}

  var stats = {
    online: result.online,
    ip: result.ip,
    latency: result.latency,
    players: result.players,
    peakPlayers: null,
    uptimeRate: null,
    avgLatency: null,
  };

  var kv = context.env && context.env.MODERNMC_KV;
  if (kv) {
    try {
      if (result.online) {
        await saveOnlineStats(kv, result);
      } else {
        await saveOfflineCheck(kv);
      }
      var s = await loadStats(kv);
      stats.peakPlayers = s.peak;
      stats.uptimeRate = s.rate;
      stats.avgLatency = s.latency;
    } catch (_) {}
  }

  return new Response(JSON.stringify(stats), {
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

async function queryChain() {
  for (var i = 0; i < FALLBACK_IPS.length; i++) {
    var addr = FALLBACK_IPS[i];
    try {
      var controller = new AbortController();
      var timer = setTimeout(function () { controller.abort(); }, API_TIMEOUT);

      var t = Date.now();
      var res = await fetch('https://api.mcsrvstat.us/2/' + encodeURIComponent(addr), {
        headers: { 'User-Agent': 'ModernMC-Website/1.0' },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) continue;
      var data = await res.json();
      if (data && data.online) {
        return {
          online: true,
          ip: addr,
          latency: Date.now() - t,
          players: data.players || null,
        };
      }
    } catch (_) {}
  }
  return { online: false, ip: null, latency: null, players: null };
}

async function saveOnlineStats(kv, result) {
  var peak = parseInt(await kv.get('peak_players')) || 0;
  if (result.players && result.players.online > peak) {
    await kv.put('peak_players', String(result.players.online));
  }

  var t = parseInt(await kv.get('uptime_total')) || 0;
  var o = parseInt(await kv.get('uptime_online')) || 0;
  await kv.put('uptime_total', String(t + 1));
  await kv.put('uptime_online', String(o + 1));

  if (result.latency) {
    var s = parseInt(await kv.get('latency_sum')) || 0;
    var c = parseInt(await kv.get('latency_count')) || 0;
    await kv.put('latency_sum', String(s + result.latency));
    await kv.put('latency_count', String(c + 1));
  }
}

async function saveOfflineCheck(kv) {
  var t = parseInt(await kv.get('uptime_total')) || 0;
  await kv.put('uptime_total', String(t + 1));
}

async function loadStats(kv) {
  var peak = parseInt(await kv.get('peak_players')) || 0;
  var t = parseInt(await kv.get('uptime_total')) || 0;
  var o = parseInt(await kv.get('uptime_online')) || 0;
  var s = parseInt(await kv.get('latency_sum')) || 0;
  var c = parseInt(await kv.get('latency_count')) || 0;
  return {
    peak: peak > 0 ? peak : null,
    rate: t > 0 ? (o / t * 100).toFixed(2) : null,
    latency: c > 0 ? Math.round(s / c) : null,
  };
}
