# 절 요성난무 4페이즈 타임라인 트레이너

파이널 판타지 XIV 고난도 레이드 **절 요성난무**의 4페이즈 기믹을 연습하기 위한 비공식 GitHub Pages 사이트입니다.

> [절 요성난무 4페이즈 트레이너](https://yul0317.github.io/)

진실·거짓 판정, 그랜드 크로스, 혼돈의 불과 물, 무의 범람, 마력 방출 등 4페이즈의 주요 기믹을 다음 기능으로 익힐 수 있습니다.

| 기능       | 설명                           |
| ---------- | ------------------------------ |
| 설명       | 기믹 원리와 전체 타임라인 확인 |
| 퀴즈       | 무작위 상황별 처리 방법 연습   |
| 시뮬레이션 | 직업별 1~16단계 순차 연습      |
| 컨닝페이퍼 | 주요 판정을 빠르게 확인        |

공략을 처음 익히거나 이미 학습한 처리법을 반복해서 복습할 때 사용하는 것을 목표로 합니다.

<details>
<summary><strong>Windows에서 로컬 실행</strong></summary>

<br>

이 프로젝트는 Jekyll을 사용하므로 Ruby와 Bundler가 필요합니다. GitHub Pages의 빌드 환경과 호환성을 맞추기 위해 **Ruby 3.3.x** 사용을 권장합니다.

- [GitHub Pages 로컬 실행 공식 안내](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/testing-your-github-pages-site-locally-with-jekyll)
- [GitHub Pages 의존성 버전](https://pages.github.com/versions/)

### 1. Ruby 설치

1. [RubyInstaller 다운로드 페이지](https://rubyinstaller.org/downloads/)에 접속합니다.
2. **Ruby+Devkit 3.3.x (x64)** 버전을 내려받습니다.
3. 설치 과정에서 **Add Ruby executables to your PATH**를 체크합니다.
4. 설치 마지막 화면에서 **Run ridk install**을 체크한 상태로 완료합니다.

> Ruby 4.x에서는 GitHub Pages가 사용하는 Jekyll 및 Liquid 버전과 호환 문제가 발생할 수 있습니다. `csv`, `bigdecimal`, `tainted?` 관련 오류가 나타난다면 Ruby 3.3.x가 설치되어 있는지 확인하세요.

`ridk install` 창이 열리면 다음 선택 화면이 나타납니다.

```text
1 - MSYS2 base installation
2 - MSYS2 system update (optional)
3 - MSYS2 and MINGW development toolchain

Which components shall be installed? If unsure press ENTER [1,3]
```

기본값인 `1,3`을 설치하도록 그대로 `Enter`를 누릅니다. 설치가 끝나고 선택 화면이 다시 나타나면서 기본값이 `[]`로 표시되면, 아무것도 입력하지 않고 다시 `Enter`를 눌러 종료합니다.

설치가 끝나면 기존 명령 프롬프트와 VS Code를 모두 닫은 뒤 다시 실행합니다.

### 2. Ruby 설치 확인

새 명령 프롬프트 또는 VS Code 터미널에서 다음 명령을 실행합니다.

```cmd
ruby --version
gem --version
```

두 명령 모두 버전이 표시되어야 합니다.

```text
ruby 3.3.x
```

Ruby 4.x가 표시된다면 Windows 앱 설정에서 Ruby 4를 제거하고 Ruby+Devkit 3.3.x를 설치하는 것을 권장합니다.

### 3. Bundler 설치

```cmd
gem install bundler
bundle --version
```

`bundle --version`에서 버전이 표시되면 준비가 완료된 것입니다.

### 4. 프로젝트 의존성 설치

프로젝트 폴더로 이동한 뒤 `Gemfile`에 정의된 패키지를 설치합니다.

```cmd
cd yul0317.github.io
bundle install
```

프로젝트 위치가 다르다면 `cd` 경로를 실제 저장 위치에 맞게 변경합니다. 최초 설치는 패키지를 내려받고 빌드하므로 시간이 조금 걸릴 수 있습니다.

### 5. 로컬 서버 실행

```cmd
bundle exec jekyll serve --livereload
```

브라우저에서 다음 주소로 접속합니다.

```text
http://localhost:4000
```

`--livereload` 옵션을 사용하면 파일을 저장했을 때 브라우저가 자동으로 새로고침됩니다. 서버를 종료하려면 실행 중인 터미널에서 `Ctrl+C`를 누릅니다.

> VS Code의 Live Server는 Jekyll의 `{% include %}` 문법을 처리하지 못합니다. 이 프로젝트는 반드시 `bundle exec jekyll serve`로 실행해야 합니다.

또한 프로젝트 폴더에서는 `jekyll serve`를 직접 실행하지 말고 항상 `bundle exec`를 붙여야 합니다. 그래야 전역 Jekyll이 아닌 `Gemfile.lock`에 기록된 프로젝트 버전이 실행됩니다.

### 자주 발생하는 오류

#### `'ruby' 또는 'gem'은(는) ... 명령이 아닙니다`

Ruby가 설치되지 않았거나 PATH가 아직 반영되지 않은 상태입니다.

- RubyInstaller 설치 시 **Add Ruby executables to your PATH**가 체크됐는지 확인합니다.
- 명령 프롬프트와 VS Code를 완전히 종료한 뒤 다시 실행합니다.
- 새 명령 프롬프트에서 `where ruby`를 실행해 설치 경로가 나오는지 확인합니다.

#### `'bundle'은(는) ... 명령이 아닙니다`

Ruby 설치를 확인한 뒤 Bundler를 설치합니다.

```cmd
gem install bundler
```

설치 후 터미널을 다시 열고 `bundle --version`을 확인합니다.

#### MSYS2 관련 빌드 오류

RubyInstaller와 함께 설치되는 개발 도구가 필요한 경우 다음 명령을 실행합니다.

```cmd
ridk install
```

선택 화면에서 `1,3`을 입력하거나 기본값이 `[1,3]`이면 그대로 `Enter`를 누릅니다.

#### `csv`, `bigdecimal` 또는 `tainted?` 오류

Ruby 4.x와 GitHub Pages용 Jekyll/Liquid 사이의 호환 문제일 가능성이 높습니다. 다음 명령으로 현재 Ruby 버전을 확인합니다.

```cmd
ruby --version
```

Ruby 4.x라면 Ruby 3.3.x로 교체한 뒤, Ruby 4 환경에서 생성된 잠금 파일을 다시 만듭니다.

```cmd
cd yul0317.github.io
del Gemfile.lock
gem install bundler
bundle install
bundle exec jekyll serve --livereload
```

#### 전역 Jekyll과 프로젝트 버전 충돌

`already activated` 또는 gem 버전 충돌 오류가 발생하면 `jekyll` 명령을 직접 실행하지 않았는지 확인합니다.

```cmd
bundle exec jekyll -v
bundle exec jekyll serve --livereload
```

#### 의존성 설치를 처음부터 다시 확인하고 싶을 때

```cmd
bundle install
bundle exec jekyll serve --livereload
```

GitHub Pages와 가까운 환경으로 실행하기 위해 이 프로젝트는 `github-pages` gem을 사용합니다.

</details>

## 프로젝트 구조

```text
.
├── _includes/          # 탭별 HTML
├── assets/
│   ├── css/            # 공통 및 기능별 스타일
│   └── js/             # 기믹, UI 공통 로직과 기능별 스크립트
├── img/                # 기믹, 시뮬레이션 및 직업 이미지
├── tests/              # Node.js 기반 기믹 불변식 검사
├── _config.yml         # Jekyll 사이트 설정
├── favicon.ico         # 사이트 파비콘
├── Gemfile             # 로컬 빌드 의존성
└── index.html          # 페이지 공통 구조와 자산 로딩
```

## 주요 수정 위치

- 설명 내용과 타임라인: `_includes/guide.html`
- 랜덤 퀴즈 화면: `_includes/quiz.html`, `assets/js/quiz.js`
- 순차 시뮬레이션: `_includes/simulation.html`, `assets/js/simulation.js`
- 공통 기믹 판정: `assets/js/mechanics.js`
- 공통 결과·점수 UI: `assets/js/ui.js`
- 컨닝페이퍼: `_includes/cheatsheet.html`, `assets/js/cheatsheet.js`
- 반응형 스타일: `assets/css/responsive.css`

## 기믹 로직 검사

Ruby/Jekyll과 별개로 공통 기믹 배정 규칙은 Node.js에서 빠르게 검사할 수 있습니다.

```cmd
node tests/mechanics.test.js
node tests/browser-smoke.test.js
```

첫 번째 검사는 그랜드 크로스 분배, 회차 간 금지 조합, 가속도 대상자 수와 3회차 디버프 인원을 무작위 상황 10,000개로 확인합니다. 두 번째 검사는 브라우저 스크립트 로딩 순서와 초기화 과정에 누락된 참조가 없는지 확인합니다.

## 배포

`main` 브랜치의 변경 사항을 GitHub에 푸시하면 GitHub Pages가 Jekyll 사이트를 빌드하여 배포합니다.
