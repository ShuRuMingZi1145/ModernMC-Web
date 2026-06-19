var FALLBACK_IPS = ['modernmc.srmz.cn', '60.18.74.126:56665', '47.92.28.8:56665'];

export async function onRequest(context) {
  var cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }

  var kv = context.env.MODERNMC_KV;
  var result = await queryChain();

  if (result.online) {
    await updateStats(kv, result);
  } else {
    await recordOffline(kv);
  }

  var stats = await collectStats(kv, result);

  return new Response(JSON.stringify(stats), {
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

async function queryChain() {
  for (var i = 0; i < FALLBACK_IPS.length; i++) {
    var addr = FALLBACK_IPS[i];
    try {
      var t = Date.now();
      var res = await fetch('https://api.mcsrvstat.us/2/' + encodeURIComponent(addr), {
        headers: { 'User-Agent': 'ModernMC-Website/1.0' },
      });
      var data = await res.json();
      if (data.online) {
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

async function updateStats(kv, result) {
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

async function recordOffline(kv) {
  var t = parseInt(await kv.get('uptime_total')) || 0;
  await kv.put('uptime_total', String(t + 1));
}

async function collectStats(kv, current) {
  var peak = parseInt(await kv.get('peak_players')) || 0;
  var t = parseInt(await kv.get('uptime_total')) || 0;
  var o = parseInt(await kv.get('uptime_online')) || 0;
  var s = parseInt(await kv.get('latency_sum')) || 0;
  var c = parseInt(await kv.get('latency_count')) || 0;

  return {
    online: current.online,
    ip: current.ip,
    latency: current.latency,
    players: current.players,
    peakPlayers: peak > 0 ? peak : null,
    uptimeRate: t > 0 ? (o / t * 100).toFixed(2) : null,
    avgLatency: c > 0 ? Math.round(s / c) : null,
  };
}
