#!/usr/bin/env bash
# Tam doğrulama zinciri: tip → test → her şehir için bölüm, yeniden doğuş, boss ve düşmanlı oynayış (paralel) → derleme.
# Kullanım: bash scripts/verify-all.sh [şehir ...]     (şehir verilmezse hepsi)
#           HIZLI=1 bash scripts/verify-all.sh istanbul  (derlemeyi ve tam test takımını atlar; düşman adımı yine koşar:
#           harita değişikliğinin en kolay bozduğu şey odur, çözücü yolu $OUT/yol altında önbelleklenir)
# Çıktı: şehir başına tek satır; biri FAIL ise çıkış kodu 1. Ayrıntılar: $OUT/<şehir>.log
set -uo pipefail
cd "$(dirname "$0")/.."
OUT="${OUT:-${TMPDIR:-/tmp}/seksek-verify}"
JOBS="${JOBS:-$(( $(nproc 2>/dev/null || echo 4) > 1 ? $(nproc 2>/dev/null || echo 4) - 1 : 1 ))}"
mkdir -p "$OUT"; rm -f "$OUT"/*.log
fail=0

echo "▸ tip denetimi"
npx tsc --noEmit --noUnusedLocals --noUnusedParameters || fail=1

if [ $# -gt 0 ]; then cities=("$@"); else mapfile -t cities < <(npx tsx -e "import {LEVELS} from './game/levels'; console.log(LEVELS.map(l=>l.id).join('\n'))"); fi

if [ -z "${HIZLI:-}" ]; then
  echo "▸ testler"
  npm test 2>&1 | grep -E "Tests|FAIL|AssertionError" || true
  npm test >/dev/null 2>&1 || fail=1
fi

echo "▸ ${#cities[@]} şehir, $JOBS süreç: meydan yolu · bölüm · yeniden doğuş · boss · toplananlar · düşman"
printf '%s\n' "${cities[@]}" | xargs -P "$JOBS" -I{} sh -c '
  { npx tsx scripts/verify-prelude.ts {}; echo "PRELUDE $?"
    npx tsx scripts/verify-levels.ts {};  echo "LEVELS $?"
    npx tsx scripts/verify-respawn.ts {}; echo "RESPAWN $?"
    npx tsx scripts/bossbot.ts {};        echo "BOSS $?"
    npx tsx scripts/audit-reach.ts {};    echo "REACH $?"
    npx tsx scripts/verify-items.ts {};   echo "ITEMS $?"
    npx tsx scripts/verify-enemies.ts {}; echo "ENEMIES $?"; } > "'"$OUT"'/{}.log" 2>&1'

for c in "${cities[@]}"; do
  line=""
  for k in PRELUDE LEVELS RESPAWN BOSS REACH ITEMS ENEMIES; do
    code=$(grep -E "^$k " "$OUT/$c.log" | awk '{print $2}')
    if [ "$code" = "0" ]; then line+=" $k ✓"; else line+=" $k ✗"; fail=1; fi
  done
  # bossbot çıkış koduyla değil satırıyla konuşur
  grep -q "^FAIL" "$OUT/$c.log" && { line+="  (FAIL satırı var)"; fail=1; }
  printf '%-11s%s\n' "$c" "$line"
done

if [ -z "${HIZLI:-}" ]; then
  echo "▸ derleme"
  npm run build >/dev/null 2>&1 && echo "derleme ✓" || { echo "derleme ✗"; fail=1; }
fi
# kare akıcılığı (tarayıcıda): geliştirme sunucusu açıksa koşar (npm run dev -- -p 3100)
if curl -s -o /dev/null "http://localhost:${PORT:-3100}"; then
  echo "▸ kare akıcılığı"
  node scripts/verify-frames.cjs "${cities[@]:0:3}" --port="${PORT:-3100}" || fail=1
else
  echo "▸ kare akıcılığı atlandı: geliştirme sunucusu yok (npm run dev -- -p 3100)"
fi
# performans (üretim derlemesinde gerçek oynanış): üretim sunucusu açıksa koşar (npm run build && npx next start -p 3200)
if curl -s -o /dev/null "http://localhost:${PERF_PORT:-3200}"; then
  echo "▸ performans"
  node scripts/verify-perf.cjs "${cities[@]:0:2}" --port="${PERF_PORT:-3200}" || fail=1
else
  echo "▸ performans atlandı: üretim sunucusu yok (npm run build && npx next start -p 3200)"
fi
[ $fail -eq 0 ] && echo "TEMİZ" || echo "SORUN VAR: $OUT/<şehir>.log"
exit $fail
