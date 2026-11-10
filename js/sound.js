/* =========================================================
   音效系统（Web Audio 合成，不需要任何音频文件）
   ========================================================= */
(function () {
  let ctx = null;
  let enabled = true;   // 每次打开默认开声音（不再记忆静音，避免手机上被旧状态卡住）

  function getCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }

  /* 一个音符：type 波形，freq 频率，dur 时长（秒），vol 音量 */
  function tone(freq, dur, type, vol, delay, slideTo) {
    const c = getCtx();
    if (!c || !enabled) return;
    const t0 = c.currentTime + (delay || 0);
    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.type = type || "square";
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
    }

    const v = vol == null ? 0.055 : vol;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(v, t0 + 0.008);       // 极快起音
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);    // 自然衰减

    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  const SFX = {
    /* 普通点击：像水滴一样的高频清脆「叮」 */
    click() { tone(1900, 0.035, "sine", 0.05, 0, 2600); },

    /* 选中 / 切换：更亮一点的点 */
    select() {
      tone(1400, 0.045, "sine", 0.055);
      tone(2100, 0.03, "sine", 0.03, 0.01);
    },

    /* 成功：两个清亮的上行短音 */
    ok() {
      tone(880, 0.05, "sine", 0.055);
      tone(1320, 0.07, "sine", 0.05, 0.055);
    },

    /* 收钱：三连清脆铃音 */
    coin() {
      [1318, 1760, 2349].forEach(function (f, i) {
        tone(f, 0.07, "sine", 0.05, i * 0.05);
      });
    },

    /* 失败：短促的低音，但不刺耳 */
    err() {
      tone(420, 0.06, "triangle", 0.055, 0, 300);
      tone(300, 0.09, "triangle", 0.045, 0.07);
    },

    /* 天数推进：清亮的钟 */
    day() {
      tone(660, 0.22, "sine", 0.06);
      tone(990, 0.3, "sine", 0.045, 0.04);
      tone(1320, 0.24, "sine", 0.025, 0.08);
    },

    /* 稀有 / 大奖：一串上行铃音 */
    rare() {
      [1046, 1318, 1568, 2093].forEach(function (f, i) {
        tone(f, 0.1, "sine", 0.05, i * 0.055);
      });
    }
  };;

  window.SFX = SFX;

  /* 关键：浏览器要求「用户第一次交互」之后才能出声。
     所以第一个点击/触摸就把音频上下文建好、BGM 起来，
     这样从启动屏开始就有音乐和点击音。 */
  let _audioBooted = false;
  let _lastBootTry = 0;
  function bootstrapAudio() {
    try {
      getCtx();
      if (!enabled) return;
      const el = ensureAudioEl();
      if (!el.paused && !el.ended) return;   // 正在播就什么都不做
      const now = Date.now();
      if (now - _lastBootTry < 1200) return;  // 1.2 秒内不重复尝试，避免打断音频
      _lastBootTry = now;
      _audioBooted = true;
      startBgm();
    } catch (e) {}
  }
  window.bootstrapAudio = bootstrapAudio;

  // 手机浏览器只认 click / touchend 这种真实手势，pointerdown 常常不算
  ["click", "touchend", "pointerup", "keydown"].forEach(function (ev) {
    document.addEventListener(ev, bootstrapAudio, { passive: true });
  });

  /* ---------------- 背景音乐（合成，循环） ---------------- */
  /* C 大调，轻快但不吵：三角波主旋律 + 正弦低音 */
  /* ================= 背景音乐：真实音频文件 ================= */
  const BGM_SRC = "./assets/bgm.mp3";
  let bgmAudio = null;
  let bgmOn = false;

  function ensureAudioEl() {
    if (bgmAudio) return bgmAudio;
    bgmAudio = new Audio(BGM_SRC);
    bgmAudio.loop = true;
    bgmAudio.volume = 0.26;         // 直接给最终音量
    bgmAudio.preload = "metadata";
    return bgmAudio;
  }

  function fadeTo(target, ms) {
    const el = ensureAudioEl();
    const from = el.volume;
    const t0 = performance.now();
    const dur = ms || 900;
    (function step() {
      const k = Math.min(1, (performance.now() - t0) / dur);
      el.volume = from + (target - from) * k;
      if (k < 1) requestAnimationFrame(step);
    })();
  }

  function startBgm() {
    if (!enabled) return;
    const el = ensureAudioEl();
    if (bgmOn && !el.paused) return;
    bgmOn = true;
    el.volume = 0.26;
    if (el.readyState < 2) {
      try { if (window.toast) toast("音乐加载中…", ""); } catch (e) {}
    }
    try { startWatchdog(); } catch (e) {}
    const pr = el.play();
    if (pr && pr.then) {
      pr.then(function () {
        try { if (window.toast) toast("音乐开始播放", ""); } catch (e) {}
      }).catch(function (err) {
        bgmOn = false;
        const name = (err && err.name) || "未知";
        let msg = "音乐播放失败: " + name;
        if (name === "NotAllowedError") msg = "需要先点一下屏幕才能放音乐";
        if (name === "NotSupportedError") msg = "这个浏览器不支持该音频格式";
        try { if (window.toast) toast(msg, "warn"); } catch (e) {}
        console.warn("[BGM]", msg);
      });
    }
  }

  function stopBgm() {
    bgmOn = false;
    if (!bgmAudio) return;
    try { bgmAudio.pause(); } catch (e) {}
  }

  window.startBgm = startBgm;
  window.stopBgm = stopBgm;
  window.isBgmOn = function () { return bgmOn; };

  /* 诊断用：在控制台跑 __bgmDebug() 能看到卡在哪一步 */
  window.__bgmDebug = function () {
    const el = ensureAudioEl();
    const info = {
      enabled: enabled,
      bgmOn: bgmOn,
      paused: el.paused,
      currentTime: +el.currentTime.toFixed(2),
      duration: isFinite(el.duration) ? +el.duration.toFixed(1) : "未知",
      volume: el.volume,
      muted: el.muted,
      readyState: el.readyState,
      networkState: el.networkState,
      src: el.src,
      error: el.error ? (el.error.code + " " + el.error.message) : null,
      localStorage: (function () { try { return localStorage.getItem("aicompany_sound"); } catch (e) { return "?"; } })()
    };
    console.table(info);
    if (el.paused) {
      console.log("尝试重新播放…");
      el.play().then(function () { console.log("播放成功"); }).catch(function (e) { console.error("播放失败:", e.name, e.message); });
    }
    return info;
  };
  /* 强制开启声音并播放（用户点了没反应时的兜底） */
  window.__forceBgm = function () {
    enabled = true;
    try { localStorage.setItem("aicompany_sound", "1"); } catch (e) {}
    const el = ensureAudioEl();
    el.muted = false;
    el.volume = 0.26;
    bgmOn = true;
    return el.play().then(function () { return "ok"; }).catch(function (e) { return "fail: " + e.name; });
  };


  /* 全局点击音：所有可点的按钮 / 卡片自动带上 */
  function isClickable(el) {
    if (!el || el.nodeType !== 1) return false;
    const tag = el.tagName;
    if (tag === "BUTTON" || tag === "A" || tag === "INPUT" || tag === "SELECT") return true;
    if (el.onclick) return true;
    const cls = el.className || "";
    return String(cls).indexOf("pickrow") >= 0 || String(cls).indexOf("icard") >= 0 ||
           String(cls).indexOf("wrow") >= 0 || String(cls).indexOf("sceneChar") >= 0 ||
           String(cls).indexOf("sceneWorker") >= 0 || String(cls).indexOf("bootBtn") >= 0 ||
           String(cls).indexOf("bootMode") >= 0;
  }

  document.addEventListener("pointerdown", function (e) {
    let el = e.target;
    for (let i = 0; i < 4 && el; i++) {
      if (isClickable(el)) { SFX.click(); return; }
      el = el.parentElement;
    }
  }, true);

  /* 开关 */
  /* 页面一加载就试着播（静音模式先播，解锁后再开声音） —— 某些手机认这招 */
  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(function () {
      try {
        const el = ensureAudioEl();
        el.muted = true;
        const pr = el.play();
        if (pr && pr.then) {
          pr.then(function () {
            // 静音播放成功 → 说明浏览器放行，只是需要用户手势才能开声音
            setTimeout(function () { el.muted = false; el.volume = 0.26; }, 300);
          }).catch(function () {});
        }
      } catch (e) {}
    }, 800);
  });

  /* 看门狗：手机省电策略会偷偷暂停音频，定期检查并恢复 */
  let bgmWatchdog = null;
  function startWatchdog() {
    if (bgmWatchdog) return;
    bgmWatchdog = setInterval(function () {
      if (!enabled || !bgmAudio) return;
      if (document.visibilityState !== "visible") return;
      if (bgmAudio.paused && !bgmAudio.ended) {
        bgmAudio.volume = 0.26;
        bgmAudio.play().catch(function () {});
      }
    }, 2500);
  }

  /* 页面切回前台时立刻恢复 */
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && enabled && bgmAudio && bgmAudio.paused) {
      bgmAudio.volume = 0.26;
      bgmAudio.play().catch(function () {});
    }
  });

  window.setSound = function (on) {
    enabled = !!on;
    try { localStorage.setItem("aicompany_sound", enabled ? "1" : "0"); } catch (e) {}
    if (enabled) {
      SFX.select();
      startBgm();
      try { if (window.toast) toast("音效已开启", ""); } catch (e) {}
    } else {
      stopBgm();
      try { if (window.toast) toast("已静音", ""); } catch (e) {}
    }
    const b = document.getElementById("btnSound");
    if (b) b.textContent = enabled ? "🔊 音效" : "🔇 静音";
  };
  window.isSoundOn = function () { return enabled; };

  /* 页面加载后同步按钮文字 */
  document.addEventListener("DOMContentLoaded", function () {
    const b = document.getElementById("btnSound");
    if (b) b.textContent = enabled ? "🔊 音效" : "🔇 静音";
  });
})();
