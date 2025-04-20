# インストールガイド

## 前提条件

### システム要件
- Node.js 18.x以上
- Python 3.8以上
- ffmpeg 4.x以上

### 必要なAPI
1. OpenRouter API
   - アカウント作成: https://openrouter.ai/
   - APIキーの取得

2. Unsplash API
   - アカウント作成: https://unsplash.com/developers
   - アプリケーション登録
   - アクセスキーの取得

3. Slack Webhook
   - Slack App作成
   - Incoming Webhookの設定
   - Webhook URLの取得

## インストール手順

### 1. リポジトリのクローン
```bash
git clone [repository-url]
cd video-generator
```

### 2. Node.js依存関係のインストール
```bash
npm install
```

### 3. OpenVoiceのセットアップ
```bash
# OpenVoiceリポジトリのクローン
git clone https://github.com/myshell-ai/OpenVoice
cd OpenVoice

# 依存関係のインストール
pip install -r requirements.txt

# 基本モデルのダウンロード
python download.py --model_name base_speakers
```

### 4. 環境変数の設定
1. `.env.example`を`.env`にコピー
```bash
cp .env.example .env
```

2. `.env`ファイルを編集し、必要な値を設定
```
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_MODEL=shisa-ai/shisa-v2-llama3.3-70b:free
UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
SLACK_WEBHOOK_URL=your_webhook_url_here
OPENVOICE_PATH=/path/to/openvoice
OUTPUT_DIR=output/videos
```

### 5. 出力ディレクトリの作成
```bash
mkdir -p output/videos
```

## 動作確認

### 1. 基本テスト
```bash
npm start
```

### 2. ログの確認
- コンソール出力を確認
- `output/videos`ディレクトリに生成ファイルが存在するか確認
- Slackに通知が届いているか確認

## トラブルシューティング

### よくある問題と解決方法

1. OpenVoiceの実行エラー
   - Pythonのバージョンを確認
   - 必要なPythonパッケージが全てインストールされているか確認
   - モデルファイルが正しくダウンロードされているか確認

2. ffmpegエラー
   - ffmpegのインストール確認
   - パスが通っているか確認
   - 必要なコーデックが利用可能か確認

3. API関連のエラー
   - APIキーの有効性確認
   - クォータ制限の確認
   - ネットワーク接続の確認

4. ファイル権限エラー
   - 出力ディレクトリの権限確認
   - 一時ファイル作成権限の確認

## サポート

問題が解決しない場合は、以下の情報を添えてサポートにご連絡ください：

1. エラーメッセージ
2. 環境情報（OS、Node.js、Python、ffmpegのバージョン）
3. 実行ログ
4. 設定ファイルの内容（APIキーを除く） 