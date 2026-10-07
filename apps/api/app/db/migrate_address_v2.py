"""
Migration script for Customer Addresses V2 schema additions.
Additive migration: safe, preserves all existing data and legacy fields.
"""
import sqlite3
from pathlib import Path

def run_migration(db_path: str = "pharmatrust.db"):
    db_file = Path(db_path)
    if not db_file.exists():
        print(f"Database {db_path} not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    existing_cols = [c[1] for c in cursor.execute("PRAGMA table_info(customer_addresses);").fetchall()]

    cols_to_add = [
        ("province_name", "VARCHAR(255)"),
        ("commune_code", "VARCHAR(50)"),
        ("commune_name", "VARCHAR(255)"),
        ("formatted_address", "VARCHAR(500)"),
        ("delivery_note", "TEXT"),
        ("is_verified", "BOOLEAN DEFAULT 0"),
        ("verified_at", "DATETIME"),
        ("updated_at", "DATETIME"),
    ]

    for col_name, col_type in cols_to_add:
        if col_name not in existing_cols:
            cursor.execute(f"ALTER TABLE customer_addresses ADD COLUMN {col_name} {col_type};")
            print(f"Added column: {col_name}")
        else:
            print(f"Column {col_name} already exists.")

    conn.commit()
    conn.close()
    print("Address V2 migration complete.")

if __name__ == "__main__":
    run_migration()
