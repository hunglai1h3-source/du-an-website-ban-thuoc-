#!/usr/bin/env python3
"""
scripts/migrate_phase2_aftersales.py

MIGRATION SCRIPT FOR PHASE 2: RETURNS + EXCHANGES + REFUNDS + REVERSE LOGISTICS
Tạo schema chuẩn hóa:
1. return_requests
2. return_items
3. return_evidences
4. return_status_history
5. refunds
6. refund_attempts
7. exchange_orders
8. exchange_items
Cập nhật bảng orders, stock_movements nếu cần.
"""

import sqlite3
import sys
from pathlib import Path


def run_migration(db_path: str = "pharmatrust.db"):
    print(f"Bắt đầu migration Phase 2 cho database: {db_path}")
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    c.execute("PRAGMA foreign_keys = ON")

    # 1. Bảng return_requests
    c.execute("""
        CREATE TABLE IF NOT EXISTS return_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            return_code VARCHAR(50) NOT NULL UNIQUE,
            order_id INTEGER NOT NULL,
            user_id INTEGER,
            customer_name VARCHAR(255) NOT NULL,
            customer_phone VARCHAR(50) NOT NULL,
            customer_email VARCHAR(255),
            request_type VARCHAR(20) NOT NULL DEFAULT 'RETURN', -- RETURN | EXCHANGE
            status VARCHAR(50) NOT NULL DEFAULT 'REQUESTED',
            reason_code VARCHAR(50) NOT NULL,
            reason_text VARCHAR(255) NOT NULL,
            customer_note TEXT,
            return_method VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER_SHIP', -- CUSTOMER_SHIP | STORE_RETURN | PICKUP
            carrier_name VARCHAR(100),
            tracking_code VARCHAR(100),
            return_address_snapshot TEXT,
            admin_note TEXT,
            customer_visible_note TEXT,
            rejection_reason TEXT,
            assigned_staff_id INTEGER,
            reviewed_by INTEGER,
            approved_by INTEGER,
            received_by INTEGER,
            inspected_by INTEGER,
            requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            reviewed_at DATETIME,
            approved_at DATETIME,
            rejected_at DATETIME,
            received_at DATETIME,
            inspected_at DATETIME,
            closed_at DATETIME,
            cancelled_at DATETIME,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
            FOREIGN KEY (assigned_staff_id) REFERENCES users (id) ON DELETE SET NULL,
            FOREIGN KEY (reviewed_by) REFERENCES users (id) ON DELETE SET NULL,
            FOREIGN KEY (approved_by) REFERENCES users (id) ON DELETE SET NULL,
            FOREIGN KEY (received_by) REFERENCES users (id) ON DELETE SET NULL,
            FOREIGN KEY (inspected_by) REFERENCES users (id) ON DELETE SET NULL
        )
    """)
    c.execute("CREATE INDEX IF NOT EXISTS idx_return_requests_order_id ON return_requests(order_id)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_return_requests_user_id ON return_requests(user_id)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_return_requests_status ON return_requests(status)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_return_requests_code ON return_requests(return_code)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_return_requests_phone ON return_requests(customer_phone)")

    # 2. Bảng return_items
    c.execute("""
        CREATE TABLE IF NOT EXISTS return_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            return_request_id INTEGER NOT NULL,
            order_item_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            sku_id INTEGER,
            product_name VARCHAR(500) NOT NULL,
            original_quantity INTEGER NOT NULL,
            requested_quantity INTEGER NOT NULL,
            approved_quantity INTEGER NOT NULL DEFAULT 0,
            received_quantity INTEGER NOT NULL DEFAULT 0,
            unit_price_at_purchase NUMERIC(12, 2) NOT NULL,
            allocated_discount NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
            net_paid_amount NUMERIC(12, 2) NOT NULL,
            requested_refund_amount NUMERIC(12, 2) NOT NULL,
            approved_refund_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
            rejected_quantity INTEGER NOT NULL DEFAULT 0,
            restock_quantity INTEGER NOT NULL DEFAULT 0,
            customer_reason TEXT,
            condition_reported VARCHAR(50) DEFAULT 'SEALED',
            condition VARCHAR(50) NOT NULL DEFAULT 'UNKNOWN',
            restock_eligible BOOLEAN NOT NULL DEFAULT 0,
            restock_destination VARCHAR(50), -- SELLABLE_STOCK | QUARANTINE | NON_SELLABLE_DISPOSE
            original_batch_reference VARCHAR(100),
            restocked_batch_id INTEGER,
            restocked_warehouse_id INTEGER,
            inspection_note TEXT,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (return_request_id) REFERENCES return_requests (id) ON DELETE CASCADE,
            FOREIGN KEY (order_item_id) REFERENCES order_items (id) ON DELETE RESTRICT,
            FOREIGN KEY (product_id) REFERENCES canonical_products (id) ON DELETE RESTRICT,
            FOREIGN KEY (sku_id) REFERENCES product_skus (id) ON DELETE SET NULL,
            FOREIGN KEY (restocked_batch_id) REFERENCES inventory_batches (id) ON DELETE SET NULL,
            FOREIGN KEY (restocked_warehouse_id) REFERENCES warehouses (id) ON DELETE SET NULL
        )
    """)
    c.execute("CREATE INDEX IF NOT EXISTS idx_return_items_req_id ON return_items(return_request_id)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_return_items_order_item_id ON return_items(order_item_id)")

    # 3. Bảng return_evidences
    c.execute("""
        CREATE TABLE IF NOT EXISTS return_evidences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            return_request_id INTEGER NOT NULL,
            return_item_id INTEGER,
            storage_key VARCHAR(500) NOT NULL,
            file_url VARCHAR(1000) NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            mime_type VARCHAR(100) NOT NULL,
            file_size INTEGER NOT NULL,
            file_category VARCHAR(50) NOT NULL DEFAULT 'DAMAGE_PHOTO',
            uploaded_by INTEGER,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (return_request_id) REFERENCES return_requests (id) ON DELETE CASCADE,
            FOREIGN KEY (return_item_id) REFERENCES return_items (id) ON DELETE SET NULL,
            FOREIGN KEY (uploaded_by) REFERENCES users (id) ON DELETE SET NULL
        )
    """)
    c.execute("CREATE INDEX IF NOT EXISTS idx_return_evidences_req_id ON return_evidences(return_request_id)")

    # 4. Bảng return_status_history
    c.execute("""
        CREATE TABLE IF NOT EXISTS return_status_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            return_request_id INTEGER NOT NULL,
            from_status VARCHAR(50) NOT NULL,
            to_status VARCHAR(50) NOT NULL,
            actor_id INTEGER,
            actor_name VARCHAR(255) NOT NULL,
            actor_role VARCHAR(50) NOT NULL,
            note TEXT,
            metadata_safe TEXT,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (return_request_id) REFERENCES return_requests (id) ON DELETE CASCADE,
            FOREIGN KEY (actor_id) REFERENCES users (id) ON DELETE SET NULL
        )
    """)
    c.execute("CREATE INDEX IF NOT EXISTS idx_return_history_req_id ON return_status_history(return_request_id)")

    # 5. Bảng refunds
    c.execute("""
        CREATE TABLE IF NOT EXISTS refunds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            refund_code VARCHAR(50) NOT NULL UNIQUE,
            order_id INTEGER NOT NULL,
            return_request_id INTEGER,
            payment_transaction_id INTEGER,
            amount NUMERIC(12, 2) NOT NULL,
            currency VARCHAR(10) NOT NULL DEFAULT 'VND',
            refund_method VARCHAR(50) NOT NULL, -- COD_MANUAL_BANK | CASH_AT_STORE | MOMO_ONLINE | BANK_TRANSFER
            status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING | APPROVED | PROCESSING | SUCCEEDED | FAILED | NEEDS_REVIEW | CANCELLED
            reason TEXT NOT NULL,
            idempotency_key VARCHAR(100) NOT NULL UNIQUE,
            beneficiary_bank_name VARCHAR(100),
            beneficiary_account_number VARCHAR(100),
            beneficiary_account_name VARCHAR(255),
            manual_reference_number VARCHAR(100),
            manual_proof_storage_key VARCHAR(500),
            provider_refund_id VARCHAR(100),
            provider_reference VARCHAR(100),
            failure_code VARCHAR(50),
            failure_reason TEXT,
            reconciliation_status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- MATCHED | PENDING | MISMATCH | NEEDS_REVIEW
            approved_by INTEGER,
            processed_by INTEGER,
            requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            approved_at DATETIME,
            processing_at DATETIME,
            succeeded_at DATETIME,
            failed_at DATETIME,
            cancelled_at DATETIME,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
            FOREIGN KEY (return_request_id) REFERENCES return_requests (id) ON DELETE SET NULL,
            FOREIGN KEY (payment_transaction_id) REFERENCES payment_transactions (id) ON DELETE SET NULL,
            FOREIGN KEY (approved_by) REFERENCES users (id) ON DELETE SET NULL,
            FOREIGN KEY (processed_by) REFERENCES users (id) ON DELETE SET NULL
        )
    """)
    c.execute("CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_refunds_return_id ON refunds(return_request_id)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_refunds_reconciliation ON refunds(reconciliation_status)")

    # 6. Bảng refund_attempts
    c.execute("""
        CREATE TABLE IF NOT EXISTS refund_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            refund_id INTEGER NOT NULL,
            attempt_number INTEGER NOT NULL,
            provider VARCHAR(50) NOT NULL,
            idempotency_key VARCHAR(100) NOT NULL,
            request_reference VARCHAR(100) NOT NULL,
            provider_reference VARCHAR(100),
            amount NUMERIC(12, 2) NOT NULL,
            status VARCHAR(50) NOT NULL, -- PROCESSING | SUCCEEDED | FAILED | TIMEOUT_UNKNOWN
            safe_request_metadata TEXT,
            safe_response_metadata TEXT,
            error_code VARCHAR(50),
            error_message TEXT,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (refund_id) REFERENCES refunds (id) ON DELETE CASCADE
        )
    """)
    c.execute("CREATE INDEX IF NOT EXISTS idx_refund_attempts_refund_id ON refund_attempts(refund_id)")

    # 7. Bảng exchange_orders
    c.execute("""
        CREATE TABLE IF NOT EXISTS exchange_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            exchange_code VARCHAR(50) NOT NULL UNIQUE,
            return_request_id INTEGER NOT NULL,
            original_order_id INTEGER NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
            original_credit NUMERIC(12, 2) NOT NULL,
            replacement_subtotal NUMERIC(12, 2) NOT NULL,
            price_difference NUMERIC(12, 2) NOT NULL, -- replacement_subtotal - original_credit
            additional_payment_required BOOLEAN NOT NULL DEFAULT 0,
            refund_required BOOLEAN NOT NULL DEFAULT 0,
            additional_payment_transaction_id INTEGER,
            difference_refund_id INTEGER,
            replacement_fulfillment_id INTEGER,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (return_request_id) REFERENCES return_requests (id) ON DELETE CASCADE,
            FOREIGN KEY (original_order_id) REFERENCES orders (id) ON DELETE CASCADE,
            FOREIGN KEY (additional_payment_transaction_id) REFERENCES payment_transactions (id) ON DELETE SET NULL,
            FOREIGN KEY (difference_refund_id) REFERENCES refunds (id) ON DELETE SET NULL,
            FOREIGN KEY (replacement_fulfillment_id) REFERENCES order_fulfillments (id) ON DELETE SET NULL
        )
    """)
    c.execute("CREATE INDEX IF NOT EXISTS idx_exchange_orders_req_id ON exchange_orders(return_request_id)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_exchange_orders_code ON exchange_orders(exchange_code)")

    # 8. Bảng exchange_items
    c.execute("""
        CREATE TABLE IF NOT EXISTS exchange_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            exchange_order_id INTEGER NOT NULL,
            original_order_item_id INTEGER NOT NULL,
            replacement_product_id INTEGER NOT NULL,
            replacement_sku_id INTEGER,
            replacement_product_name VARCHAR(500) NOT NULL,
            quantity INTEGER NOT NULL,
            replacement_unit_price NUMERIC(12, 2) NOT NULL,
            original_credit_amount NUMERIC(12, 2) NOT NULL,
            difference_amount NUMERIC(12, 2) NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (exchange_order_id) REFERENCES exchange_orders (id) ON DELETE CASCADE,
            FOREIGN KEY (original_order_item_id) REFERENCES order_items (id) ON DELETE RESTRICT,
            FOREIGN KEY (replacement_product_id) REFERENCES canonical_products (id) ON DELETE RESTRICT,
            FOREIGN KEY (replacement_sku_id) REFERENCES product_skus (id) ON DELETE SET NULL
        )
    """)
    c.execute("CREATE INDEX IF NOT EXISTS idx_exchange_items_order_id ON exchange_items(exchange_order_id)")

    # 9. Bổ sung cột user_id vào bảng orders nếu chưa có
    c.execute("PRAGMA table_info(orders)")
    order_cols = {row[1] for row in c.fetchall()}
    if "user_id" not in order_cols:
        c.execute("ALTER TABLE orders ADD COLUMN user_id INTEGER REFERENCES users(id)")
        print("  + Bổ sung cột user_id vào bảng orders")

    conn.commit()
    conn.close()
    print("Migration Phase 2 hoàn tất thành công 100%!")


if __name__ == "__main__":
    run_migration()
