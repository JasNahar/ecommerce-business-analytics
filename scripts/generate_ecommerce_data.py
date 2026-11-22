import csv
import random
from datetime import date, timedelta
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
SEED = 2024
random.seed(SEED)

CUSTOMER_COUNT = 1200
PRODUCT_COUNT = 80
ORDER_COUNT = 9000
START_DATE = date(2024, 1, 1)
END_DATE = date(2025, 12, 31)

REGIONS = [
    ("North America", "United States"),
    ("Europe", "United Kingdom"),
    ("Asia Pacific", "Singapore"),
    ("Latin America", "Brazil"),
    ("Middle East", "United Arab Emirates"),
]

CATEGORIES = ["Electronics", "Home", "Fashion", "Sports", "Beauty", "Office"]
CHANNELS = ["Website", "Mobile App", "Marketplace", "Social", "Retail"]


def write_csv(name, fieldnames, rows):
    path = DATA_DIR / name
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def date_between(start, end):
    span = (end - start).days
    return start + timedelta(days=random.randint(0, span))


def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    regions = []
    for region_id, (region_name, country) in enumerate(REGIONS, start=1):
        regions.append({"region_id": region_id, "region_name": region_name, "country": country})
    write_csv("regions.csv", ["region_id", "region_name", "country"], regions)

    channels = [
        {"channel_id": channel_id, "channel_name": name, "channel_type": "Owned" if name in ("Website", "Mobile App") else "Third-party"}
        for channel_id, name in enumerate(CHANNELS, start=1)
    ]
    write_csv("channels.csv", ["channel_id", "channel_name", "channel_type"], channels)

    first_names = ["Avery", "Jordan", "Morgan", "Taylor", "Riley", "Casey", "Jamie", "Reese", "Cameron", "Parker"]
    last_names = ["Chen", "Garcia", "Patel", "Smith", "Kim", "Brown", "Wilson", "Lee", "Martin", "Singh"]
    customers = []
    for customer_id in range(1, CUSTOMER_COUNT + 1):
        signup = date_between(START_DATE - timedelta(days=730), END_DATE - timedelta(days=180))
        loyal = 1 if random.random() < 0.23 else 0
        customers.append({
            "customer_id": customer_id,
            "name": f"{random.choice(first_names)} {random.choice(last_names)}",
            "email": f"customer{customer_id}@example.com",
            "signup_date": signup.isoformat(),
            "region_id": random.randint(1, len(REGIONS)),
            "loyalty_member": loyal,
            "segment_cohort": "Loyal" if loyal else "Standard",
        })
    write_csv("customers.csv", ["customer_id", "name", "email", "signup_date", "region_id", "loyalty_member", "segment_cohort"], customers)

    products = []
    product_names = {
        "Electronics": ["Wireless Headphones", "Smart Watch", "Bluetooth Speaker", "USB-C Hub", "Tablet Stand"],
        "Home": ["Ceramic Vase", "Table Lamp", "Throw Blanket", "Storage Basket", "Coffee Maker"],
        "Fashion": ["Everyday Sneakers", "Leather Tote", "Linen Shirt", "Sunglasses", "Winter Jacket"],
        "Sports": ["Yoga Mat", "Running Shoes", "Resistance Bands", "Trail Bottle", "Fitness Tracker"],
        "Beauty": ["Face Serum", "Hair Kit", "Gift Set", "Skincare Bundle", "Body Lotion"],
        "Office": ["Desk Organizer", "Notebook Set", "Ergonomic Mouse", "Monitor Arm", "Task Chair"],
    }
    for product_id in range(1, PRODUCT_COUNT + 1):
        category = CATEGORIES[(product_id - 1) % len(CATEGORIES)]
        name_base = product_names[category][(product_id - 1) // len(CATEGORIES) % len(product_names[category])]
        price = round(random.uniform(18, 280) * (1 if category != "Electronics" else 1.35), 2)
        unit_cost = round(price * random.uniform(0.48, 0.72), 2)
        products.append({
            "product_id": product_id,
            "sku": f"SKU-{product_id:04d}",
            "product_name": f"{name_base} {product_id}",
            "category": category,
            "unit_price": price,
            "unit_cost": unit_cost,
            "active": 1 if random.random() < 0.92 else 0,
        })
    write_csv("products.csv", ["product_id", "sku", "product_name", "category", "unit_price", "unit_cost", "active"], products)

    orders = []
    order_items = []
    returns = []
    order_id = 1
    item_id = 1
    return_id = 1
    for _ in range(ORDER_COUNT):
        customer_id = random.randint(1, CUSTOMER_COUNT)
        channel_id = random.randint(1, len(CHANNELS))
        region_id = random.randint(1, len(REGIONS))
        ordered_at = date_between(START_DATE, END_DATE)
        item_count = random.choices([1, 2, 3, 4], [55, 28, 12, 5])[0]
        order_gross = 0
        order_discount = 0
        order_status = random.choices(["Completed", "Processing", "Cancelled"], [88, 8, 4])[0]
        for _ in range(item_count):
            product = products[random.randint(0, PRODUCT_COUNT - 1)]
            quantity = random.choices([1, 2, 3], [70, 24, 6])[0]
            discount_rate = random.choice([0, 0, 0.05, 0.10, 0.15, 0.20])
            gross = round(float(product["unit_price"]) * quantity, 2)
            discount = round(gross * discount_rate, 2)
            net_revenue = round(gross - discount, 2)
            cost = round(float(product["unit_cost"]) * quantity, 2)
            order_gross += gross
            order_discount += discount
            order_items.append({
                "order_item_id": item_id,
                "order_id": order_id,
                "product_id": product["product_id"],
                "quantity": quantity,
                "gross_revenue": gross,
                "discount_amount": discount,
                "net_revenue": net_revenue,
                "cost": cost,
            })
            item_id += 1

            if order_status == "Completed" and random.random() < 0.055:
                returned_quantity = random.randint(1, quantity)
                refund_amount = round(net_revenue * returned_quantity / quantity, 2)
                returns.append({
                    "return_id": return_id,
                    "order_item_id": item_id - 1,
                    "returned_quantity": returned_quantity,
                    "refund_amount": refund_amount,
                    "return_reason": random.choice(["Damaged", "Wrong item", "Too small", "Changed mind", "Late delivery"]),
                    "returned_date": (ordered_at + timedelta(days=random.randint(2, 35))).isoformat(),
                })
                return_id += 1

        orders.append({
            "order_id": order_id,
            "customer_id": customer_id,
            "channel_id": channel_id,
            "region_id": region_id,
            "ordered_at": ordered_at.isoformat(),
            "status": order_status,
            "gross_revenue": round(order_gross, 2),
            "discount_amount": round(order_discount, 2),
        })
        order_id += 1

    write_csv("orders.csv", ["order_id", "customer_id", "channel_id", "region_id", "ordered_at", "status", "gross_revenue", "discount_amount"], orders)
    write_csv("order_items.csv", ["order_item_id", "order_id", "product_id", "quantity", "gross_revenue", "discount_amount", "net_revenue", "cost"], order_items)
    write_csv("returns.csv", ["return_id", "order_item_id", "returned_quantity", "refund_amount", "return_reason", "returned_date"], returns)

    print(f"Generated {CUSTOMER_COUNT} customers, {PRODUCT_COUNT} products, {ORDER_COUNT} orders, {item_id - 1} order items, and {return_id - 1} returns.")


if __name__ == "__main__":
    main()
