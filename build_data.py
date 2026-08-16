import os
import json
import shutil
import pandas as pd

SOURCE_JSON = r"C:\Users\estshorter\src\nico-analyzer\results\first_onboard_all.json"
OUTPUT_DIR = r"C:\Users\estshorter\src\nico-onboard-viewer"
EXCLUDED_USERS_FILE = os.path.join(OUTPUT_DIR, "excluded_users.json")

# デフォルトの除外対象ユーザーIDセット（オプトアウト・非表示リクエスト対応）
DEFAULT_EXCLUDED_USER_IDS = {280096}


def load_excluded_user_ids() -> set[int]:
    """除外対象ユーザーIDのセットを取得する"""
    excluded = set(DEFAULT_EXCLUDED_USER_IDS)
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


def main():
    if not os.path.exists(SOURCE_JSON):
        print(f"Error: {SOURCE_JSON} not found.")
        return
        
    print(f"Loading {SOURCE_JSON}...")
    with open(SOURCE_JSON, "r", encoding="utf-8") as f:
        records = json.load(f)
        
    print(f"Total raw records: {len(records)}")

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


if __name__ == "__main__":
    main()

