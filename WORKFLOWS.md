# Profile README Workflows

## Secrets

| Secret | 必須/任意 | 用途 |
| --- | --- | --- |
| `GITHUB_TOKEN` | 必須（Actionsが自動付与） | `profile-update.yml` の `lowlighter/metrics` 参照、`readme-link-check.yml` の `lychee-action` 実行 |
| `GH_TOKEN` | 任意（未使用） | 旧構成互換用。現行構成では使用しない |

## Workflows

- `.github/workflows/profile-update.yml`
  - 役割: `github-metrics.svg` と `lapras/score.png` の更新
  - 実行: `workflow_dispatch`, 毎日 `0 19 * * *`
- `.github/workflows/readme-link-check.yml`
  - 役割: `README.md` のリンク死活監視
  - 実行: `workflow_dispatch`, 毎週月曜 `0 3 * * 1`
