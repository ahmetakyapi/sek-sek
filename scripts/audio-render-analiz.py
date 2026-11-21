#!/usr/bin/env python3
"""
audio-render.cjs'in yazdığı WAV'ları sayılarla çözümler (dinlemeden): tepe, RMS, LUFS benzeri entegre ve kısa süreli
yüksek ses, sessizlik, frekans dengesi, kulak yorucu tiz payı, kısa patlamalar, yüksek sesin dalgalanması (nefes) ve
tekrar yorgunluğu (ezgi rengi benzerliği). Yalnız numpy ister.
Kullanım: python3 scripts/audio-render-analiz.py <klasör> [--json]
"""
import glob, json, os, sys, wave
import numpy as np

BANDS = [("alt <120", 0, 120), ("pes 120-500", 120, 500), ("orta 0.5-2k", 500, 2000), ("tiz 2-5k", 2000, 5000), ("çok tiz >5k", 5000, 22050)]


def read(path):
    with wave.open(path) as w:
        n, ch, sr = w.getnframes(), w.getnchannels(), w.getframerate()
        a = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float64) / 32768
    return a.reshape(-1, ch), sr


def kweight_response(f, sr):
    """EBU R128 K ağırlığı (yüksek raf + 38 Hz yüksek geçiren), çift doğrusal dönüşümle sayısal biquad'ın frekans yanıtı"""
    def bq(b, a):
        z = np.exp(-1j * 2 * np.pi * f / sr)
        return (b[0] + b[1] * z + b[2] * z * z) / (1 + a[0] * z + a[1] * z * z)
    # kaynak: ITU-R BS.1770, 48 kHz katsayılarının analog karşılığından türetilmiş
    f0, G, Q = 1681.974450955533, 3.999843853973347, 0.7071752369554196
    K = np.tan(np.pi * f0 / sr)
    Vh = 10 ** (G / 20)
    Vb = Vh ** 0.4996667741545416
    a0 = 1 + K / Q + K * K
    b = [(Vh + Vb * K / Q + K * K) / a0, 2 * (K * K - Vh) / a0, (Vh - Vb * K / Q + K * K) / a0]
    a = [2 * (K * K - 1) / a0, (1 - K / Q + K * K) / a0]
    shelf = bq(b, a)
    f0, Q = 38.13547087602444, 0.5003270373238773
    K = np.tan(np.pi * f0 / sr)
    a = [2 * (K * K - 1) / (1 + K / Q + K * K), (1 - K / Q + K * K) / (1 + K / Q + K * K)]
    hp = bq([1, -2, 1], a)
    return np.abs(shelf * hp)


def lufs_blocks(x, sr, win=0.4, hop=0.1):
    """K ağırlıklı blok yüksek sesi (LUFS, kanallar toplanır)"""
    n = x.shape[0]
    spec = np.fft.rfft(x, axis=0)
    f = np.fft.rfftfreq(n, 1 / sr)
    kw = kweight_response(f, sr)[:, None]
    y = np.fft.irfft(spec * kw, n=n, axis=0)
    p = (y ** 2).sum(axis=1)
    w, h = int(win * sr), int(hop * sr)
    c = np.concatenate([[0], np.cumsum(p)])
    starts = np.arange(0, n - w + 1, h)
    ms = (c[starts + w] - c[starts]) / w
    return -0.691 + 10 * np.log10(np.maximum(ms, 1e-12))


def integrated(l):
    g = l[l > -70]
    if not len(g):
        return -99.0
    rel = -0.691 + 10 * np.log10(np.mean(10 ** ((g + 0.691) / 10))) - 10
    g = g[g > rel]
    return -0.691 + 10 * np.log10(np.mean(10 ** ((g + 0.691) / 10))) if len(g) else -99.0


def chroma(m, sr, win):
    """pencere başına 12 sınıflı renk vektörü"""
    n = int(win * sr)
    out = []
    fr = np.fft.rfftfreq(4096, 1 / sr)
    ok = (fr > 80) & (fr < 2000)
    cls = np.round(12 * np.log2(fr[ok] / 440) + 69).astype(int) % 12
    for s in range(0, len(m) - n + 1, n):
        seg = m[s:s + n]
        acc = np.zeros(12)
        for k in range(0, len(seg) - 4096, 2048):
            sp = np.abs(np.fft.rfft(seg[k:k + 4096] * np.hanning(4096)))[ok]
            np.add.at(acc, cls, sp)
        out.append(acc / (np.linalg.norm(acc) + 1e-9))
    return np.array(out)


