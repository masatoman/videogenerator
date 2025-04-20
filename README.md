# ShiftWith ビデオジェネレーター

## 概要
ShiftWithアプリ向けの英語教育ショート動画（Instagram/TikTok用）を自動生成するツールです。
ギバー（利他的な性格）の人向けに、英語フレーズと日本語訳を含む15-30秒の動画を生成します。

## 主な機能
- OpenRouter APIによる英語フレーズ生成
- OpenVoiceによる自然な音声合成
- Unsplash APIによる背景画像取得
- ffmpegによる動画生成（テキストオーバーレイ付き）
- Slack通知機能

## 必要条件
- Node.js 18.x以上
- Python 3.8以上
- ffmpeg 4.x以上
- 各種APIキー（OpenRouter, Unsplash）
- Slack Webhook URL

## クイックスタート
```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集して必要な値を設定

# 実行
npm start
```

## 詳細ドキュメント
- [インストールガイド](doc/INSTALL.md)
- [MVP仕様書](doc/MVP.md)

## 出力例
生成される動画は以下の特徴を持ちます：
- 縦型フォーマット（1080x1920）
- 英語フレーズと日本語訳のテキストオーバーレイ
- 自然な英語音声
- 関連する背景画像

## ディレクトリ構造
```
video-generator/
├── .env                # 環境変数設定ファイル（APIキー等）
├── .env.example        # 環境変数のテンプレート
├── README.md          # プロジェクトのドキュメント
├── package.json       # プロジェクトの依存関係と設定
├── package-lock.json  # 依存関係の詳細なバージョン情報
├── tsconfig.json      # TypeScriptの設定
├── src/               # ソースコードディレクトリ
│   └── features/
│       └── video-generator/
│           ├── contentGen.ts    # 英語フレーズ生成モジュール
│           ├── voiceGen.ts      # OpenVoice音声合成モジュール
│           ├── imageGen.ts      # Unsplash画像取得モジュール
│           ├── videoRender.ts   # ffmpeg動画生成モジュール
│           ├── notifySlack.ts   # Slack通知モジュール
│           └── video-generator.ts # メインモジュール
├── output/            # 生成されたファイルの出力ディレクトリ
│   └── videos/        # 生成された動画の保存先
├── OpenVoice/         # OpenVoice音声合成エンジンのディレクトリ
├── config/            # アプリケーション設定ファイル
├── scripts/           # ユーティリティスクリプト
└── node_modules/      # npmパッケージの依存関係
```

## 開発者向け情報
- TypeScript + ESModules使用
- 非同期処理（async/await）対応
- モジュラー設計
- 環境変数による設定管理

## ライセンス
MIT License

## 貢献
1. このリポジトリをフォーク
2. 機能ブランチを作成
3. 変更をコミット
4. ブランチにプッシュ
5. プルリクエストを作成

## サポート
問題や質問がある場合は、Issueを作成してください。 