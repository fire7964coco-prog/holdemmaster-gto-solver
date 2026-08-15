const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const webpack = require("webpack");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const MiniCSSExtractPlugin = require("mini-css-extract-plugin");
const { VueLoaderPlugin } = require("vue-loader");

// Supabase 접속 정보는 저장소에 올리지 않고 빌드 시점에만 주입한다(.env.local, gitignore됨).
// 값이 없으면 빈 문자열이 들어가고, 솔버는 계정 저장 기능을 자동으로 숨긴다.
const readEnv = () => {
  const file = path.resolve(__dirname, ".env.local");
  if (!fs.existsSync(file)) return {};
  const entries = [];
  for (const rawLine of fs.readFileSync(file, "utf8").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const index = line.indexOf("=");
    entries.push([line.slice(0, index).trim(), line.slice(index + 1).trim()]);
  }
  return Object.fromEntries(entries);
};
const env = readEnv();

/*
 * 서비스워커 생성 플러그인.
 * sw-template.js의 자리표시자를 "이번 빌드에서 실제로 나온 파일 목록"으로 채운다.
 * 손으로 목록을 관리하면 반드시 어긋나므로 빌드 산출물에서 뽑아 쓴다.
 *
 * SHELL: 설치 즉시 저장 — HTML·CSS·진입 번들·워커 청크·아이콘 (약 0.7MB)
 * DATA : 설치한 사용자만 저장 — 트레이너 결정 데이터 + 교육 예제 13종 (약 2.3MB)
 * 그 외(wasm 계산 엔진, 로그인용 supabase 청크)는 쓰는 순간 런타임 캐시에 들어간다.
 *
 * ⚠ 워커 등 시작용 청크까지 SHELL에 넣는 이유: 첫 방문에는 서비스워커가 아직
 *    페이지를 제어하지 않아 그때 오간 요청이 캐시에 남지 않는다. 진입 번들만
 *    저장하면 「설치하자마자 비행기 모드」에서 앱이 뜨다 만다. 이미 받은 파일은
 *    조건부 요청(304)으로 끝나므로 실제 추가 전송량은 크지 않다.
 */
class GenerateServiceWorkerPlugin {
  apply(compiler) {
    const { RawSource } = compiler.webpack.sources;
    compiler.hooks.thisCompilation.tap("GenerateSW", (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: "GenerateSW",
          // 다른 플러그인(HTML·Copy)이 자산을 다 낸 뒤에 목록을 읽어야 한다
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
        },
        (assets) => {
          const names = Object.keys(assets).map((n) => n.replace(/\\/g, "/"));

          // 로그인(supabase) 청크는 219KB인데 로그인하는 사람만 쓴다 → 셸에서 빼고
          // 실제로 로그인할 때 런타임 캐시에 들어가게 둔다.
          const lazyFiles = new Set();
          for (const chunk of compilation.chunks) {
            let isLazyVendor = false;
            for (const mod of compilation.chunkGraph.getChunkModulesIterable(chunk)) {
              const id = mod.resource || (mod.identifier && mod.identifier()) || "";
              if (String(id).includes("@supabase")) {
                isLazyVendor = true;
                break;
              }
            }
            if (!isLazyVendor) continue;
            for (const file of chunk.files) lazyFiles.add(file.replace(/\\/g, "/"));
          }

          const entryFiles = [];
          for (const entry of compilation.entrypoints.values()) {
            for (const file of entry.getFiles()) entryFiles.push(file.replace(/\\/g, "/"));
          }

          const shell = [
            "/index.html",
            // 진입 번들 + 워커 등 시작에 필요한 청크
            // (wasm 계산 엔진 약 1MB는 제외 — 커스텀 계산을 쓸 때만 받는다)
            ...names
              .filter((n) => /\.(js|css)$/.test(n) && !lazyFiles.has(n))
              .map((n) => "/" + n),
            ...entryFiles.filter((f) => /\.(js|css)$/.test(f)).map((f) => "/" + f),
            ...names.filter((n) => n === "favicon.png" || n === "manifest.webmanifest").map((n) => "/" + n),
            ...names.filter((n) => n.startsWith("icons/")).map((n) => "/" + n),
          ];

          const data = [
            ...names.filter((n) => n === "trainer-decisions.json").map((n) => "/" + n),
            ...names.filter((n) => n.startsWith("preset-results/")).map((n) => "/" + n),
          ];

          const uniq = (a) => [...new Set(a)].sort();
          const shellList = uniq(shell);
          const dataList = uniq(data);

          // 캐시 이름에 쓸 버전. 파일명에 이미 내용 해시가 박혀 있으므로
          // 목록만 요약해도 "내용이 바뀌면 값이 바뀐다"가 성립한다.
          const version = crypto
            .createHash("sha1")
            .update(JSON.stringify([shellList, dataList]))
            .digest("hex")
            .slice(0, 12);

          const template = fs.readFileSync(path.resolve(__dirname, "sw-template.js"), "utf8");
          const source = template
            .replace("__CACHE_VERSION__", version)
            .replace("__SHELL__", JSON.stringify(shellList, null, 2))
            .replace("__DATA__", JSON.stringify(dataList, null, 2));

          compilation.emitAsset("sw.js", new RawSource(source));
          console.log(
            `[sw] 생성 완료 — 버전 ${version} / 셸 ${shellList.length}개 / 학습 데이터 ${dataList.length}개`
          );
        }
      );
    });
  }
}

/** @type {import("webpack").Configuration} */
module.exports = {
  mode: "production",
  entry: "./src/index.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[contenthash].js",
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
        options: { appendTsSuffixTo: [/\.vue$/] },
      },
      {
        test: /\.vue$/,
        loader: "vue-loader",
      },
      {
        test: /\.css$/,
        use: [
          MiniCSSExtractPlugin.loader,
          { loader: "css-loader", options: { importLoaders: 1 } },
          "postcss-loader",
        ],
      },
      {
        test: /\.png$/,
        loader: "url-loader",
      },
      {
        // wasm-bindgen 스레드 스니펫(workerHelpers.js)의 '../..' import가
        // strict ESM의 fully-specified 규칙에 걸리므로 완화
        test: /\.js$/,
        include: path.resolve(__dirname, "pkg"),
        resolve: { fullySpecified: false },
      },
    ],
  },
  resolve: { extensions: [".js", ".ts", ".vue"] },
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.DefinePlugin({
      __SUPABASE_URL__: JSON.stringify(env.SUPABASE_URL ?? ""),
      __SUPABASE_ANON_KEY__: JSON.stringify(env.SUPABASE_ANON_KEY ?? ""),
      // 오류 신고에 찍히는 빌드 번호 — 어느 배포에서 난 문제인지 구분한다
      __BUILD_ID__: JSON.stringify(
        new Date().toISOString().slice(0, 16).replace("T", " ")
      ),
    }),
    new CopyWebpackPlugin({ patterns: [{ from: "public" }] }),
    new HTMLWebpackPlugin({ template: "index.html" }),
    new MiniCSSExtractPlugin({ filename: "[contenthash].css" }),
    new VueLoaderPlugin(),
    new GenerateServiceWorkerPlugin(),
  ],
  experiments: {
    asyncWebAssembly: true,
  },
};