def analyse(path):
    x, sr = read(path)
    m = x.mean(axis=1)
    n = len(m)
    peak = np.abs(x).max()
    rms = np.sqrt((x ** 2).mean())
    db = lambda v: 20 * np.log10(max(v, 1e-9))
    r = {"ad": os.path.basename(path)[:-4], "sn": n / sr, "tepe_db": db(peak), "rms_db": db(rms), "tepe_rms": db(peak) - db(rms)}
    r["dc"] = float(abs(m.mean()))
    r["klip"] = int((np.abs(x) > 0.999).sum())
    l = lufs_blocks(x, sr)
    r["lufs"] = integrated(l)
    # kısa süreli (3 sn) yüksek ses: dalgalanma = nefes
    st = np.array([-0.691 + 10 * np.log10(max(np.mean(10 ** ((l[i:i + 30] + 0.691) / 10)), 1e-12)) for i in range(0, len(l) - 30, 10)])
    r["st_min"], r["st_max"] = (float(st.min()), float(st.max())) if len(st) else (0.0, 0.0)
    r["st_sd"] = float(st.std()) if len(st) else 0.0
    # sessizlik: 100 ms pencerelerin RMS'i -60 dBFS altı
    w = sr // 10
    wr = np.array([np.sqrt((m[i:i + w] ** 2).mean()) for i in range(0, n - w, w)])
    quiet = wr < 10 ** (-60 / 20)
    r["sessiz_yuzde"] = float(100 * quiet.mean())
    best = cur = 0
    for q in quiet:
        cur = cur + 1 if q else 0
        best = max(best, cur)
    r["en_uzun_sessiz_sn"] = best / 10
    # kısa patlama: 20 ms tepe, çevresindeki 1 sn RMS'ten 18 dB fazla (müzikte sıçrama)
    hop = int(0.02 * sr)
    pk = np.array([np.abs(m[i:i + hop]).max() for i in range(0, n - hop, hop)])
    loc = np.sqrt(np.convolve(pk ** 2, np.ones(50) / 50, mode="same"))
    r["patlama"] = int(((pk > 0.02) & (20 * np.log10(pk / np.maximum(loc, 1e-6)) > 18)).sum())
    # frekans dengesi (ortalama güç spektrumu)
    fr = np.fft.rfftfreq(8192, 1 / sr)
    acc = np.zeros(len(fr))
    cnt = 0
    for i in range(0, n - 8192, 4096):
        acc += np.abs(np.fft.rfft(m[i:i + 8192] * np.hanning(8192))) ** 2
        cnt += 1
    acc /= max(cnt, 1)
    tot = acc.sum() + 1e-18
    r["bantlar"] = {nm: float(100 * acc[(fr >= lo) & (fr < hi)].sum() / tot) for nm, lo, hi in BANDS}
    r["merkez_hz"] = float((fr * acc).sum() / tot)
    # tekrar yorgunluğu: 2 sn'lik pencerelerin renk vektörleri; 20 sn'den uzak çiftlerde benzerlik
    c = chroma(m, sr, 2.0)
    if len(c) > 14:
        sim = c @ c.T
        lag = np.abs(np.arange(len(c))[:, None] - np.arange(len(c))[None, :])
        far = sim[lag >= 10]
        r["tekrar_benzerlik"] = float(far.mean())
        r["tekrar_yuzde_098"] = float(100 * (far > 0.98).mean())
    return r


def sfx_table(path):
    """efektler.wav: her efekt kendi saniyesinde çalınır (audio-render.cjs); efekt başına tepe ve RMS (dBFS)"""
    import re
    src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "audio-render.cjs"), encoding="utf8").read()
    names = re.findall(r"'([A-Za-z]+)'", re.search(r"const names=\[(.*?)\]", src).group(1))
    x, sr = read(path)
    m = np.abs(x).max(axis=1)
    rows = []
    for i, nm in enumerate(names):
        seg = x[int((0.45 + i) * sr):int((1.45 + i) * sr)]
        if len(seg) == 0:
            break
        rows.append((nm, 20 * np.log10(np.abs(seg).max() + 1e-9), 20 * np.log10(np.sqrt((seg ** 2).mean()) + 1e-9)))
    return rows


def main():
    d = sys.argv[1]
    rows = [analyse(p) for p in sorted(glob.glob(os.path.join(d, "*.wav")))]
    if "--json" in sys.argv:
        print(json.dumps(rows, ensure_ascii=False, indent=1))
        return
    ef = os.path.join(d, "efektler.wav")
    if os.path.exists(ef):
        print("efekt başına tepe / RMS (dBFS):")
        print("  " + "  ".join(f"{n} {p:.0f}/{r:.0f}" for n, p, r in sfx_table(ef)))
    for r in rows:
        b = r["bantlar"]
        print(f"{r['ad']:<15} {r['sn']:6.1f}sn  tepe {r['tepe_db']:6.1f}  rms {r['rms_db']:6.1f}  LUFS {r['lufs']:6.1f}  tepe/rms {r['tepe_rms']:5.1f}"
              f"  3sn-lufs {r['st_min']:6.1f}..{r['st_max']:6.1f} (sd {r['st_sd']:.1f})")
        print(f"{'':<15} bant% " + "  ".join(f"{k.split()[0]} {v:4.1f}" for k, v in b.items()) + f"  merkez {r['merkez_hz']:.0f} Hz"
              f"  sessiz {r['sessiz_yuzde']:.0f}% (en uzun {r['en_uzun_sessiz_sn']:.1f}sn)  patlama {r['patlama']}  klip {r['klip']}  dc {r['dc']:.4f}"
              + (f"  tekrar {r['tekrar_benzerlik']:.3f} (>0.98: {r['tekrar_yuzde_098']:.0f}%)" if "tekrar_benzerlik" in r else ""))


if __name__ == "__main__":
    main()
