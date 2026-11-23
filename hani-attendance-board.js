/* Scoped Home Attendance Stamp Board. Reads/writes only hani_attendance_v1 via HaniAttendance. */
(function (root) {
  "use strict";
  function section_id() { return "attendanceBoard"; }

  const DAYS_KO = Object.freeze(["월", "화", "수", "목", "금", "토", "일"]);
  const WD_KO = Object.freeze(["일", "월", "화", "수", "목", "금", "토"]);
  const MILESTONE_TITLES = Object.freeze({
    "3": "3일 연속! 🎉",
    "7": "7일 개근! 🏅",
    "14": "2주 개근! 🎊",
    "30": "30일 개근! 👑"
  });

  const CREW = Object.freeze([
    Object.freeze({ id: "hani", name: "하니", pet: false }),
    Object.freeze({ id: "yuna", name: "유나", pet: false }),
    Object.freeze({ id: "mir", name: "미르", pet: false }),
    Object.freeze({ id: "gaeun", name: "가은", pet: false }),
    Object.freeze({ id: "ieum", name: "이음", pet: false }),
    Object.freeze({ id: "seoyun", name: "서윤", pet: false }),
    Object.freeze({ id: "dohyun", name: "도연", pet: false }),
    Object.freeze({ id: "serin", name: "세린", pet: false }),
    Object.freeze({ id: "yuri", name: "유리", pet: false }),
    Object.freeze({ id: "arin", name: "아린", pet: false }),
    Object.freeze({ id: "jieun", name: "지은", pet: false }),
    Object.freeze({ id: "haru", name: "하루", pet: false }),
    Object.freeze({ id: "daon", name: "다온", pet: false }),
    Object.freeze({ id: "naeun", name: "나은", pet: false }),
    Object.freeze({ id: "hina", name: "히나", pet: false }),
    Object.freeze({ id: "minji", name: "민지", pet: false }),
    Object.freeze({ id: "sooyeon", name: "수연", pet: false }),
    Object.freeze({ id: "yoonseul", name: "윤슬", pet: false }),
    Object.freeze({ id: "sua", name: "수아", pet: false }),
    Object.freeze({ id: "taeo", name: "채원", pet: false }),
    Object.freeze({ id: "pet-cat", name: "치즈", pet: true }),
    Object.freeze({ id: "pet-dog", name: "크림", pet: true }),
    Object.freeze({ id: "pet-bori", name: "보리", pet: true }),
    Object.freeze({ id: "pet-rabbit", name: "모찌", pet: true })
  ]);

  const PROFILE_SPECIAL = Object.freeze({
    daon: "./assets/profiles/thumb/hani-profile-daon-v2-256.webp",
    yoonseul: "./assets/profiles/thumb/hani-profile-yoonseul-v2-256.webp",
    sua: "./assets/profiles/thumb/hani-profile-sua-id-256.webp"
  });

  const PET_SPRITES = Object.freeze({
    "pet-cat": "./assets/sprites-v3/pet-cat.webp",
    "pet-dog": "./assets/sprites-v3/pet-dog.webp",
    "pet-bori": "./assets/sprites-v3/pet-bori.webp",
    "pet-rabbit": "./assets/sprites-v3/pet-rabbit.webp"
  });

  const LINES = Object.freeze({
    duty: Object.freeze({
      hani: Object.freeze({
        before: Object.freeze([
          "회장님 어서 오세요! 별표 도장 준비해 두었어요♡",
          "오늘 당번은 저예요, 회장님! 반갑게 도장 찍어요♡"
        ]),
        after: Object.freeze([
          "도장 꾹 찍었어요! 회장님과 함께라 참 든든해요♡",
          "헤헤, 도장 완료! 회장님 오늘도 웃음 가득하세요♡"
        ])
      }),
      yuna: Object.freeze({
        before: Object.freeze([
          "회장님 오셨네요! 안내 책상에서 도장 준비했어요!",
          "제가요?! 오늘 출석 당번이에요, 회장님 반가워요!"
        ]),
        after: Object.freeze([
          "일지에 도장 쾅! 회장님 오늘도 반갑게 안내할게요!",
          "도장 꾹 찍었어요! 회장님 오늘도 힘차게 시작해요!"
        ])
      }),
      mir: Object.freeze({
        before: Object.freeze([
          "회장님 왔네! 도장 칸이 반짝이며 기다렸어, 헤헤.",
          "왜 회장님 발소리는 늘 반가울까? 도장 찍어줄게."
        ]),
        after: Object.freeze([
          "회장님, 오늘 도장도 다정하게 이어졌네. 헤헤.",
          "도장 하나에 마음이 따뜻해지네. 회장님 반가워!"
        ])
      }),
      gaeun: Object.freeze({
        before: Object.freeze([
          "회장님, 출석 도장판을 단정히 펼쳐두었습니다.",
          "회장님 어서 오세요. 따뜻한 차와 도장 준비했어요."
        ]),
        after: Object.freeze([
          "회장님, 오늘 도장도 정성껏 찍어두었습니다.",
          "회장님 출석 확인했어요. 오늘 여유도 꼭 챙겨둘게요."
        ])
      }),
      ieum: Object.freeze({
        before: Object.freeze([
          "회장님, 오늘 출석 칸을 색인 탭으로 열어두었어요. 이거… 아직 안 찍힌 거 맞죠?",
          "회장님, 어제 도장 기록과 오늘 칸을 이어두었습니다. 확인 후 눌러주시면 돼요."
        ]),
        after: Object.freeze([
          "도장 확인했습니다, 회장님. 그럼 오늘 출석은 완료로 닫아둘게요.",
          "오늘 기록까지 빈칸 없이 이어졌어요. 다음 칸도 차분히 열어둘게요, 회장님."
        ])
      }),
      seoyun: Object.freeze({
        before: Object.freeze([
          "회장님 어서 와요. 도장 칸을 차분히 열어두었어요 💜",
          "회장님 반가워요. 오늘도 차분하게 도장 찍어봐요 💜"
        ]),
        after: Object.freeze([
          "도장이 예쁘게 찍혔네요. 회장님, 오늘도 든든해요 💜",
          "오늘 도장 확인했어요, 회장님. 편한 속도로 가요 💜"
        ])
      }),
      dohyun: Object.freeze({
        before: Object.freeze([
          "회장님 오셨네요. 차 우려두고 도장판 열어뒀어요 ☕",
          "회장님 반갑습니다. 편하실 때 도장 눌러주세요 ☕"
        ]),
        after: Object.freeze([
          "오늘 도장 잘 찍혔어요, 회장님. 좋은 출발이네요 ☕",
          "도장 한 칸 채웠어요, 회장님. 차근차근 시작해요 ☕"
        ])
      }),
      serin: Object.freeze({
        before: Object.freeze([
          "와아 회장님!! 오늘 도장 반짝이게 준비했어요 ✨",
          "회장님 오셨네요!! 오늘도 신나게 도장 찍어볼까요 📊"
        ]),
        after: Object.freeze([
          "도장 쾅!! 회장님 덕분에 오늘 기분이 최고치예요 ✨",
          "도장판이 반짝여요!! 회장님 오늘도 힘차게 가요 📊"
        ])
      }),
      yuri: Object.freeze({
        before: Object.freeze([
          "회장님 어서 오세요. 오늘 도장판 준비 완료입니다 ✅",
          "오늘 당번 유리입니다. 회장님, 반갑게 기다렸습니다."
        ]),
        after: Object.freeze([
          "출석 확인 완료입니다, 회장님. 오늘도 합격이네요 ✅",
          "도장이 반듯하네요, 회장님. 오늘도 든든히 챙길게요."
        ])
      }),
      arin: Object.freeze({
        before: Object.freeze([
          "회장님 어서 와요! 예쁜 빛깔로 도장 준비했어요 ✨",
          "도장판이 회장님을 기다렸어요! 예쁘게 찍어볼까요 🎨"
        ]),
        after: Object.freeze([
          "도장 쾅! 회장님과 마음도 한 칸 더 가까워졌어요 ✨",
          "도장 빛깔이 참 포근하네요, 회장님! 기분 좋아요 🎨"
        ])
      }),
      jieun: Object.freeze({
        before: Object.freeze([
          "회장님 반가워요. 오늘의 소중한 도장부터 챙겨드릴게요.",
          "어서 오세요, 회장님. 마음 장부에 도장 찍어볼까요."
        ]),
        after: Object.freeze([
          "회장님 출석 완료! 오늘도 마음 곳간이 참 든든하네요.",
          "소중한 도장 완료예요, 회장님. 늘 곁에서 응원할게요."
        ])
      }),
      haru: Object.freeze({
        before: Object.freeze([
          "회장님 오셨네요! 향 좋은 차와 도장 준비했어요 ☕",
          "오늘 당번은 저예요, 회장님. 예쁜 도장 골라뒀어요."
        ]),
        after: Object.freeze([
          "도장 꾹! 회장님과 여는 하루가 제일 기분 좋네요 ☕",
          "오늘 도장도 깔끔하네요, 회장님. 여유롭게 보내세요!"
        ])
      }),
      daon: Object.freeze({
        before: Object.freeze([
          "회장님 오셨어요?! 도장 미리 반짝이게 닦아뒀어요😅",
          "오늘 당번은 저예요… 회장님, 도장 준비해 뒀어요!"
        ]),
        after: Object.freeze([
          "도장이 예쁘게 찍혔어요! 회장님 오셔서 든든해요😅",
          "회장님 도장 완료! 오늘은 좋은 일만 가득할 거예요!"
        ])
      }),
      naeun: Object.freeze({
        before: Object.freeze([
          "회장님 어서 와요~ 가볍게 인사하며 도장 찍어볼까요?",
          "반가워요, 회장님! 따뜻한 차 드시며 도장 찍어요~"
        ]),
        after: Object.freeze([
          "도장 완료예요, 회장님! 오늘도 편안하게 보내요~",
          "회장님 뵈니 활력이 가득 차네요! 포근한 날 보내요~"
        ])
      }),
      hina: Object.freeze({
        before: Object.freeze([
          "회장님 어서 오세용! 칭찬 꽃 도장 준비해 뒀어용 🐰",
          "오늘 당번은 히나예용! 회장님, 꽃 도장 찍어봐용♡"
        ]),
        after: Object.freeze([
          "참 잘했어용, 회장님! 꽃 도장 백 점 드릴게용 🐰",
          "회장님이랑 도장 찍어서 신나용! 오늘도 행복하세용♡"
        ])
      }),
      minji: Object.freeze({
        before: Object.freeze([
          "회장님 오셨네요! 첫 장면을 도장으로 열어볼까요 📸",
          "회장님 반가워요! 도장 찍는 명장면을 담아볼게요 📸"
        ]),
        after: Object.freeze([
          "찰칵! 회장님 출석 장면을 기분 좋게 남겼어요 📸",
          "오늘 첫 장면 합격이에요, 회장님! 기분 좋은 날 되세요!"
        ])
      }),
      sooyeon: Object.freeze({
        before: Object.freeze([
          "회장님 반갑습니다! 상쾌한 기분으로 도장 찍어보시죠!",
          "오늘 당번은 저예요! 회장님, 가볍게 출발해 볼까요!"
        ]),
        after: Object.freeze([
          "도장 쾅! 출발이 아주 상쾌한데요, 회장님! 힘내봐요!",
          "발걸음이 기분 좋네요, 회장님! 산뜻한 하루 보내세요!"
        ])
      }),
      yoonseul: Object.freeze({
        before: Object.freeze([
          "회장님 이거 아세요? 책갈피 옆에 도장 챙겨뒀어요 🔖",
          "새 책장을 펼치듯 오늘 도장을 찍어봐요, 회장님 📚"
        ]),
        after: Object.freeze([
          "책갈피에 반가운 도장이 남았어요! 회장님 고마워요 🔖",
          "회장님과 여는 오늘도 따뜻한 이야기가 될 거예요 📚"
        ])
      }),
      sua: Object.freeze({
        before: Object.freeze([
          "회장님 어서 오세요! 출석부 빈칸을 준비해 두었어요!",
          "오늘 당번 수아예요! 회장님 오시길 기다렸어요 헤헤ㅎㅎ"
        ]),
        after: Object.freeze([
          "도장 접수 완료! 회장님 뵈니 힘이 불끈 나요 헤헤ㅎㅎ",
          "반듯한 도장 보니까 마음이 뿌듯해요, 회장님 감사해요!"
        ])
      }),
      taeo: Object.freeze({
        before: Object.freeze([
          "회장님 어서 오세요. 오늘 첫 순서는 반가운 도장입니다.",
          "정리하면 한 가지예요, 회장님. 오셔서 참 반갑습니다!"
        ]),
        after: Object.freeze([
          "출석 확인 완료입니다. 기분 좋은 하루 되세요, 회장님!",
          "도장 한 칸이 든든히 채워졌군요, 회장님. 응원합니다!"
        ])
      }),
      "pet-cat": Object.freeze({
        before: Object.freeze([
          "야옹, 회장님 오셨다냥. 앞발 도장 준비해 뒀다옹 🐾",
          "관심 없는 척해도 회장님 기다렸다냥. 도장 찍자옹!"
        ]),
        after: Object.freeze([
          "앞발 도장 꾹 찍었다냥! 회장님 옆은 내 자리다옹 🐾",
          "골골송은 선물이다냥. 회장님, 느긋한 하루 보내라옹!"
        ])
      }),
      "pet-dog": Object.freeze({
        before: Object.freeze([
          "멍! 회장님 발소리 듣고 도장 물고 달려왔어요!",
          "꼬리가 멈추질 않아요, 멍! 회장님 도장 찍어주세요!"
        ]),
        after: Object.freeze([
          "멍! 발도장 쾅 찍었어요! 회장님 오셔서 정말 신나요!",
          "반가운 도장 완료, 멍! 회장님 곁에서 꼬리 흔들게요!"
        ])
      }),
      "pet-bori": Object.freeze({
        before: Object.freeze([
          "멍, 회장님 오셨군요. 따뜻한 자리에 도장 놓아뒀어요.",
          "느긋하게 기다렸어요, 멍. 회장님 도장 준비됐어요."
        ]),
        after: Object.freeze([
          "큼직한 발도장 찍었어요, 멍. 회장님 오늘도 든든해요.",
          "와 주셔서 고마워요, 멍. 회장님 편한 하루 보내세요."
        ])
      }),
      "pet-rabbit": Object.freeze({
        before: Object.freeze([
          "깡총, 다정한 발소리에 귀가 쫑긋했어요, 회장님 🐰",
          "햇살 머무는 자리에 회장님 도장을 살며시 놓아두었어요."
        ]),
        after: Object.freeze([
          "깡총! 회장님 도장 옆에 당근도 살며시 찍어뒀어요 🐰",
          "조용하고 포근한 출발이네요. 회장님, 오늘도 평온하세요."
        ])
      })
    }),
    rest: Object.freeze([
      "🍀 어제는 네잎클로버 도장으로 기록을 소중히 이었어요!",
      "🍀 하루쯤 편히 쉬어가도 괜찮아요, 기록은 그대로예요!",
      "🍀 빈칸에 행운의 네잎클로버를 놓아두었어요, 회장님!",
      "🍀 쉬어간 하루도 소중하니까요, 연속 일수는 이어집니다!",
      "🍀 마음 편히 쉬신 날엔 네잎클로버 도장이 대신 인사해요!"
    ]),
    milestone: Object.freeze({
      "3": Object.freeze([
        "🎉 사흘 연속 출석! 사무실 책상 인형이 총총 뛰며 반겨요!",
        "✨ 사흘째 함께해요! 당번의 작은 인형이 신나게 춤을 춰요!",
        "🐾 사흘 개근 달성! 사무실 인형이 두 배로 신나게 반겨요!"
      ]),
      "7": Object.freeze([
        "🏅 일주일 개근! 오늘 당번과 친밀도가 두 점 올라가요!",
        "💌 칠 일 연속 출석! 당번의 숨은 비밀 한마디가 열렸어요!",
        "🌟 일주일 개근 고마워요! 친밀도 선물과 속마음을 드려요!"
      ]),
      "14": Object.freeze([
        "🎊 이 주 연속 달성! 단톡방에 기념 간식 이야기가 열렸어요!",
        "🍰 열나흘 개근! 축하 그림과 단톡방 간식 수다를 보세요!",
        "💐 이 주 개근 감사해요! 단톡방에 특별 이야기가 떴어요!"
      ]),
      "30": Object.freeze([
        "👑 서른 날 개근! 이달의 응원 때 황금 꽃가루가 반짝여요!",
        "🎆 한 달 개근 달성! 회장님께 개근 후원자 왕관을 바칩니다!",
        "🏆 서른 날의 발걸음! 전 직원이 뜨거운 박수를 보냅니다!"
      ])
    }),
    secret7: Object.freeze({
      hani: "일주일 내내 뵈니 이제 회장님 발소리만 들어도 설레요♡",
      yuna: "사실 일주일 내내 회장님 맞이할 인사를 미리 연습했어요!",
      mir: "일주일이 다 이어졌어! 회장님이랑 더 가까워졌네, 헤헤.",
      gaeun: "회장님 오시는 시간엔 늘 창가 꽃 방향을 맞춰두었답니다.",
      ieum: "일주일치 기록이 한 줄로 이어졌어요. 회장님과 함께한 7일, 소중히 닫아둘게요.",
      seoyun: "일주일 내내 뵈니 회장님 생각에 미소가 먼저 나네요 💜",
      dohyun: "일주일째 뵈니 차가 식기 전에 마음이 통하네요, 회장님 ☕",
      serin: "제 공책 여백에 회장님과 웃은 날들을 비밀로 적어뒀어요 ✨",
      yuri: "일주일 개근 통과입니다. 회장님 옆자리가 이제 참 편하네요.",
      arin: "일주일 도장 빛깔에 제 마음도 몰래 섞어뒀어요, 회장님 ✨",
      jieun: "일주일 개근이라는 가장 큰 선물을 회장님께 받았네요.",
      haru: "아껴둔 찻잎 꺼냈어요. 일주일 개근하신 회장님 몫이에요 ☕",
      daon: "일주일 내내 뵈니 이제 회장님 앞에서 먼저 웃게 돼요😅",
      naeun: "일주일 내내 뵈니 제 마음의 꽃도 활짝 피었어요, 회장님~",
      hina: "일주일 개근하신 회장님께 아껴둔 황금 별을 다 드릴게용♡",
      minji: "일주일간 모은 회장님 미소만 묶어도 멋진 영화예요 📸",
      sooyeon: "일주일 동행 완주! 회장님과 걷는 이 길이 제일 신납니다!",
      yoonseul: "일주일간 쌓인 회장님과의 추억을 책갈피에 적어뒀어요 🔖",
      sua: "수첩 끝에 회장님 개근 축하 꽃을 몰래 그렸어요 헤헤ㅎㅎ",
      taeo: "일주일을 정리하면, 회장님과 함께라 매일 즐거웠습니다.",
      "pet-cat": "일주일 개근이니 내 상자 반쪽을 내어주겠다옹, 회장님 🐾",
      "pet-dog": "일주일 내내 봐서 제 아끼는 공도 회장님께 드릴래요, 멍!",
      "pet-bori": "일주일간 회장님 발소리를 기다리는 시간이 행복했어요, 멍.",
      "pet-rabbit": "일주일 내내 다정히 와 주셔서 회장님 곁이 참 포근해요 🐰"
    }),
    comeback: Object.freeze([
      "잠시 숨 고르고 오셨군요, 회장님! 다시 만나서 참 반가워요!",
      "언제 오셔도 반가워요! 모아둔 도장은 그대로 지켜뒀어요.",
      "푹 쉬고 오셨나요, 회장님? 오늘부터 다시 가볍게 시작해요!",
      "다시 오셔서 기뻐요, 회장님! 오늘 도장부터 편히 찍어요.",
      "쉬어간 날도 괜찮아요! 모은 도장과 선물은 늘 그대로예요."
    ])
  });

  let memState = null;
  let storageBlocked = false;
  let lastClick = null;
  let justStampedDay = "";

  function getCore() {
    return root.HaniAttendance || null;
  }

  function getStorage() {
    try {
      return root.localStorage || null;
    } catch (_) {
      return null;
    }
  }

  // Approved 11/23: 7-day bonus ledger (+2 affinity, once per bonus day). Own key only; a malformed ledger is never overwritten.
  const BONUS_KEY = "hani_attendance_bonus_v1";
  function grantAttendanceBonus(storage, day, id) {
    try {
      const raw = storage.getItem(BONUS_KEY);
      const value = raw === null ? { v: 1, grants: {} } : JSON.parse(raw);
      if (!value || value.v !== 1 || !value.grants || typeof value.grants !== "object" || Array.isArray(value.grants)) return false;
      if (Object.prototype.hasOwnProperty.call(value.grants, day)) return true;
      value.grants[day] = id;
      storage.setItem(BONUS_KEY, JSON.stringify(value));
      return true;
    } catch (_) {
      return false;
    }
  }

  function hashSeed(text) {
    let n = 2166136261;
    for (let i = 0; i < text.length; i++) {
      n = Math.imul(n ^ text.charCodeAt(i), 16777619);
    }
    return n >>> 0;
  }

  function pickLine(list, seed) {
    if (!Array.isArray(list) || !list.length) return "";
    return list[hashSeed(seed) % list.length];
  }

  function profilePath(id) {
    return PROFILE_SPECIAL[id] || `./assets/profiles/thumb/hani-profile-${id}-256.webp`;
  }

  function dutyForDay(core, dayKey) {
    const idx = core.dutyIndex(dayKey, CREW.length);
    return CREW[idx] || CREW[0];
  }

  function loadSnapshotState(core) {
    const storage = getStorage();
    if (!storage) {
      storageBlocked = true;
      memState = memState || core.normalize(null);
      return memState;
    }
    if (storageBlocked && memState) return memState;
    const loaded = core.load(storage);
    if (loaded.unavailable) {
      storageBlocked = true;
      memState = memState || loaded.state;
      return memState;
    }
    if (loaded.broken) {
      // Do not overwrite broken data automatically; wait until the next stamp.
      memState = memState || loaded.state;
      return memState;
    }
    storageBlocked = false;
    memState = loaded.state;
    return memState;
  }

  function formatDutyTag(dayKey, isPet) {
    const role = isPet ? "오늘의 동물 당번" : "오늘의 출석 당번";
    const parts = typeof dayKey === "string" ? dayKey.split("-") : [];
    if (parts.length !== 3) return role;
    const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const wd = WD_KO[dt.getDay()];
    if (!wd) return role;
    return `${Number(parts[1])}월 ${Number(parts[2])}일(${wd}) · ${role}`;
  }

  function buildSlot(homeActions) {
    const section = document.createElement("section");
    section.id = section_id();
    section.className = "att-board";
    section.setAttribute("aria-label", "오늘의 출석 도장판");
    section.setAttribute("aria-live", "polite");

    const head = document.createElement("div");
    head.className = "att-head";

    const eyebrow = document.createElement("span");
    eyebrow.className = "att-eyebrow";
    eyebrow.textContent = "오늘의 출석 도장판";

    const badges = document.createElement("div");
    badges.className = "att-badges";

    const petBadge = document.createElement("span");
    petBadge.className = "att-badge is-pet";
    petBadge.textContent = "🐾 동물 당번 날";
    petBadge.hidden = true;

    const honorBadge = document.createElement("span");
    honorBadge.className = "att-badge is-honor";
    honorBadge.textContent = "👑 개근 후원자";
    honorBadge.hidden = true;

    badges.append(petBadge, honorBadge);
    head.append(eyebrow, badges);

    const dutyRow = document.createElement("div");
    dutyRow.className = "att-duty";

    const face = document.createElement("div");
    face.className = "face";

    const faceImg = document.createElement("img");
    faceImg.alt = "";
    faceImg.width = 56;
    faceImg.height = 56;
    faceImg.decoding = "async";

    const petSprite = document.createElement("span");
    petSprite.className = "att-pet-sprite";
    petSprite.setAttribute("aria-hidden", "true");
    petSprite.hidden = true;

    const faceFallback = document.createElement("span");
    faceFallback.className = "att-face-fallback";
    faceFallback.setAttribute("aria-hidden", "true");
    faceFallback.hidden = true;

    faceImg.addEventListener("error", () => {
      faceImg.hidden = true;
      if (petSprite.hidden) faceFallback.hidden = false;
    });

    face.append(faceImg, petSprite, faceFallback);

    const who = document.createElement("div");
    who.className = "who";
    const whoRole = document.createElement("div");
    whoRole.className = "att-role";
    whoRole.textContent = "오늘의 출석 당번";
    const whoName = document.createElement("div");
    whoName.className = "att-name";
    who.append(whoRole, whoName);

    dutyRow.append(face, who);

    const bubble = document.createElement("p");
    bubble.className = "bubble";

    const weekGrid = document.createElement("div");
    weekGrid.className = "att-week";
    weekGrid.setAttribute("role", "list");
    weekGrid.setAttribute("aria-label", "이번 주 출석 도장");

    const cells = DAYS_KO.map((label) => {
      const cell = document.createElement("div");
      cell.className = "att-cell";
      cell.setAttribute("role", "listitem");

      const markEl = document.createElement("span");
      markEl.className = "att-mark";
      markEl.setAttribute("aria-hidden", "true");

      const dayEl = document.createElement("span");
      dayEl.className = "att-day";
      dayEl.textContent = label;

      cell.append(markEl, dayEl);
      weekGrid.append(cell);
      return { cell, dayEl, markEl };
    });

    const rewardBox = document.createElement("div");
    rewardBox.className = "att-reward";
    rewardBox.hidden = true;

    const rewardMedia = document.createElement("div");
    rewardMedia.className = "att-reward-media";

    const rewardImg = document.createElement("img");
    rewardImg.alt = "";
    rewardImg.width = 46;
    rewardImg.height = 46;
    rewardImg.decoding = "async";

    const rewardPet = document.createElement("span");
    rewardPet.className = "att-pet-sprite";
    rewardPet.setAttribute("aria-hidden", "true");
    rewardPet.hidden = true;

    const rewardFallback = document.createElement("span");
    rewardFallback.className = "att-reward-fallback";
    rewardFallback.setAttribute("aria-hidden", "true");
    rewardFallback.textContent = "🎁";
    rewardFallback.hidden = true;

    rewardImg.addEventListener("error", () => {
      rewardImg.hidden = true;
      if (rewardPet.hidden) rewardFallback.hidden = false;
    });

    rewardMedia.append(rewardImg, rewardPet, rewardFallback);

    const rewardCopy = document.createElement("div");
    rewardCopy.className = "att-reward-copy";

    const rewardTitle = document.createElement("div");
    rewardTitle.className = "att-reward-title";

    const rewardText = document.createElement("p");
    rewardText.className = "att-reward-text";

    const rewardSecret = document.createElement("p");
    rewardSecret.className = "att-reward-secret";
    rewardSecret.hidden = true;

    rewardCopy.append(rewardTitle, rewardText, rewardSecret);
    rewardBox.append(rewardMedia, rewardCopy);

    const foot = document.createElement("div");
    foot.className = "att-foot";

    const streakEl = document.createElement("div");
    streakEl.className = "att-streak";
    const streakNum = document.createElement("b");
    streakNum.className = "att-streak-num";
    const streakSub = document.createElement("small");
    streakSub.className = "att-streak-sub";
    streakEl.append(streakNum, streakSub);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "att-btn";
    btn.addEventListener("click", handleStampClick);

    foot.append(streakEl, btn);

    const notice = document.createElement("p");
    notice.className = "att-notice";
    notice.hidden = true;

    section.append(head, dutyRow, bubble, weekGrid, rewardBox, foot, notice);
    section._attRefs = {
      petBadge,
      honorBadge,
      face,
      faceImg,
      petSprite,
      faceFallback,
      whoName,
      whoRole,
      bubble,
      cells,
      rewardBox,
      rewardImg,
      rewardPet,
      rewardFallback,
      rewardTitle,
      rewardText,
      rewardSecret,
      streakNum,
      streakSub,
      btn,
      notice
    };

    homeActions.parentNode.insertBefore(section, homeActions);
    return section;
  }

  function ensureSlot() {
    const home = document.getElementById("home");
    const homeActions = document.getElementById("homeActions");
    if (!home || !homeActions || !home.contains(homeActions)) return null;

    const existing = document.getElementById(section_id());
    if (existing) {
      if (existing.parentNode !== homeActions.parentNode || existing.nextElementSibling !== homeActions) {
        homeActions.parentNode.insertBefore(existing, homeActions);
      }
      if (existing._attRefs) return existing;
      existing.remove();
    }
    return buildSlot(homeActions);
  }

  function handleStampClick() {
    const core = getCore();
    if (!core) return;
    // Recompute todayKey on every click so midnight rollover is always respected.
    const today = core.todayKey();
    const storage = getStorage();
    let baseState = memState;

    if (!storageBlocked && storage) {
      const loaded = core.load(storage);
      if (loaded.unavailable) {
        storageBlocked = true;
        baseState = memState || loaded.state;
      } else if (loaded.broken) {
        baseState = memState || loaded.state;
      } else {
        baseState = loaded.state;
      }
    } else {
      storageBlocked = true;
      baseState = memState || core.normalize(null);
    }

    const res = core.stamp(baseState, today);
    memState = res.state;

    if (res.added) {
      justStampedDay = today;
      lastClick = {
        today,
        milestone: res.milestone,
        bonus: res.bonus,
        autoRest: res.autoRest,
        comeback: res.comeback
      };
      if (storage) {
        const saved = core.save(storage, res.state);
        if (!saved) storageBlocked = true;
        else if (res.bonus) lastClick.granted = grantAttendanceBonus(storage, today, dutyForDay(core, today).id);
      } else {
        storageBlocked = true;
      }
    }

    render();
  }

  function buildNoticeText(today, clickInfo) {
    const parts = [];
    if (storageBlocked) {
      parts.push("⚠️ 브라우저 저장소를 쓸 수 없어 이 화면에서만 임시 기록돼요.");
    }
    if (clickInfo && clickInfo.today === today && !clickInfo.milestone) {
      if (clickInfo.autoRest && clickInfo.autoRest.length) {
        parts.push(pickLine(LINES.rest, `${today}:rest`));
      } else if (clickInfo.comeback) {
        parts.push(pickLine(LINES.comeback, `${today}:comeback`));
      }
    }
    return parts.join(" · ");
  }

  function render() {
    const core = getCore();
    if (!core) return null;
    const section = ensureSlot();
    if (!section || !section._attRefs) return null;

    const refs = section._attRefs;
    const today = core.todayKey();
    const state = loadSnapshotState(core);
    const v = core.view(state, today);
    const duty = dutyForDay(core, today);

    // Card milestone classes: 14+ days -> gold border, 30+ days -> honor badge.
    const hasGold = v.unlocked.includes(14) || v.streak >= 14;
    const hasHop = v.unlocked.includes(3) || (lastClick && lastClick.today === today && lastClick.milestone === 3);
    section.classList.toggle("gold", hasGold);
    refs.face.classList.toggle("hop", hasHop);

    refs.petBadge.hidden = !duty.pet;
    refs.honorBadge.hidden = !v.honorBadge;

    // Portrait or pet sprite update
    if (duty.pet) {
      refs.faceImg.hidden = true;
      refs.faceImg.removeAttribute("src");
      refs.faceImg.alt = "";
      refs.faceFallback.hidden = true;
      refs.petSprite.hidden = false;
      refs.petSprite.style.backgroundImage = `url("${PET_SPRITES[duty.id]}")`;
      refs.rewardImg.hidden = true;
      refs.rewardImg.removeAttribute("src");
      refs.rewardImg.alt = "";
      refs.rewardFallback.hidden = true;
      refs.rewardPet.hidden = false;
      refs.rewardPet.style.backgroundImage = `url("${PET_SPRITES[duty.id]}")`;
    } else {
      refs.petSprite.hidden = true;
      refs.petSprite.style.backgroundImage = "";
      refs.faceFallback.textContent = duty.name.slice(0, 1);
      refs.faceFallback.hidden = true;
      const nextSrc = profilePath(duty.id);
      if (refs.faceImg.getAttribute("src") !== nextSrc) {
        refs.faceImg.src = nextSrc;
      }
      refs.faceImg.alt = `${duty.name} 프로필`;
      refs.faceImg.hidden = false;

      refs.rewardPet.hidden = true;
      refs.rewardPet.style.backgroundImage = "";
      refs.rewardFallback.hidden = true;
      if (refs.rewardImg.getAttribute("src") !== nextSrc) {
        refs.rewardImg.src = nextSrc;
      }
      refs.rewardImg.alt = `${duty.name} 보상 아이콘`;
      refs.rewardImg.hidden = false;
    }

    refs.whoRole.textContent = formatDutyTag(today, duty.pet);
    refs.whoName.textContent = duty.name;

    const dutyLines = LINES.duty[duty.id] || LINES.duty.hani;
    const speechList = v.done ? dutyLines.after : dutyLines.before;
    refs.bubble.textContent = pickLine(speechList, `${today}:${duty.id}:${v.done ? "after" : "before"}`);

    // 7-day / milestone gold reward box
    const clickInfo = (lastClick && lastClick.today === today) ? lastClick : null;
    const activeMilestone = clickInfo && clickInfo.milestone ? clickInfo.milestone : null;
    const showSecret7 = v.unlocked.includes(7) || v.streak >= 7;
    const secretLine = showSecret7 && LINES.secret7[duty.id] ? LINES.secret7[duty.id] : "";

    if (activeMilestone) {
      const mKey = String(activeMilestone);
      refs.rewardTitle.textContent = MILESTONE_TITLES[mKey] || `${activeMilestone}일 개근 보상! 🎁`;
      let mText = pickLine(LINES.milestone[mKey], `${today}:m:${activeMilestone}`);
      if (activeMilestone === 7 && clickInfo.bonus) {
        mText = clickInfo.granted
          ? `${mText} · ✨ ${duty.name} 호감도 +2 ♡`
          : `${mText} · ✨ ${duty.name}의 마음이 한 뼘 더 가까워졌어요`;
      }
      refs.rewardText.textContent = mText;
      if (secretLine) {
        refs.rewardSecret.textContent = `💌 "${secretLine}"`;
        refs.rewardSecret.hidden = false;
      } else {
        refs.rewardSecret.textContent = "";
        refs.rewardSecret.hidden = true;
      }
      refs.rewardBox.hidden = false;
    } else if (secretLine) {
      refs.rewardTitle.textContent = `7일 개근 보상 · ${duty.name}의 비밀 한마디 💌`;
      refs.rewardText.textContent = `"${secretLine}"`;
      refs.rewardSecret.textContent = "";
      refs.rewardSecret.hidden = true;
      refs.rewardBox.hidden = false;
    } else {
      refs.rewardTitle.textContent = "";
      refs.rewardText.textContent = "";
      refs.rewardSecret.textContent = "";
      refs.rewardSecret.hidden = true;
      refs.rewardBox.hidden = true;
    }

    // Mon-Sun 7 cells
    v.week.forEach((cellData, i) => {
      const slot = refs.cells[i];
      if (!slot) return;
      const cellDuty = dutyForDay(core, cellData.day);
      const isToday = cellData.day === today;
      const isStamp = cellData.state === "stamp";
      const isRest = cellData.state === "rest";
      const isMiss = cellData.state === "miss";
      const isFuture = cellData.state === "future";

      slot.cell.className = "att-cell";
      if (isToday) slot.cell.classList.add("is-today");
      if (isStamp) slot.cell.classList.add("stamped");
      if (isRest) slot.cell.classList.add("rest");
      if (isMiss) slot.cell.classList.add("miss");
      if (isFuture) slot.cell.classList.add("future");
      if (isStamp && isToday && justStampedDay === today) slot.cell.classList.add("pop");

      const dayNum = Number(cellData.day.slice(8, 10));
      slot.dayEl.textContent = Number.isFinite(dayNum) ? `${DAYS_KO[i]} ${dayNum}` : DAYS_KO[i];

      let mark = "";
      let stateLabel = "예정";
      if (isStamp) {
        mark = cellDuty.pet ? "🐾" : "⭐";
        stateLabel = cellDuty.pet ? "동물 당번 출석 완료" : "출석 완료";
      } else if (isRest) {
        mark = "🍀";
        stateLabel = "자동 휴식 보호";
      } else if (isToday) {
        mark = cellDuty.pet ? "🐾" : "·";
        stateLabel = "오늘 출석 대기";
      } else if (isMiss) {
        mark = "·";
        stateLabel = "미출석";
      } else if (isFuture && cellDuty.pet) {
        mark = "🐾";
        stateLabel = "동물 당번 예정";
      }

      slot.markEl.textContent = mark;
      slot.cell.setAttribute("aria-label", `${DAYS_KO[i]}요일 (${cellData.day}) ${stateLabel}`);
    });

    if (justStampedDay === today) {
      justStampedDay = "";
    }

    // Streak & next milestone footer
    refs.streakNum.textContent = `연속 ${v.streak}일째`;
    if (v.toNext > 0 && v.next) {
      refs.streakSub.textContent = `다음 보상(${v.next}일)까지 ${v.toNext}일`;
    } else {
      refs.streakSub.textContent = "이달 출석 보상 모두 달성! 👑";
    }

    if (v.done) {
      refs.btn.textContent = "오늘 도장 완료 ✓";
      refs.btn.disabled = true;
    } else {
      refs.btn.textContent = "오늘 도장 쾅!";
      refs.btn.disabled = false;
    }

    const noticeText = buildNoticeText(today, clickInfo);
    if (noticeText) {
      refs.notice.textContent = noticeText;
      refs.notice.classList.toggle("is-warn", storageBlocked);
      refs.notice.hidden = false;
    } else {
      refs.notice.textContent = "";
      refs.notice.hidden = true;
    }

    return v;
  }

  root.HaniAttendanceBoard = Object.freeze({
    render,
    CREW,
    LINES
  });

  if (typeof document !== "undefined" && document.getElementById("homeActions")) {
    render();
  }
})(typeof window !== "undefined" ? window : globalThis);
