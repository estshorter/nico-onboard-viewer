import os
import json
import shutil
import pandas as pd

SOURCE_JSON = r"C:\Users\estshorter\src\nico-analyzer\results\first_onboard_all.json"
OUTPUT_DIR = r"C:\Users\estshorter\src\nico-onboard-viewer"

def main():
    if not os.path.exists(SOURCE_JSON):
        print(f"Error: {SOURCE_JSON} not found.")
        return
        
    print(f"Loading {SOURCE_JSON}...")
    with open(SOURCE_JSON, "r", encoding="utf-8") as f:
        records = json.load(f)
        
    print(f"Total merged records: {len(records)}")
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

if __name__ == "__main__":
    main()
