
import React, { useState } from 'react';

const CPUScheduler = () => {
  const [procs, setProcs] = useState([
    { id: 1, a: 0, b: 5, pr: 2 },
    { id: 2, a: 1, b: 3, pr: 1 },
    { id: 3, a: 2, b: 8, pr: 3 },
  ]);
  const [algo, setAlgo] = useState('FCFS'); // FCFS | SJF | PRIO | SRTF | RR
  const [q, setQ] = useState(2);
  const [res, setRes] = useState(null);

  const sanitizeProcs = (list) =>
    list.map(p => ({
      ...p,
      a: Math.max(0, Number.isFinite(p.a) ? p.a : 0),
      b: Math.max(1, Number.isFinite(p.b) ? p.b : 1),
      pr: Math.max(1, Number.isFinite(p.pr ?? 1) ? (p.pr ?? 1) : 1),
    }));

  const run = () => {
    const P = sanitizeProcs(procs);
    let t = 0;
    const sch = [];        // {p:id, s:start, e:end} (p=0 يعني Idle)
    const stats = [];      // {id, w, tt, rt}
    const firstStart = {}; // id -> أول وقت بدأ
    const finishTime = {}; // id -> وقت الإنهاء

    const byArrival = [...P].sort((a, b) => a.a - b.a);

    if (algo === 'FCFS') {
      byArrival.forEach(x => {
        if (t < x.a) { sch.push({ p: 0, s: t, e: x.a }); t = x.a; }
        firstStart[x.id] = firstStart[x.id] ?? t;
        sch.push({ p: x.id, s: t, e: t + x.b });
        t += x.b;
        finishTime[x.id] = t;
      });

    } else if (algo === 'SJF') {
      const done = new Set();
      while (done.size < P.length) {
        const available = byArrival.filter(x => x.a <= t && !done.has(x.id));
        if (!available.length) {
          const nextArr = byArrival.find(x => !done.has(x.id) && x.a > t)?.a;
          if (nextArr !== undefined) { sch.push({ p: 0, s: t, e: nextArr }); t = nextArr; }
          continue;
        }
        available.sort((a, b) => a.b - b.b || a.a - b.a || a.id - b.id);
        const x = available[0];
        firstStart[x.id] = firstStart[x.id] ?? t;
        sch.push({ p: x.id, s: t, e: t + x.b });
        t += x.b;
        finishTime[x.id] = t;
        done.add(x.id);
      }

    } else if (algo === 'PRIO') {
      const done = new Set();
      while (done.size < P.length) {
        const available = byArrival.filter(x => x.a <= t && !done.has(x.id));
        if (!available.length) {
          const nextArr = byArrival.find(x => !done.has(x.id) && x.a > t)?.a;
          if (nextArr !== undefined) { sch.push({ p: 0, s: t, e: nextArr }); t = nextArr; }
          continue;
        }
        // أقل رقم pr يعني أولوية أعلى
        available.sort((a, b) => a.pr - b.pr || a.a - b.a || a.id - b.id);
        const x = available[0];
        firstStart[x.id] = firstStart[x.id] ?? t;
        sch.push({ p: x.id, s: t, e: t + x.b });
        t += x.b;
        finishTime[x.id] = t;
        done.add(x.id);
      }

    } else if (algo === 'SRTF') {
      const rem = P.map(p => ({ ...p, tl: p.b }));
      const done = new Set();
      t = Math.min(...P.map(p => p.a));
      while (done.size < P.length) {
        const pool = rem.filter(r => r.a <= t && r.tl > 0);
        if (!pool.length) {
          const future = rem.filter(r => r.tl > 0 && r.a > t).map(r => r.a);
          if (future.length) { sch.push({ p: 0, s: t, e: Math.min(...future) }); t = Math.min(...future); }
          else break;
          continue;
        }
        pool.sort((a, b) => a.tl - b.tl || a.a - b.a || a.id - b.id);
        const x = pool[0];
        const nextArrivals = rem.filter(r => r.tl > 0 && r.a > t).map(r => r.a).sort((a, b) => a - b);
        const nextArr = nextArrivals.length ? nextArrivals[0] : Infinity;
        const runLen = Math.min(x.tl, nextArr - t);
        firstStart[x.id] = firstStart[x.id] ?? t;
        sch.push({ p: x.id, s: t, e: t + runLen });
        x.tl -= runLen;
        t += runLen;
        if (x.tl === 0) { finishTime[x.id] = t; done.add(x.id); }
      }

    } else { // RR
      const quantum = Math.max(1, Number.isFinite(q) ? q : 1);
      const rem = P.map(p => ({ ...p, tl: p.b }));
      const done = new Set();
      const queue = [];
      const enqueued = new Set();

      const enqueueArrived = (time) => {
        rem.forEach(r => {
          if (r.a <= time && r.tl > 0 && !enqueued.has(r.id)) {
            queue.push(r); enqueued.add(r.id);
          }
        });
      };

      t = Math.min(...P.map(p => p.a));
      enqueueArrived(t);

      while (done.size < P.length) {
        if (!queue.length) {
          const nextArr = Math.min(...rem.filter(r => r.tl > 0).map(r => r.a));
          if (Number.isFinite(nextArr) && nextArr > t) { sch.push({ p: 0, s: t, e: nextArr }); t = nextArr; enqueueArrived(t); }
          if (!queue.length) break;
        }
        const x = queue.shift();
        const exec = Math.min(quantum, x.tl);
        firstStart[x.id] = firstStart[x.id] ?? t;
        sch.push({ p: x.id, s: t, e: t + exec });
        x.tl -= exec;
        t += exec;
        enqueueArrived(t);
        if (x.tl > 0) queue.push(x);
        else { finishTime[x.id] = t; done.add(x.id); enqueued.delete(x.id); }
      }
    }

    // حساب المقاييس
    const ordered = [...P].sort((a, b) => a.id - b.id);
    ordered.forEach(p => {
      const ft = finishTime[p.id] ?? t;
      const rt = (firstStart[p.id] ?? p.a) - p.a;
      const tt = ft - p.a;
      const w = tt - p.b;
      stats.push({ id: p.id, w, tt, rt });
    });

    const aw = (stats.reduce((s, x) => s + x.w, 0) / stats.length).toFixed(2);
    const at = (stats.reduce((s, x) => s + x.tt, 0) / stats.length).toFixed(2);
    const ar = (stats.reduce((s, x) => s + x.rt, 0) / stats.length).toFixed(2);

    setRes({ sch, st: stats, aw, at, ar });
  };

  const palette = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6'];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right,#f3f4f6,#e5e7eb)',
        padding: '20px',
        color: '#111',
        fontFamily:
          "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, 'Noto Naskh Arabic', 'Noto Sans Arabic', sans-serif",
      }}
    >
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', textAlign: 'center', marginBottom: '20px' }}>CPU Scheduler</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          {/* Processes */}
          <div style={{ background: 'white', borderRadius: '10px', padding: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontWeight: '700', marginBottom: '10px' }}>Processes</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr', gap: '8px', marginBottom: '8px', fontSize: '12px', color: '#374151' }}>
              <div></div><div>Arrival (a)</div><div>Burst (b)</div><div>Priority (pr)</div>
            </div>

            {procs.map(p => (
              <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 1fr', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                <span style={{ fontWeight: '600' }}>P{p.id}</span>

                <input type="number" dir="ltr" inputMode="numeric" value={p.a}
                  onChange={e => setProcs(procs.map(x => x.id === p.id ? { ...x, a: +e.target.value || 0 } : x))}
                  placeholder="0" style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff', color: '#111', textAlign: 'left' }} />

                <input type="number" dir="ltr" inputMode="numeric" value={p.b}
                  onChange={e => setProcs(procs.map(x => x.id === p.id ? { ...x, b: Math.max(1, +e.target.value || 1) } : x))}
                  placeholder="1" style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff', color: '#111', textAlign: 'left' }} />

                <input type="number" dir="ltr" inputMode="numeric" value={p.pr ?? 1}
                  onChange={e => setProcs(procs.map(x => x.id === p.id ? { ...x, pr: Math.max(1, +e.target.value || 1) } : x))}
                  placeholder="1" style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff', color: '#111', textAlign: 'left' }} />
              </div>
            ))}

            <button
              onClick={() => setProcs([...procs, { id: procs.length + 1, a: 0, b: 4, pr: 1 }])}
              style={{ marginTop: '6px', width: '110px', padding: '8px 10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}
            >
              + Add
            </button>
          </div>

          {/* Algorithm */}
          <div style={{ background: 'white', borderRadius: '10px', padding: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontWeight: '700', marginBottom: '10px' }}>Algorithm</h3>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap', padding: '4px 0 10px' }}>
              {['FCFS', 'SJF', 'PRIO', 'SRTF', 'RR'].map(a => (
                <label key={a} style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                  <input type="radio" checked={algo === a} onChange={() => setAlgo(a)} />
                  <span style={{ fontWeight: 600 }}>{a}</span>
                </label>
              ))}

              {algo === 'RR' && (
                <input
                  type="number" dir="ltr" inputMode="numeric" value={q}
                  onChange={e => setQ(Math.max(1, +e.target.value || 1))}
                  placeholder="Quantum"
                  style={{ width: '120px', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff', color: '#111', textAlign: 'left' }}
                />
              )}

              <button
                onClick={run}
                style={{ marginLeft: 'auto', padding: '10px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800' }}
              >
                Run
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {res && (
          <div style={{ background: 'white', borderRadius: '10px', padding: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontWeight: '700', marginBottom: '10px' }}>Gantt Chart</h3>

            <div style={{ display: 'flex', marginBottom: '6px' }}>
              {res.sch.map((x, i) => (
                <div key={i}
                  title={x.p === 0 ? 'Idle' : `P${x.p}: ${x.s}→${x.e}`}
                  style={{
                    background: x.p === 0 ? '#9ca3af' : palette[(x.p - 1) % palette.length],
                    color: 'white', padding: '10px', textAlign: 'center', fontWeight: 'bold',
                    border: '2px solid white', flex: Math.max(0.001, x.e - x.s), minWidth: 0
                  }}>
                  {x.p === 0 ? 'IDLE' : `P${x.p}`}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 0, marginBottom: '15px' }}>
              {res.sch.map((x, i) => (
                <div key={`t-${i}`} style={{ fontSize: '11px', position: 'relative', flex: Math.max(0.001, x.e - x.s) }}>
                  <span style={{ position: 'absolute', left: 0 }}>{x.s}</span>
                  <span style={{ position: 'absolute', right: 0 }}>{x.e}</span>
                </div>
              ))}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={{ padding: '8px', border: '1px solid #ddd' }}>Process</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd' }}>Waiting</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd' }}>Turnaround</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd' }}>Response</th>
                </tr>
              </thead>
              <tbody>
                {res.st.map(s => (
                  <tr key={s.id}>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>P{s.id}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{s.w}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{s.tt}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{s.rt}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', background: '#fef3c7' }}>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>Avg</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{res.aw}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{res.at}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{res.ar}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CPUScheduler;
