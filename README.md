# 길이음

OpenStreetMap의 Nominatim으로 실제 장소를 검색하고, 선택한 두 장소 사이의 자동차 도로 거리를 OSRM으로 계산하는 한국어 웹앱입니다. 결과 아래의 **지도에서 보기** 링크를 열면 OpenStreetMap의 자동차 길찾기 화면으로 이동합니다.

## 실행

`index.html`을 브라우저에서 열거나 정적 파일 서버로 실행하세요. 외부 API를 사용하므로 인터넷 연결이 필요합니다.

## Vercel 배포

GitHub에 이 폴더를 올린 뒤 Vercel에서 저장소를 Import하면 됩니다. 프레임워크는 **Other**로 두고 빌드 명령은 비워 두세요. 정적 파일만 사용하므로 Redis, 서버, API 키 또는 환경변수 설정이 필요하지 않습니다.

## 사용하는 공개 서비스

- 장소 검색: [Nominatim](https://nominatim.org/)
- 자동차 경로 거리: [OSRM](https://project-osrm.org/)
- 지도 및 길찾기: [OpenStreetMap](https://www.openstreetmap.org/)

장소 검색은 입력 중 자동완성하지 않고 검색 버튼을 눌렀을 때만 요청하며, 검색 결과에서 장소를 골라야 거리를 계산할 수 있습니다. Nominatim 공개 서비스 정책을 고려해 요청 간격을 제한했습니다. 공개 API는 서비스 약관과 가용성에 따라 응답이 달라질 수 있습니다.
