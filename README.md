# englishContent

[오늘의 표현](https://github.com/sangjae-ai) 안드로이드 앱이 내려받는 **영어 학습 문장 데이터**.

레벨 10개 · **502문장** (레벨당 50문장 내외 — 정확한 수는 `dist/manifest.json` 이 기준이다). 각 문장에는 한국어 해석과 그 문장에 실제로 들어있는 숙어 설명이 붙는다.

| # | 레벨 | id | 문장 |
|---|---|---|---|
| 1 | 초등 | `elementary` | 51 |
| 2 | 중1 | `middle1` | 50 |
| 3 | 중2 | `middle2` | 50 |
| 4 | 중3 | `middle3` | 50 |
| 5 | 고1 | `high1` | 50 |
| 6 | 고2 | `high2` | 50 |
| 7 | 고3 | `high3` | 50 |
| 8 | 성인 | `adult` | 50 |
| 9 | IT 개발자 | `it-developer` | 51 |
| 10 | 실리콘밸리 엔지니어 | `sv-engineer` | 50 |

---

## 앱이 읽는 방식

앱은 **매니페스트만 먼저** 받아서 레벨별 `contentHash` 를 비교하고, **바뀐 레벨 파일만** 내려받는다.
버전 번호를 손으로 올릴 필요가 없다 — 내용이 바뀌면 해시가 저절로 달라진다.

```
dist/manifest.json                 ← 앱이 가장 먼저 받는 파일
dist/levels/<레벨id>.json           ← 해시가 달라진 레벨만 받는다 (manifest 기준 상대경로)
```

앱 설정에 넣는 주소는 매니페스트의 raw URL 하나뿐이다.

```
https://raw.githubusercontent.com/sangjae-ai/englishContent/main/dist/manifest.json
```

### manifest.json

```json
{
 "schema": 3,
 "generatedAt": "2026-08-20",
 "manifestHash": "43c4d053637ed70e",
 "levels": [
  {
   "id": "elementary",
   "name": "초등",
   "order": 1,
   "description": "초등 고학년 · 집과 학교의 하루",
   "cards": 50,
   "contentHash": "890d6359e6b1ea61",
   "path": "levels/elementary.json"
  }
 ]
}
```

### dist/levels/&lt;id&gt;.json

```json
{
 "schema": 3,
 "level": "elementary",
 "name": "초등",
 "contentHash": "890d6359e6b1ea61",
 "cards": [
  {
   "id": "elementary-001",
   "sentence": "I get up at seven every morning.",
   "sentenceKo": "나는 매일 아침 7시에 일어나.",
   "idioms": [
    { "en": "get up", "ko": "일어나다", "note": "잠자리에서 몸을 일으킬 때 씁니다." }
   ]
  }
 ]
}
```

---

## 문장 추가·수정하기

`levels/<레벨id>.json` 의 `cards` 배열만 고치면 된다. 카드 한 장은 짧게 쓰려고 배열로 적는다.

```json
["영어 문장", "한국어 해석", "숙어|뜻|설명", "숙어2|뜻2|설명2"]
```

- 숙어는 **그 문장에 실제로 들어있는 것만** 적는다. 없는 걸 적으면 참조로서 쓸모가 없다.
- `id` 는 빌드할 때 `<레벨id>-001` 형태로 자동 부여되므로 적지 않는다.

고친 뒤 빌드한다.

```bash
node tools/build.mjs
```

빌드는 다음을 검사하고, 하나라도 걸리면 실패한다.

- 영어 문장·한국어가 비어 있지 않은지
- 숙어가 최소 하나 있는지
- 같은 레벨 안에 중복 문장이 없는지

통과하면 `dist/` 가 갱신된다. 커밋해서 push 하면 앱이 다음 확인 때 받아 간다.
GitHub Actions 가 push 마다 `dist/` 를 다시 빌드해 커밋과 어긋나지 않는지 확인한다.

> **raw.githubusercontent.com 은 CDN 캐시가 있다.** push 직후 최대 5분까지 옛 내용이
> 내려올 수 있다 (실측 300초). 앱은 하루 한 번만 확인하므로 실사용에는 영향이 없지만,
> 푸시하자마자 앱에서 확인해 보면 "최신"이라고 나올 수 있다.

---

## 새 레벨 추가하기

`levels/` 에 파일을 하나 더 만들면 된다. `order` 가 앱에서의 표시 순서다.

```json
{
 "id": "toeic",
 "name": "토익",
 "order": 11,
 "description": "토익 파트 5·6 빈출 표현",
 "cards": [ ... ]
}
```

앱은 매니페스트에 새 레벨이 보이면 목록에 자동으로 띄운다. 앱을 다시 설치할 필요가 없다.
