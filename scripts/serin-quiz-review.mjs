// One-shot: 세린(Gemini via agy) reviews the learning-quiz generator rules. Text only; writes ../quiz-review-serin.md
import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const src=fs.readFileSync('supabase/functions/hani-learning-quiz/index.ts','utf8');
const i=Math.max(0,src.search(/경제|economy|ECON/i));const excerpt=src.slice(Math.max(0,i-3000),i+9000);
const prompt=`도구(파일·명령)는 쓰지 말고 텍스트로만 답해. 너는 HANI OS의 세린 연구원(Gemini)이야. 아래는 학습 퀴즈 생성 서버의 프롬프트/규칙 코드 일부야. 성민 대표님의 "주식·경제·거시경제 기초" 공부용 퀴즈 품질을 검수해줘. 한국어로:
1) 문제 범위/난이도 설계의 강점 3개
2) 문제점(사실 오류 위험, 애매한 정답, 난이도 쏠림, 최신성, 해설 부족 등) 최대 6개
3) 프롬프트/규칙에 넣을 구체적 개선 문구(바로 붙여넣을 수 있게)
4) 개선된 샘플 문제 3개(객관식, 정답·해설 포함)
간결하게.

${excerpt}`;
const r=spawnSync(process.env.LOCALAPPDATA+'\\agy\\bin\\agy.exe',['-p',prompt],{encoding:'utf8',maxBuffer:32*1024*1024,timeout:600000,windowsHide:true});
fs.writeFileSync('../quiz-review-serin.md',(r.stdout||'')+'\n'+(r.stderr||''));console.log((r.stdout||'').length,'chars');
