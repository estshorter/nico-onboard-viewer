import os
import json
import shutil
import re
import argparse
import datetime
import pandas as pd

SOURCE_JSON = r"C:\Users\estshorter\src\nico-analyzer\results\first_onboard_all.json"
OUTPUT_DIR = r"C:\Users\estshorter\src\nico-onboard-viewer"
EXCLUDED_USERS_FILE = os.path.join(OUTPUT_DIR, "excluded_users.json")
INDEX_HTML_FILE = os.path.join(OUTPUT_DIR, "index.html")
README_MD_FILE = os.path.join(OUTPUT_DIR, "README.md")


def get_one_year_ago(ref_date: datetime.date) -> datetime.date:
    """1年前の日付を取得する（うるう年対応）"""
    try:
        return ref_date.replace(year=ref_date.year - 1)
    except ValueError:
        return ref_date.replace(year=ref_date.year - 1, day=28)


def update_file_text(path: str, update_fn) -> bool:
    """ファイル内容をLF改行で更新する"""
    if not os.path.exists(path):
        return False
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()

    new_text = update_fn(text)
    if new_text != text:
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            f.write(new_text)
        return True
    return False


def update_documentation_dates(ref_date: datetime.date):
    """index.html および README.md の基準日・期間表記を自動更新する"""
    prev_date = get_one_year_ago(ref_date)

    ref_year, ref_month, ref_day = ref_date.year, ref_date.month, ref_date.day
    prev_year, prev_month, prev_day = prev_date.year, prev_date.month, prev_date.day

    ref_date_str = f"{ref_year}年{ref_month}月{ref_day}日"
    prev_date_str = f"{prev_year}年{prev_month}月{prev_day}日"
    period_str = f"{prev_year}年{prev_month}月〜{ref_year}年{ref_month}月"

    # 1. index.html の更新
    def replace_html(html: str) -> str:
        html = re.sub(
            r"直近1年間（\d{4}年\d{1,2}月[〜～]\d{4}年\d{1,2}月）",
            f"直近1年間（{period_str}）",
            html
        )
        html = re.sub(
            r"（データ集計基準日:\s*\d{4}年\d{1,2}月\d{1,2}日）",
            f"（データ集計基準日: {ref_date_str}）",
            html
        )
        html = re.sub(
            r"（集計基準日:\s*\d{4}年\d{1,2}月\d{1,2}日）",
            f"（集計基準日: {ref_date_str}）",
            html
        )
        html = re.sub(
            r"データ集計基準日（\d{4}年\d{1,2}月\d{1,2}日）",
            f"データ集計基準日（{ref_date_str}）",
            html
        )
        return html

    if update_file_text(INDEX_HTML_FILE, replace_html):
        print(f"Updated dates in {INDEX_HTML_FILE} -> 基準日: {ref_date_str}, 期間: {period_str}")

    # 2. README.md の更新
    def replace_readme(readme: str) -> str:
        readme = re.sub(
            r"- \*\*データ集計基準日\*\*:\s*\*\*\d{4}年\d{1,2}月\d{1,2}日\*\*",
            f"- **データ集計基準日**: **{ref_date_str}**",
            readme
        )
        readme = re.sub(
            r"集計基準日（\d{4}年\d{1,2}月\d{1,2}日）から遡って1年以内（\d{4}年\d{1,2}月\d{1,2}日以降）",
            f"集計基準日（{ref_date_str}）から遡って1年以内（{prev_date_str}以降）",
            readme
        )
        return readme

    if update_file_text(README_MD_FILE, replace_readme):
        print(f"Updated dates in {README_MD_FILE} -> 基準日: {ref_date_str} (1年前: {prev_date_str})")



