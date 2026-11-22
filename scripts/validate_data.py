import csv
from pathlib import Path


DATA_DIR = Path(__file__).resolve().parents[1] / "data"


def read_csv(name):
    with (DATA_DIR / name).open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def validate():
    regions = read_csv("regions.csv")
    channels = read_csv("channels.csv")
    customers = read_csv("customers.csv")
    products = read_csv("products.csv")
    orders = read_csv("orders.csv")
    items = read_csv("order_items.csv")
    returns = read_csv("returns.csv")

    region_ids = {row["region_id"] for row in regions}
    channel_ids = {row["channel_id"] for row in channels}
    customer_ids = {row["customer_id"] for row in customers}
    product_ids = {row["product_id"] for row in products}
    order_ids = {row["order_id"] for row in orders}
    item_ids = {row["order_item_id"] for row in items}

    assert regions and channels and customers and products and orders and items
    assert all(row["region_id"] in region_ids for row in customers)
    assert all(row["customer_id"] in customer_ids for row in orders)
    assert all(row["channel_id"] in channel_ids for row in orders)
    assert all(row["region_id"] in region_ids for row in orders)
    assert all(row["order_id"] in order_ids for row in items)
    assert all(row["product_id"] in product_ids for row in items)
    assert all(row["order_item_id"] in item_ids for row in returns)
    assert all(int(row["quantity"]) > 0 for row in items)
    assert all(float(row["net_revenue"]) >= 0 for row in items)
    assert all(int(row["returned_quantity"]) > 0 for row in returns)
    print(f"Validated {len(customers)} customers, {len(products)} products, {len(orders)} orders, {len(items)} items, and {len(returns)} returns.")


if __name__ == "__main__":
    validate()
