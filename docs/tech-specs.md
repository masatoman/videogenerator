# 技術仕様書

## 1. システムアーキテクチャ

### 1.1 全体構成
```
src/features/video-generator/
├── contentGen.ts      # コンテンツ生成
├── voiceGen.ts       # 音声合成
├── imageGen.ts       # 画像処理
├── videoRender.ts    # 動画生成
├── notifySlack.ts    # Slack通知
└── video-generator.ts # メイン処理
```

### 1.2 依存関係
- Node.js v18.x以上
- TypeScript v5.x
- ffmpeg v6.x
- ImageMagick v7.x
- OpenVoice（ローカル実行）

## 2. 外部API仕様

### 2.1 OpenRouter API
- エンドポイント: `https://api.openrouter.ai/api/v1/chat/completions`
- モデル: `shisa-ai/shisa-v2-llama3.3-70b:free`
- 認証: Bearer token
- レート制限: 10req/min

### 2.2 Unsplash API
- エンドポイント: `https://api.unsplash.com/photos/random`
- 認証: Access Key
- レート制限: 50req/hour

### 2.3 Slack Webhook
- エンドポイント: 設定済みWebhook URL
- ペイロード形式: JSON
- 通知頻度: 生成プロセスの開始/完了時

## 3. 内部モジュール仕様

### 3.1 ContentGenerator
- 入力: なし
- 出力: `{ englishPhrase: string; japaneseTranslation: string }`
- バリデーション: 文字数制限、キーワード確認

### 3.2 VoiceGenerator
- 入力: `{ text: string; outputPath: string }`
- 出力: `{ audioPath: string; duration: number }`
- 音声フォーマット: WAV, 44.1kHz, 16bit, モノラル

### 3.3 ImageGenerator
- 入力: `{ keyword: string; outputPath: string }`
- 出力: `{ imagePath: string; width: number; height: number }`
- 画像フォーマット: JPEG, 1080x1920px

### 3.4 VideoRenderer
- 入力: `{ audioPath: string; imagePath: string; subtitles: string[]; outputPath: string }`
- 出力: `{ videoPath: string; duration: number }`
- 動画フォーマット: MP4, H.264, 30fps

## 4. データフロー

1. コンテンツ生成
   ```typescript
   const content = await contentGen.generateContent();
   ```

2. 音声合成
   ```typescript
   const audio = await voiceGen.generateVoice(content.englishPhrase, audioPath);
   ```

3. 画像取得
   ```typescript
   const image = await imageGen.getBackgroundImage(content.englishPhrase, imagePath);
   ```

4. 動画生成
   ```typescript
   const video = await videoRender.createVideo({
     audioPath: audio.path,
     imagePath: image.path,
     subtitles: [content.englishPhrase, content.japaneseTranslation],
     outputPath
   });
   ```

5. 通知送信
   ```typescript
   await notifySlack.send({
     status: 'success',
     videoPath: video.path,
     duration: video.duration
   });
   ```

## 5. エラーハンドリング

### 5.1 リトライ戦略
- API呼び出し: 最大3回
- ファイル操作: 最大2回
- インターバル: 指数バックオフ

### 5.2 エラーログ
- レベル: INFO, WARN, ERROR
- 出力先: コンソール, ファイル
- フォーマット: JSON

### 5.3 クリーンアップ
- 一時ファイル: 生成完了後に削除
- 古い出力: 7日経過後に自動削除 