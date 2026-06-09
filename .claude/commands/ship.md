Şu feature için tüm feature pipeline'ını çalıştır: $ARGUMENTS

Aşağıdaki aşamaları SIRAYLA yürüt. İleri atlama. Her aşamadan sonra,
bir sonrakine başlamadan önce handoff dosyasının var olduğunu doğrula.

1. Yukarıdaki feature isteğiyle `planner` subagent'ına delege et.
   `.pipeline/spec.md` dosyasını bekle.
2. Spec'te `OPEN QUESTIONS` varsa, DUR ve bunları bana göster. Yoksa
   `coder` subagent'ına delege et. `.pipeline/changes.md` dosyasını bekle.
3. `tester` subagent'ına delege et. `.pipeline/test-results.md` dosyasını
   bekle. Testler fail ise, DUR ve başarısızlıkları bana göster.
4. `reviewer` subagent'ına delege et. `.pipeline/review.md` dosyasını bana göster.

Final verdict'i raporla. Hiçbir şeyi merge ETME. Branch'i sabah
incelemem için bırak.
