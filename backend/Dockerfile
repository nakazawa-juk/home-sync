# Python 3.11ベースイメージを使用
FROM python:3.11-slim

# 作業ディレクトリを設定
WORKDIR /app

# システムの依存関係をインストール
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Pythonの依存関係ファイルをコピー
COPY requirements.txt .

# Pythonパッケージをインストール
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# アプリケーションのソースコードをコピー
COPY ./app ./app

# 実行ユーザーを作成（セキュリティのため）
RUN useradd --create-home --shell /bin/bash app && \
    chown -R app:app /app
USER app

# ポートを公開
EXPOSE 8000

# アプリケーションを起動
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]