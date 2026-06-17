# 내 차 여기 세워둠 - Parking Web App

손그림 PNG 요소를 얹은 주차 위치 기록 웹앱입니다.

## 기능
- 모바일 카메라로 주차 기둥 사진 촬영
- 위치 메모, 지상/지하/층 기록
- 주차 시작 후 실시간 주차 시간 표시
- 출차 완료 시 일반 기록 삭제
- 장기주차용 저장 목록
- 서버 없이 브라우저 localStorage에 저장

## 실행
```bash
npm install
npm run dev
```

## GitHub Pages 배포
```bash
npm run build
```
생성된 `dist` 폴더를 GitHub Pages에 배포하면 됩니다.

## 디자인 PNG 교체
`public/assets` 안의 PNG 파일을 같은 이름으로 교체하면 앱 디자인이 그대로 바뀝니다.
