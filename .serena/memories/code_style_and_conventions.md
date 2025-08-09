# コーディング規約と規則

## 共通原則

- **可読性重視**: 明確な変数名・関数名
- **型安全**: TypeScript/Python型アノテーション活用、any型禁止
- **パフォーマンス**: 不要な再レンダリング回避
- **保守性**: 単一責任原則、DRY原則遵守
- **セキュリティ**: XSS対策、適切なサニタイゼーション

## TypeScript/Next.js規約

### 命名規則

- **コンポーネント**: PascalCase (例: `ProjectList.tsx`)
- **関数**: camelCase (例: `getProjects`)
- **定数**: UPPER_SNAKE_CASE (例: `MAX_FILE_SIZE`)
- **型/インターフェース**: PascalCase (例: `ProjectData`)

### コンポーネント設計

```typescript
// Server Component例
export default async function ProjectPage({ params }: { params: { id: string } }) {
  const project = await getProject(params.id);
  return <ProjectDetail project={project} />;
}

// Client Component例
"use client";
export function ProjectForm({ onSubmit }: Props) {
  // クライアント側ロジック
}
```

### Server Actions

```typescript
'use server';
export async function updateScheduleItem(itemId: string, data: UpdateData) {
  const supabase = createClient();
  const { error } = await supabase
    .from('schedule_items')
    .update(data)
    .eq('id', itemId);

  if (error) throw error;
  revalidatePath('/projects/[id]', 'page');
  return { success: true };
}
```

## Python/FastAPI規約

### 命名規則

- **関数/変数**: snake_case (例: `process_pdf`)
- **クラス**: PascalCase (例: `ProjectService`)
- **定数**: UPPER_SNAKE_CASE (例: `MAX_FILE_SIZE`)

### 型アノテーション必須

```python
def process_pdf(file_path: str) -> dict[str, Any]:
    pass
```

### Pydanticスキーマ

```python
class ProjectCreateSchema(BaseModel):
    project_name: str = Field(..., min_length=1, max_length=255)
    construction_location: Optional[str] = None

    @validator('project_name')
    def validate_project_name(cls, v):
        return v.strip()
```

## Tailwind CSS規約

- ユーティリティクラス活用
- レスポンシブ: `sm:`, `md:`, `lg:` プレフィックス使用
- アニメーション: `transition-*`, `hover:*` クラス活用

## コミットメッセージ

- **形式**: `type: 簡潔な説明`
- **types**: feat, fix, chore, docs, style, refactor
- **例**: `feat: プロジェクト一覧画面の実装`

## コメント規則

- コメントは原則追加しない（コードで表現）
- 必要な場合のみ最小限で記述
