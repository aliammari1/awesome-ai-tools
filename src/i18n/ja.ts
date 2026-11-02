import type { MessageKey } from './en';

export const ja: Record<MessageKey, string> = {
  'site.name': 'Awesome AI Tools',
  'site.tagline': 'わかりやすく説明した、オープンな AI ツールのカタログ。',

  'nav.directory': 'ディレクトリ',
  'nav.domains': '分野',
  'nav.collections': 'コレクション',
  'nav.saved': '保存済み',
  'nav.methodology': '掲載方針',
  'nav.contribute': '貢献する',
  'nav.insights': '統計データ',
  'nav.changelog': '更新履歴',
  'nav.privacy': 'プライバシー',
  'nav.linkHealth': 'リンク状態',
  'nav.primary': 'メイン',
  'nav.mobile': 'モバイル',
  'nav.menu': 'メニュー',
  'nav.search': '検索',
  'nav.searchTools': 'ツールを検索',
  'nav.theme': 'カラーテーマを切り替える',
  'nav.home': 'Awesome AI Tools ホーム',
  'nav.star': 'スター',
  'nav.starSuffix': '（GitHub）',
  'common.skip': '本文へスキップ',
  'common.backToTop': 'ページの先頭へ',
  'common.lastUpdated': 'カタログ最終更新: {date}',

  'lang.label': '言語',
  'lang.switchTo': '言語を{language}に切り替える',
  'lang.suggest': 'このサイトは{language}でも利用できます。',
  'lang.suggestAction': '{language}に切り替える',
  'lang.dismiss': '閉じる',

  'notice.title': 'インターフェースは翻訳済みです。',
  'notice.body': 'ツール名と説明は英語です。',
  'notice.link': '英語のページを見る',

  'hero.title': '{count} 個の AI ツールを、わかりやすく紹介。',
  'hero.lead':
    '{domains} の分野をカバーする無料のオープンなカタログです。ランキングも、広告枠も、アフィリエイトリンクもありません。各ツールが何をするものか、どこで見つかるかだけをお伝えします。',
  'hero.placeholder': '「コーディングエージェント」「音声文字起こし」「オープンソース」などを検索',
  'hero.search': '検索',
  'hero.searchLabel': '{count} 個の AI ツールを検索',
  'hero.statTools': 'ツール',
  'hero.statDomains': '分野',
  'hero.statOpenSource': 'オープンソース',
  'hero.popular': '人気の分野',
  'hero.allDomains': '全 {count} 分野',

  'page.home.description':
    '{domains} 分野・{count} 個の AI ツールを検索。平易な説明、オープンなメタデータ、保存リスト、横並び比較。ランキングや広告掲載はありません。',
  'page.category.description': '{description} カタログ内の {count} 件のツールを閲覧できます。',
  'page.saved.title': '保存したツール',
  'page.saved.description': 'このブラウザにローカル保存されたツール、リスト、メモ、個人スタック。',
  'page.saved.lead':
    'あなた専用のワークスペースです。リスト、メモ、タグ、使用中マークはこのブラウザにのみ保存され、外部には送信されません。',
  'page.compare.title': 'ツールを比較',
  'page.compare.description':
    '記録されたカタログのメタデータを使って最大3つの AI ツールを並べて比較します。',
  'page.compare.lead':
    '最大3つのツールを横並びで比較できます。ページの URL に選択内容が含まれるため、そのまま共有できます。',
  'page.contribute.title': 'ツールを提案',
  'page.contribute.description':
    'ディレクトリへの AI ツールの提案やカタログエントリの追加を行えます。',
  'page.contribute.lead':
    '掲載すべきツールを見つけたら、ブラウザ上でスキーマ検証して JSON を出力するか、GitHub Issue を作成できます。',
  'page.methodology.title': 'キュレーション方針',
  'page.methodology.description':
    'Awesome AI Tools がどのようにカタログ項目を選定、記録、検証、維持しているか。',
  'page.methodology.lead':
    '掲載はツールの発見を助けるものであり、推奨、ランキング、セキュリティ保証ではありません。',
  'page.collections.title': '厳選コレクション',
  'page.collections.description':
    '分野やオープンソース属性など、記録されたメタデータから構成したテーマ別一覧。',
  'page.insights.title': 'カタログ統計',
  'page.insights.description':
    '分野別の件数、オープンソース比率、時期別の追加数など、カタログから直接算出されたデータ。',
  'page.changelog.title': 'カタログ更新履歴',
  'page.changelog.description':
    '記録されたソース日付に基づくコミュニティ追加およびカタログ移行の時系列ログ。',
  'page.privacy.title': 'プライバシーとローカル保存',
  'page.privacy.description':
    'ブラウザ内に保存されているすべてのキーを確認し、ワンクリックでローカルデータを消去できます。',
  'page.linkHealth.title': 'リンク健全性レポート',
  'page.linkHealth.description': '外部リンクの自動チェック設定と検証レポート。',
  'page.notFound.title': 'ページが見つかりません',
  'page.notFound.description': '指定されたページは存在しません。',
  'page.notFound.lead':
    'リンクが古いか、ツールがカタログから削除された可能性があります。ディレクトリを検索して目的のツールをお探しください。',
  'page.notFound.search': 'ディレクトリを検索',
  'page.notFound.home': 'ホームページへ戻る',

  'footer.about':
    'わかりやすく説明した、オープンな AI ツールのカタログ。JSON ファイルで管理され、このサイトとリポジトリの README の両方に反映されます。有料掲載もアフィリエイトリンクもありません。',
  'footer.browse': '探す',
  'footer.allTools': 'すべてのツール',
  'footer.domains': '分野',
  'footer.saved': '保存したリスト',
  'footer.compare': 'ツールを比較',
  'footer.project': 'プロジェクト',
  'footer.methodology': '掲載方針',
  'footer.suggest': 'ツールを提案',
  'footer.repo': 'GitHub リポジトリ',
  'footer.issue': '問題を報告',
  'footer.governance': 'ガバナンス',
  'footer.contributing': '貢献ガイド',
  'footer.conduct': '行動規範',
  'footer.security': 'セキュリティポリシー',
  'footer.license': 'CC0 1.0 ライセンス',
  'footer.copyright': 'CC0 1.0 パブリックドメイン · {year}',
  'footer.disclaimer': '掲載は推奨を意味しません。詳細は各ツールの公式サイトでご確認ください。',
};
