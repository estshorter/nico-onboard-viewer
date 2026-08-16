import os
import glob
import pandas as pd
import json

SOURCE_DIR = r"C:\Users\estshorter\src\nico-analyzer\results"
OUTPUT_DIR = r"C:\Users\estshorter\src\nico-onboard-viewer"

def main():
    records = []
    
    # Target files
    target_files = [
        ("2016", os.path.join(SOURCE_DIR, "first_onboard_2016_active_recent_1year.csv")),
        ("2021", os.path.join(SOURCE_DIR, "first_onboard_2021_active_recent_1year.csv")),
        ("2023", os.path.join(SOURCE_DIR, "first_onboard_2023_active_recent_1year.csv")),
        ("2025", os.path.join(SOURCE_DIR, "first_onboard_2025_active_recent_1year.csv")),
    ]
    
    for year, filepath in target_files:
        if not os.path.exists(filepath):
            print(f"Warning: {filepath} not found.")
            continue
            
        df = pd.read_csv(filepath)
        print(f"Loaded {year}: {len(df)} records from {os.path.basename(filepath)}")
        
        for _, row in df.iterrows():
            # Handle column variations
            first_title = row.get("firstTitle") if "firstTitle" in row and pd.notna(row.get("firstTitle")) else row.get("title", "")
            first_id = row.get("firstContentId") if "firstContentId" in row and pd.notna(row.get("firstContentId")) else row.get("contentId", "")
            latest_time = str(row.get("latestPostTime", "")) if pd.notna(row.get("latestPostTime")) else ""
            latest_title = str(row.get("latestTitle", "")) if pd.notna(row.get("latestTitle")) else ""
            latest_id = str(row.get("latestContentId", "")) if pd.notna(row.get("latestContentId")) else ""
            
            record = {
                "userId": str(row["userId"]),
                "userName": str(row["userName"]) if pd.notna(row["userName"]) else "名無し",
                "debutYear": int(year),
                "firstPostTime": str(row["firstPostTime"]) if pd.notna(row["firstPostTime"]) else "",
                "firstTitle": str(first_title),
                "firstContentId": str(first_id),
                "latestPostTime": latest_time,
                "latestTitle": latest_title,
                "latestContentId": latest_id,
            }
            records.append(record)
            
    print(f"Total merged records: {len(records)}")
    
    # Save as JSON
    json_path = os.path.join(OUTPUT_DIR, "data.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)
    print(f"Saved {json_path}")
    
    # Also save as data.js for direct file:// browsing without CORS issues
    js_path = os.path.join(OUTPUT_DIR, "data.js")
    with open(js_path, "w", encoding="utf-8") as f:
        f.write("window.NICO_ONBOARD_DATA = ")
        json.dump(records, f, ensure_ascii=False)
        f.write(";\n")
    print(f"Saved {js_path}")

    # Also save combined CSV for user reference
    df_all = pd.DataFrame(records)
    csv_path = os.path.join(OUTPUT_DIR, "merged_active_onboard_users.csv")
    df_all.to_csv(csv_path, index=False, encoding="utf-8-sig")
    print(f"Saved {csv_path}")

if __name__ == "__main__":
    main()
