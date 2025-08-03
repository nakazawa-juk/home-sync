# Ticket 003: データベース連携実装

## 概要

Supabase データベースとの連携実装

## 実装範囲

- [x] Supabase セットアップ
  - [x] プロジェクト作成
  - [x] データベーススキーマ作成
  - [x] テーブル作成（projects, project_schedules, schedule_items）
  - [x] RLS（Row Level Security）設定（設計要件により不要と判断）
- [x] Next.js 側実装
  - [x] Supabase クライアント設定
  - [x] Server Actions実装
  - [x] データ取得・更新ロジック
  - [ ] DBデータと繋ぎ込みしていない、モックデータを未だ使用している画面を洗い出し、DBデータを使うようにする。
  - [ ] 認証機能（基本）
- [ ] Python FastAPI 側実装
  - [ ] Supabase Python クライアント設定
  - [ ] PDF処理後のデータ保存
  - [ ] データ取得・更新 API
- [ ] 統合テスト
  - [ ] PDF アップロード → DB 保存 → Web 表示フロー
  - [ ] データ更新 → PDF 出力フロー
  - [ ] エラーハンドリング確認

## 技術仕様

- Supabase (PostgreSQL)
- Next.js Server Actions
- Supabase JavaScript/Python クライアント

## 完了条件

- 全てのCRUD操作が動作する
- PDF処理からDB保存まで連携動作する
- Web画面でリアルタイムデータが表示される

## 備考

本チケット完了でMVP完成