def load_excluded_user_ids() -> set[int]:
    """除外対象ユーザーIDのセットを取得する"""
    excluded = set()
    if os.path.exists(EXCLUDED_USERS_FILE):
        try:
            with open(EXCLUDED_USERS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    for item in data:
                        if isinstance(item, dict) and "userId" in item:
                            excluded.add(int(item["userId"]))
                        elif isinstance(item, (int, str)):
                            excluded.add(int(item))
                print(f"Loaded {len(excluded)} excluded user ID(s) from {EXCLUDED_USERS_FILE}")
        except Exception as e:
            print(f"Warning: Failed to load {EXCLUDED_USERS_FILE}: {e}")
    return excluded


def parse_args():
    parser = argparse.ArgumentParser(description="Build datasets and update reference dates.")
    parser.add_argument(
        "--date", "-d",
        dest="ref_date",
        default=None,
        help="Reference date for dataset (YYYY-MM-DD). If omitted, inferred from latest video timestamp in records."
    )
    return parser.parse_args()


def main():
    args = parse_args()

    if not os.path.exists(SOURCE_JSON):
        print(f"Error: {SOURCE_JSON} not found.")
        return

    print(f"Loading {SOURCE_JSON}...")
    with open(SOURCE_JSON, "r", encoding="utf-8") as f:
        records = json.load(f)

    print(f"Total raw records: {len(records)}")

    # 基準日の判定
    ref_date = None
    if args.ref_date:
        try:
            ref_date = datetime.datetime.strptime(args.ref_date, "%Y-%m-%d").date()
        except ValueError:
            print(f"Warning: Invalid date format '{args.ref_date}'. Expected YYYY-MM-DD.")

    if not ref_date:
        latest_post_times = [r["latestPostTime"] for r in records if r.get("latestPostTime")]
        if latest_post_times:
            max_dt_str = max(latest_post_times)
            ref_date = datetime.datetime.strptime(max_dt_str[:10], "%Y-%m-%d").date()
            print(f"Auto-detected reference date from data: {ref_date} (latest post: {max_dt_str})")
        else:
            ref_date = datetime.date.today()
            print(f"Fallback to today's date: {ref_date}")

    # 非表示対象ユーザーの除外
    excluded_ids = load_excluded_user_ids()
    excluded_records = [r for r in records if int(r.get("userId", 0)) in excluded_ids]
    if excluded_records:
        print(f"Excluding {len(excluded_records)} user(s):")
        for r in excluded_records:
            print(f"  - User ID: {r.get('userId')}, Name: {r.get('userName')}")

    records = [r for r in records if int(r.get("userId", 0)) not in excluded_ids]
    print(f"Total records after exclusion: {len(records)}")

    active_count = sum(1 for r in records if r.get("isActiveRecent1Year"))
    print(f"Active users (recent 1 year): {active_count} / {len(records)} ({active_count / len(records) * 100:.1f}%)")

    # Save as data.json
    json_path = os.path.join(OUTPUT_DIR, "data.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)
    print(f"Saved {json_path}")

    # Save as data.js for direct file:// browsing without CORS issues
    js_path = os.path.join(OUTPUT_DIR, "data.js")
    with open(js_path, "w", encoding="utf-8") as f:
        f.write("window.NICO_ONBOARD_DATA = ")
        json.dump(records, f, ensure_ascii=False)
        f.write(";\n")
    print(f"Saved {js_path}")

    # Also save combined CSV for user reference
    df_all = pd.DataFrame(records)
    csv_path = os.path.join(OUTPUT_DIR, "merged_onboard_users.csv")
    df_all.to_csv(csv_path, index=False, encoding="utf-8-sig")
    print(f"Saved {csv_path}")

    # Save active users CSV if needed
    active_records = [r for r in records if r.get("isActiveRecent1Year")]
    df_active = pd.DataFrame(active_records)
    active_csv_path = os.path.join(OUTPUT_DIR, "merged_active_onboard_users.csv")
    df_active.to_csv(active_csv_path, index=False, encoding="utf-8-sig")
    print(f"Saved {active_csv_path}")

    # index.html および README.md の基準日を自動更新
    update_documentation_dates(ref_date)


if __name__ == "__main__":
    main()


